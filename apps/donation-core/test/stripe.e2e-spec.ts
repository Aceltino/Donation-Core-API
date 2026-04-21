import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

describe('StripeWebhook (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.DATABASE_URL =
      'postgresql://postgres:password@localhost:5432/transparencia_agil?schema=public';

    const mockPrisma = {
      processedWebhook: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
      donation: { findUnique: jest.fn(), update: jest.fn() },
      outboxEvent: { create: jest.fn() },
    } as unknown as PrismaClient;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaClient)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/webhooks/stripe (POST) should reject without signature', () => {
    return request(app.getHttpServer())
      .post('/webhooks/stripe')
      .send({ type: 'checkout.session.completed' })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe('Missing Stripe signature');
      });
  });

  // Note: For full webhook testing, you'd need to mock Stripe signature
  // This is a basic test for missing signature
});
