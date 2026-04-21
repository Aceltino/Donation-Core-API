import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../app.module';
import { StripeService } from '../infrastructure/stripe.service';
import { PrismaClient } from '@prisma/client';

/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

describe('StripeWebhook Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

    const mockPrisma = {
      processedWebhook: {
        create: jest.fn().mockResolvedValue({}),
      },
      donation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'don_1',
          stripeCheckoutSessionId: 'cs_test_123',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      outboxEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
    } as unknown as PrismaClient;

    const mockStripeService = {
      constructWebhookEvent: jest.fn().mockReturnValue({
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
          },
        },
      }),
    } as unknown as StripeService;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaClient)
      .useValue(mockPrisma)
      .overrideProvider(StripeService)
      .useValue(mockStripeService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process webhook route integration with mocked dependencies', async () => {
    await supertest(app.getHttpServer())
      .post('/webhooks/stripe')
      .set('Stripe-Signature', 'signature')
      .set('Content-Type', 'application/json')
      .send({})
      .expect(201)
      .expect((res) => {
        expect(res.body.received).toBe(true);
      });
  });
});
