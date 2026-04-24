import {
  Controller,
  Post,
  Headers,
  Logger,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { StripeService } from '../infrastructure/stripe.service';
import { ProcessStripeWebhookUseCase } from '../application/process-stripe-webhook.use-case';

// Importante: Importar como 'type' para não quebrar os metadados do NestJS
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly processStripeWebhookUseCase: ProcessStripeWebhookUseCase,
    private readonly cls: ClsService,
  ) { }

  @Post('stripe')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    this.logger.log(`[CORE] Recebido payload de ${req.rawBody?.length} bytes`);
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET não definida no ambiente');
      throw new BadRequestException('Configuração ausente');
    }

    const rawBody = req.rawBody;

    if (!rawBody) {
      this.logger.error('[STRIPE WEBHOOK] Raw body vazio. Verifique o main.ts');
      throw new BadRequestException('Request body vazio');
    }

    try {
      const event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`[STRIPE WEBHOOK] Evento verificado: ${event.type}`);

      await this.processStripeWebhookUseCase.execute(
        event,
        this.cls.get('correlationId'),
      );

      return { received: true };
    } catch (err: any) {
      this.logger.error(`[STRIPE WEBHOOK] Assinatura falhou: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}