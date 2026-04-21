import {
  Controller,
  Post,
  Headers,
  RawBody,
  BadRequestException,
  Logger, // Adicione este import
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { StripeService } from '../infrastructure/stripe.service';
import { ProcessStripeWebhookUseCase } from '../application/process-stripe-webhook.use-case';

@Controller('webhooks')
export class StripeWebhookController {
  // 1. Instancie o Logger aqui para corrigir o erro "Property logger does not exist"
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
    @RawBody() rawBody: Buffer,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    // 2. Use a exclamação (!) ou forneça um fallback para garantir que é uma string
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not defined in environment');
      throw new BadRequestException('Webhook configuration missing');
    }

    try {
      const event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret, // Agora o TS sabe que é uma string
      );

      this.logger.log(`[STRIPE WEBHOOK] Evento recebido: ${event.type}`);

      await this.processStripeWebhookUseCase.execute(
        event,
        this.cls.get('correlationId'),
      );

      return { received: true };
    } catch (err: any) {
      this.logger.error(`[STRIPE WEBHOOK] Erro: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }
  }
}