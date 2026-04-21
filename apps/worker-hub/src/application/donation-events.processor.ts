import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Job, Queue, JobScheduler, Worker } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { LambdaService } from '../infrastructure/lambda.service';
import { ImpactReportPayload } from '../domain/impact-report';

@Injectable()
export class DonationEventsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DonationEventsProcessor.name);
  private readonly connection = {
    url: process.env.REDIS_URL,
  };
  private readonly jobScheduler: JobScheduler;
  private readonly dlqQueue: Queue;
  private readonly worker: Worker;

  constructor(
    private readonly lambdaService: LambdaService,
    private readonly cls: ClsService,
  ) {
    this.jobScheduler = new JobScheduler('donation-events-queue', {
      connection: this.connection,
    });
    this.dlqQueue = new Queue('donation-events-dlq', {
      connection: this.connection,
    });
    this.worker = new Worker(
      'donation-events-queue',
      async (job) => this.handleJob(job),
      {
        connection: this.connection,
        concurrency: 5,
        lockDuration: 300000,
        autorun: true,
      },
    );

    this.worker.on('failed', (job, err) => {
      void (async () => {
        if (!job) return;
        this.logger.error(
          `Job ${job.id} failed on attempt ${job.attemptsMade}: ${err.message}`,
        );
        const attempts = job.opts.attempts ?? 1;
        if (job.attemptsMade >= attempts) {
          await this.dlqQueue.add(job.name, job.data, {
            jobId: `dlq-${job.id}`,
            removeOnComplete: true,
            removeOnFail: false,
          });
          this.logger.error(
            `Moved job ${job.id} to DLQ after ${job.attemptsMade} attempts`,
          );
        }
      })();
    });

    this.worker.on('error', (error) => {
      this.logger.error('Worker error', error);
    });
  }

  async onModuleInit() {
    await this.jobScheduler.waitUntilReady();
    this.logger.log('DonationEventsProcessor initialized');
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.jobScheduler.close();
    await this.dlqQueue.close();
  }

  private async handleJob(job: Job) {
    const payload = job.data as ImpactReportPayload;
    if (payload.correlationId) {
      this.cls.set('correlationId', payload.correlationId);
    }
    this.logger.log(`Processing job ${job.id} type ${job.name}`, {
      correlationId: payload.correlationId,
    });
    // ... rest of the method

    switch (job.name) {
      case 'DonationConfirmed':
        return this.processDonationConfirmed(payload);
      case 'SubscriptionFailed':
        return this.processSubscriptionFailed(payload);
      default:
        this.logger.warn(`Unsupported event type ${job.name}`);
        return Promise.resolve();
    }
  }

  private async processDonationConfirmed(payload: ImpactReportPayload) {
    await this.lambdaService.generateImpactReport({
      ...payload,
      processedAt: new Date().toISOString(),
    });
    this.logger.log(`Processed DonationConfirmed for ${payload.donationId}`);
  }

  private processSubscriptionFailed(payload: ImpactReportPayload) {
    this.logger.warn(
      `SubscriptionFailed received for donation ${payload.donationId}`,
    );
  }
}
