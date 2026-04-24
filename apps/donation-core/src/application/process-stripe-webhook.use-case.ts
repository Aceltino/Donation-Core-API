@Injectable()
export class ProcessStripeWebhookUseCase {
  private readonly logger = new Logger(ProcessStripeWebhookUseCase.name);

  constructor(private readonly prisma: PrismaClient) { }

  async execute(event: Stripe.Event, correlationId?: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Idempotência: Evita processar o mesmo evento duas vezes
        await tx.processedWebhook.create({
          data: {
            id: event.id,
            type: event.type,
          },
        });

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;

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
            this.logger.log(`[WEBHOOK] Doação ${donation.id} confirmada.`);
          } else {
            this.logger.warn(`[WEBHOOK] Sessão ${session.id} não encontrada no banco.`);
          }
        }

        else if (event.type === 'invoice.payment_failed') {
          const invoice = event.data.object as Stripe.Invoice;
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
    } catch (error: any) {
      // P2002 é o código do Prisma para "Unique constraint failed" (já processamos esse evento)
      if (error.code === 'P2002') {
        this.logger.log(`[WEBHOOK] Evento ${event.id} já foi processado anteriormente.`);
        return;
      }
      this.logger.error(`[WEBHOOK] Erro ao processar transação: ${error.message}`);
      throw error;
    }
  }
}