import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API Gateway (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DONATION_CORE_URL = 'http://localhost:3001';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('should validate checkout DTO', () => {
    const invalidDto = {
      amount: 'not a number',
      ngoId: 'ngo-123',
      donorId: 'donor-123',
    };

    return request(app.getHttpServer())
      .post('/api/v1/donations/checkout')
      .send(invalidDto)
      .expect(400);
  });
});
