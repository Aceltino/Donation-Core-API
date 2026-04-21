import { Body, Controller, Post, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateCheckoutSessionUseCase } from '../application/create-checkout-session.use-case';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('donations') // Rota base: /donations
export class DonationController {
  private readonly logger = new Logger(DonationController.name);

  constructor(
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
  ) { }

  @Post('checkout') // Rota final: /donations/checkout
  @UsePipes(new ValidationPipe()) // Garante que o New Relic veja dados limpos
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    this.logger.log(`[CORE] Processando Use Case de Checkout`);

    // Se o New Relic estiver no main.ts, ele vai medir quanto tempo o execute() leva
    return await this.createCheckoutSessionUseCase.execute(dto);
  }
}