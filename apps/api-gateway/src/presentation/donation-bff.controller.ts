import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateCheckoutBffDto } from './dto/create-checkout-bff.dto';

@ApiTags('donations')
@Controller('api/v1/donations')
export class DonationBffController {
  private readonly logger = new Logger(DonationBffController.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
  ) { }

  @Post('checkout')
  @ApiOperation({ summary: 'Create donation checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createCheckout(@Body() dto: CreateCheckoutBffDto) {
    const correlationId = this.cls.get('correlationId');

    // O New Relic usa esses nomes para criar o mapa de serviços
    this.logger.log(`[BFF] Iniciando checkout - Donor: ${dto.donorId}`);

    try {
      // Importante: A URL deve vir do ConfigService que aponta para o container
      const donationCoreUrl = this.configService.get<string>('DONATION_CORE_URL');

      const payload = {
        ...dto,
        successUrl: this.configService.get('DONATION_SUCCESS_URL'),
        cancelUrl: this.configService.get('DONATION_CANCEL_URL'),
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${donationCoreUrl}/donations/checkout`, // Rota do Core
          payload,
          {
            headers: {
              'x-correlation-id': correlationId,
              // O Agente do New Relic injeta headers de rastreio aqui automaticamente
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`[BFF] Falha ao chamar o Core: ${error.message}`);

      // Captura o status real vindo do Core, se existir
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException('Erro na comunicação com o serviço de doações', status);
    }
  }
}