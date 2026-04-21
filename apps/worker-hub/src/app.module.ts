import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LambdaService } from './infrastructure/lambda.service';
import { DonationEventsProcessor } from './application/donation-events.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../.env.local'),
      ],
      validationSchema: Joi.object({
        REDIS_URL: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        LAMBDA_FUNCTION_NAME: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        // Isso garante que o Pino sempre cuspa JSON puro,
        // perfeito para Docker, CloudWatch e New Relic!
      },
    }),

    ClsModule.forRoot({
      global: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, LambdaService, DonationEventsProcessor],
})
export class AppModule {}
