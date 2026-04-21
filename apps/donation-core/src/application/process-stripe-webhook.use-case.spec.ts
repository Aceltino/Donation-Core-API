import { Test, TestingModule } from '@nestjs/testing';
import { ProcessStripeWebhookUseCase } from './process-stripe-webhook.use-case';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/unbound-method, @typescript-eslint/require-await */

describe('ProcessStripeWebhookUseCase', () => {
  let useCase: ProcessStripeWebhookUseCase;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessStripeWebhookUseCase,
        {
          provide: PrismaClient,
          useValue: {
            processedWebhook: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
            donation: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            outboxEvent: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    useCase = module.get<ProcessStripeWebhookUseCase>(
      ProcessStripeWebhookUseCase,
    );
    prisma = module.get<PrismaClient>(PrismaClient);
  });

  it('should handle idempotency for duplicate events', async () => {
    const event = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123' } },
    } as Stripe.Event;

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(prisma),
    );
    (prisma.processedWebhook.create as jest.Mock).mockRejectedValueOnce({
      code: 'P2002',
    });

    await expect(useCase.execute(event)).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.donation.update).not.toHaveBeenCalled();
    expect(prisma.outboxEvent.create).not.toHaveBeenCalled();
  });

  it('should process checkout.session.completed event', async () => {
    const event = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123' } },
    } as Stripe.Event;

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(prisma),
    );
    (prisma.processedWebhook.create as jest.Mock).mockResolvedValue({});
    (prisma.donation.findUnique as jest.Mock).mockResolvedValue({
      id: 'don_123',
      stripeCheckoutSessionId: 'cs_test_123',
    });

    await useCase.execute(event);

    expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
      data: { id: 'evt_123', type: 'checkout.session.completed' },
    });
    expect(prisma.donation.update).toHaveBeenCalledWith({
      where: { id: 'don_123' },
      data: { status: 'COMPLETED' },
    });
    expect(prisma.outboxEvent.create).toHaveBeenCalledWith({
      data: {
        type: 'DonationConfirmed',
        payloadJson: JSON.stringify({
          donationId: 'don_123',
          sessionId: 'cs_test_123',
        }),
      },
    });
  });
});