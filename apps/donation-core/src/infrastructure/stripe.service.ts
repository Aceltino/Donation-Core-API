import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'FATAL: STRIPE_SECRET_KEY não está definida nas variáveis de ambiente!',
      );
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      maxNetworkRetries: 3,
      appInfo: {
        name: 'DonationCoreApp',
        version: '1.0.0',
      },
    });
  }

  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: 'Donation',
              },
              unit_amount: Math.round(params.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
      });
    } catch (error: any) {
      console.error('[Stripe Error] Erro ao criar Checkout Session:', error.message);
      throw new InternalServerErrorException(
        'Não foi possível iniciar a sessão de pagamento.',
      );
    }
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Falha na verificação de assinatura: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
}
