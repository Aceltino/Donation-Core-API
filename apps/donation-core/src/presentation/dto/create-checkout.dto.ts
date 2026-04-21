import { IsNumber, IsPositive, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  ngoId: string;

  @IsString()
  donorId: string;

  @IsUrl()
  successUrl: string;

  @IsUrl()
  cancelUrl: string;
}