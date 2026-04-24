import {
  Controller,
  Post,
  Headers,
  RawBody,
  BadRequestException,
  Logger,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { StripeService } from '../infrastructure/stripe.service';
import { ProcessStripeWebhookUseCase } from '../application/process-stripe-webhook.use-case';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';

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
    @Req() req: RawBodyRequest<Request>, // Mudança importante aqui para garantir o acesso ao buffer
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    // O segredo deve vir do ambiente
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not defined in environment');
      throw new BadRequestException('Webhook configuration missing');
    }

    // GARANTIA: O rawBody precisa existir. Se o main.ts não tiver rawBody: true, isso aqui falha.
    const rawBody = req.rawBody;

    if (!rawBody) {
      this.logger.error('[STRIPE WEBHOOK] Raw body is empty. Check main.ts configuration.');
      throw new BadRequestException('Empty request body');
    }

    try {
      const event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`[STRIPE WEBHOOK] Evento verificado: ${event.type} - ID: ${event.id}`);

      // Executa o caso de uso
      await this.processStripeWebhookUseCase.execute(
        event,
        this.cls.get('correlationId'),
      );

      return { received: true };
    } catch (err: any) {
      this.logger.error(`[STRIPE WEBHOOK] Falha na assinatura: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}