import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('api/v1/webhooks')
export class WebhookBffController {
  private readonly logger = new Logger(WebhookBffController.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  @Post('stripe')
  async forwardStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const rawBody = req.rawBody;
    this.logger.log(
      `[BFF] Repassando Webhook. Tamanho do Buffer: ${rawBody?.length} bytes`,
    );

    if (!rawBody) {
      this.logger.error('[BFF] rawBody vazio — verifique rawBody: true no main.ts');
      return res.status(400).send({ message: 'Raw body ausente' });
    }

    const donationCoreUrl = this.configService.get<string>('DONATION_CORE_URL');
    const stripeSignature = req.headers['stripe-signature'] as string;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${donationCoreUrl}/webhooks/stripe`,
          rawBody,
          {
            headers: {
              'stripe-signature': stripeSignature,
              // MUDANÇA AQUI: Repassa o header original que o Stripe mandou
              'content-type': req.headers['content-type'] || 'application/json',
              'content-length': rawBody.length.toString(), // Convertido para string por segurança
            },
            // Manteve o Buffer intacto. Perfeito!
            transformRequest: [(data) => data],
            responseType: 'text',
          },
        ),
      );

      return res.status(response.status).send(response.data);
    } catch (error: any) {
      this.logger.error(`[BFF] Erro no repasse: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `[BFF] Resposta do donation-core: ${typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data}`,
        );
      }
      const status = error.response?.status || 500;
      return res.status(status).send(error.response?.data);
    }
  }
}