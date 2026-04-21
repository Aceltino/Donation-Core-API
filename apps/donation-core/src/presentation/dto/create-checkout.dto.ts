import { IsNumber, IsPositive, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  ngoId: string;

  @IsString()
  donorId: string;

  @IsUrl({ require_tld: false })
  successUrl: string;

  @IsUrl({ require_tld: false })
  cancelUrl: string;
}