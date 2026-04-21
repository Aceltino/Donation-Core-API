import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaClient,
    @InjectQueue('donation-events-queue') private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    try {
      await this.queue.waitUntilReady();
      this.logger.log(
        'OutboxRelayService initialized and BullMQ connection ready',
      );
    } catch (error) {
      this.logger.error('Failed to initialize BullMQ queue', error);
    }
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  @Interval(30000)
  async relayPendingEvents() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: { status: 'pending' },
        take: 50,
      });

      for (const event of pendingEvents) {
        try {
          const job = await this.queue.add(
            event.type,
            JSON.parse(event.payloadJson),
            {
              jobId: event.id,
              removeOnComplete: true,
              removeOnFail: false,
              attempts: 5,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            },
          );

          try {
            await this.prisma.outboxEvent.update({
              where: { id: event.id },
              data: {
                status: 'processed',
              },
            });
          } catch (dbError) {
            this.logger.error(
              `Failed to update outbox event status for ${event.id}, removing queued job`,
              dbError as string,
            );
            await job.remove();
            throw dbError;
          }

          this.logger.log(`Relayed event ${event.id} to BullMQ queue`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : JSON.stringify(error);
          if (message.includes('Job with the given ID')) {
            await this.prisma.outboxEvent.update({
              where: { id: event.id },
              data: { status: 'processed' },
            });
            continue;
          }

          this.logger.error(
            `Failed to relay outbox event ${event.id}: ${message}`,
          );
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'failed',
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        'Error relaying pending outbox events',
        error as string,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
