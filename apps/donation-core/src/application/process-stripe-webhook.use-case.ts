import { Injectable } from '@nestjs/common';
import { PrismaClient, DonationStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class ProcessStripeWebhookUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(event: Stripe.Event, correlationId?: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhook.create({
          data: {
            id: event.id,
            type: event.type,
          },
        });

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const donation = await tx.donation.findUnique({
            where: { stripeCheckoutSessionId: session.id },
          });

          if (donation) {
            await tx.donation.update({
              where: { id: donation.id },
              data: { status: DonationStatus.COMPLETED },
            });
            await tx.outboxEvent.create({
              data: {
                type: 'DonationConfirmed',
                payloadJson: JSON.stringify({
                  donationId: donation.id,
                  sessionId: session.id,
                  correlationId,
                }),
              },
            });
          }
        } else if (event.type === 'invoice.payment_failed') {
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription as string;
          const donation = await tx.donation.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (donation) {
            await tx.donation.update({
              where: { id: donation.id },
              data: { status: DonationStatus.FAILED },
            });
            await tx.outboxEvent.create({
              data: {
                type: 'SubscriptionFailed',
                payloadJson: JSON.stringify({
                  donationId: donation.id,
                  subscriptionId,
                  correlationId,
                }),
              },
            });
          }
        }
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        return;
      }
      throw error;
    }
  }
}
