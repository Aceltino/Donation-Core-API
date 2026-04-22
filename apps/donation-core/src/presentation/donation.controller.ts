import { Body, Controller, Post, Logger, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { CreateCheckoutSessionUseCase } from '../application/create-checkout-session.use-case';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('donations') // Rota base: /donations
export class DonationController {
  private readonly logger = new Logger(DonationController.name);

  constructor(
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
  ) { }

  @Post('checkout') // Rota final: /donations/checkout
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = error.constraints;
        return constraints ? Object.values(constraints).join(', ') : 'Validation error';
      });
      return new BadRequestException(`Validation failed: ${messages.join('; ')}`);
    }
  }))
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    this.logger.log(`[CORE] Processando Use Case de Checkout`);

    // Se o New Relic estiver no main.ts, ele vai medir quanto tempo o execute() leva
    return await this.createCheckoutSessionUseCase.execute(dto);
  }
}