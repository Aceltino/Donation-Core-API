import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateCheckoutBffDto } from './dto/create-checkout-bff.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';

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
  @ApiOperation({
    summary: 'Create donation checkout session',
    description: 'Creates a Stripe checkout session for a donation. The donor will be redirected to Stripe to complete the payment. Upon successful payment, Stripe will redirect back to the configured success URL.',
  })
  @ApiBody({
    type: CreateCheckoutBffDto,
    description: 'Donation checkout request data',
    schema: {
      example: {
        amount: 1000,
        ngoId: 'ngo-123',
        donorId: 'donor-456',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully. Returns the session ID and redirect URL.',
    type: CheckoutSessionResponseDto,
    schema: {
      example: {
        sessionId: 'cs_test_1234567890abcdef',
        url: 'https://checkout.stripe.com/pay/cs_test_1234567890abcdef',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data. Check the request body for validation errors.',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'amount must be a positive number',
          'ngoId should not be empty',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Something went wrong on the server side.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async createCheckout(@Body() dto: CreateCheckoutBffDto): Promise<CheckoutSessionResponseDto> {
    const correlationId = this.cls.get('correlationId');

    // O New Relic usa esses nomes para criar o mapa de serviços
    this.logger.log(`[BFF] Iniciando checkout - Donor: ${dto.donorId}`);

    try {
      // Importante: A URL deve vir do ConfigService que aponta para o container
      const donationCoreUrl = this.configService.get<string>('DONATION_CORE_URL');
      const successUrl = this.configService.get<string>('DONATION_SUCCESS_URL');
      const cancelUrl = this.configService.get<string>('DONATION_CANCEL_URL');

      if (!successUrl || !cancelUrl) {
        throw new HttpException('Configuração de URLs de sucesso e cancelamento não encontrada', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.logger.log(`[BFF] Configs: donationCoreUrl=${donationCoreUrl}, successUrl=${successUrl}, cancelUrl=${cancelUrl}`);

      const payload = {
        ...dto,
        successUrl,
        cancelUrl,
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
      this.logger.error(`[BFF] Response data: ${JSON.stringify(error.response?.data)}`);

      // Captura o status real vindo do Core, se existir
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.message || 'Erro na comunicação com o serviço de doações';
      throw new HttpException(message, status);
    }
  }
}