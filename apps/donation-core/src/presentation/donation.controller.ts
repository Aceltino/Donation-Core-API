import { Body, Controller, Post, Get, Logger, UsePipes, ValidationPipe, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateCheckoutSessionUseCase } from '../application/create-checkout-session.use-case';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PrismaClient } from '@prisma/client'; // Import direto para garantir funcionamento imediato

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
    return await this.createCheckoutSessionUseCase.execute(dto);
  }

  // --- ROTA DE SETUP PARA TESTES NA AWS ---
  @Get('setup-test-data') // Rota final: /donations/setup-test-data
  async setupTestData() {
    this.logger.log(`[CORE] Gerando dados de teste no banco de dados...`);
    const prisma = new PrismaClient();

    try {
      // 1. Garante um Doador de teste
      const donor = await prisma.donor.upsert({
        where: { email: 'teste@doador.com' },
        update: {},
        create: {
          name: 'Doador Teste AWS',
          email: 'teste@doador.com'
        },
      });

      // 2. Garante uma ONG de teste
      const ngo = await prisma.ngo.upsert({
        where: { email: 'ong@teste.com' },
        update: {},
        create: {
          name: 'ONG Transparência Agil',
          email: 'ong@teste.com'
        },
      });

      this.logger.log(`[CORE] IDs gerados: Donor(${donor.id}), Ngo(${ngo.id})`);

      return {
        message: "Dados de teste sincronizados com sucesso!",
        data: {
          donorId: donor.id,
          ngoId: ngo.id
        }
      };
    } catch (error) {
      this.logger.error(`[CORE] Erro ao criar dados de teste: ${error.message}`);
      throw new InternalServerErrorException(`Falha na comunicação com o banco: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }
}