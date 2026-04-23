import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import * as path from 'path';
import { LoggerModule } from 'nestjs-pino';
import { ClsModule } from 'nestjs-cls';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaClient } from '@prisma/client';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeService } from './infrastructure/stripe.service';
import { OutboxRelayService } from './infrastructure/outbox-relay.service';
import { CreateCheckoutSessionUseCase } from './application/create-checkout-session.use-case';
import { ProcessStripeWebhookUseCase } from './application/process-stripe-webhook.use-case';
import { DonationController } from './presentation/donation.controller';
import { StripeWebhookController } from './presentation/stripe-webhook.controller';
import { CorrelationIdInterceptor } from './infrastructure/correlation-id.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), '../../.env'),
        path.join(process.cwd(), '.env'),
      ],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        STRIPE_SECRET_KEY: Joi.string().required(),
        STRIPE_WEBHOOK_SECRET: Joi.string().required(),
      }),
    }),
    // Configuração do BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    // Registro da fila utilizada pelo OutboxRelayService
    BullModule.registerQueue({
      name: 'donation-events-queue',
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get('NODE_ENV') === 'development';
        return {
          pinoHttp: {
            // Se estiver em dev, usa pino-pretty. Em prod, gera JSON puro (mais rápido)
            transport: isDev
              ? {
                target: 'pino-pretty',
                options: { colorize: true },
              }
              : undefined,
            customProps: (req) => ({
              correlationId: req.headers['x-correlation-id'],
            }),
          },
        };
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, DonationController, StripeWebhookController],
  providers: [
    AppService,
    StripeService,
    OutboxRelayService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: PrismaClient,
      useFactory: () => {
        return new PrismaClient({
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
          // Dica para o New Relic: logar queries ajuda no debug inicial
          log: ['query', 'info', 'warn', 'error'],
        });
      },
    },
    CreateCheckoutSessionUseCase,
    ProcessStripeWebhookUseCase,
  ],
})
export class AppModule { }
