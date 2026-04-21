import { OutboxRelayService } from './outbox-relay.service';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */

describe('OutboxRelayService', () => {
  it('should publish pending events and mark them as processed', async () => {
    const events = [
      {
        id: 'event-1',
        type: 'DonationConfirmed',
        payloadJson: JSON.stringify({ donationId: 'don-1' }),
        status: 'pending',
      },
    ];

    const mockPrisma = {
      outboxEvent: {
        findMany: jest.fn().mockResolvedValue(events),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaClient;

    const mockJob = {
      remove: jest.fn(),
    } as any;

    const mockQueue = {
      add: jest.fn().mockResolvedValue(mockJob),
    } as unknown as Queue;

    const service = new OutboxRelayService(mockPrisma, mockQueue);

    await service.relayPendingEvents();

    expect(mockQueue.add).toHaveBeenCalledWith(
      'DonationConfirmed',
      { donationId: 'don-1' },
      expect.objectContaining({
        jobId: 'event-1',
        attempts: 5,
      }),
    );
    expect(mockPrisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { status: 'processed' },
    });
  });
});
