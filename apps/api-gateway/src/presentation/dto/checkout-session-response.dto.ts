import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'The unique Stripe checkout session ID. Use this ID to track the session status.',
    example: 'cs_test_1234567890abcdef',
    type: 'string',
    required: true,
  })
  sessionId: string;

  @ApiProperty({
    description: 'The secure URL where the donor should be redirected to complete the payment on Stripe.',
    example: 'https://checkout.stripe.com/pay/cs_test_1234567890abcdef',
    type: 'string',
    required: true,
  })
  url: string;
}