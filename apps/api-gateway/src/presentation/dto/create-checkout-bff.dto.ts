import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateCheckoutBffDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  ngoId: string;

  @IsString()
  donorId: string;
}