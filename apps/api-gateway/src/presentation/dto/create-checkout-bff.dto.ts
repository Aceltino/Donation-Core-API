import { IsNumber, IsPositive, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutBffDto {
  @ApiProperty({
    description: 'The donation amount in cents (minimum 1 cent, e.g., 1000 for $10.00). Must be a positive integer.',
    example: 1000,
    minimum: 1,
    type: 'number',
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'The unique identifier of the NGO receiving the donation. Must be a non-empty string.',
    example: 'ngo-123',
    type: 'string',
    required: true,
  })
  @IsString()
  ngoId: string;

  @ApiProperty({
    description: 'The unique identifier of the donor making the donation. Must be a non-empty string.',
    example: 'donor-456',
    type: 'string',
    required: true,
  })
  @IsString()
  donorId: string;
}