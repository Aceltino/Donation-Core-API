import { Injectable } from '@nestjs/common';
import { PrismaClient, DonationStatus } from '@prisma/client';
import { StripeService } from '../infrastructure/stripe.service';

export interface CreateCheckoutSessionInput {
  amount: number;
  ngoId: string;
  donorId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionOutput {
  sessionId: string;
  url: string;
}

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stripeService: StripeService,
  ) {}

  async execute(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionOutput> {
    // Create Stripe session
    const session = await this.stripeService.createCheckoutSession({
      amount: input.amount,
      currency: 'usd',
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        ngoId: input.ngoId,
        donorId: input.donorId,
      },
    });

    // Save donation as PENDING
    await this.prisma.donation.create({
      data: {
        amount: input.amount,
        ngoId: input.ngoId,
        donorId: input.donorId,
        status: DonationStatus.PENDING,
        stripeCheckoutSessionId: session.id,
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }
}
