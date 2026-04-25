import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
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
  ) {}

  @Post('stripe')
  async forwardStripeWebhook(
    @Req() req: Request, // Usamos Request normal, pois vamos usar req como Stream
    @Res() res: Response,
  ) {
    const donationCoreUrl = this.configService.get<string>('DONATION_CORE_URL');
    const stripeSignature = req.headers['stripe-signature'] as string;
    
    // Log para você visualizar se a assinatura está chegando inteira
    this.logger.log(`[BFF] Assinatura recebida: ${stripeSignature?.substring(0, 30)}...`);

    // Acessa o Buffer injetado pelo rawBody: true no main.ts
    const rawBuffer = (req as any).rawBody; 
    
    if (!rawBuffer) {
        return res.status(400).send({ message: 'Raw body ausente no BFF' });
    }

    // Log super útil para debugar: Mostra o começo e fim do payload exato que recebemos
    const payloadString = rawBuffer.toString('utf8');
    this.logger.log(`[BFF] Payload Início: ${payloadString.substring(0, 50)}`);
    this.logger.log(`[BFF] Payload Fim: ${payloadString.substring(payloadString.length - 50)}`);

    try {
      this.logger.log('[BFF] Iniciando repasse para o Core...');

      // O segredo de ouro: Passamos o rawBuffer diretamente como "data", 
      // mas pedimos pro Axios tratar como um ArrayBuffer genérico
      const response = await firstValueFrom(
        this.httpService.post(
          `${donationCoreUrl}/webhooks/stripe`,
          rawBuffer,
          {
            headers: {
              'stripe-signature': stripeSignature,
              // Mantém o content-type exato que o Stripe mandou
              'content-type': req.headers['content-type'] || 'application/json',
              'content-length': rawBuffer.length.toString(),
            },
            // Desliga TODAS as transformações do Axios
            transformRequest: [(data) => data],
            responseType: 'arraybuffer', // Garante que a resposta também venha crua
          },
        ),
      );

      this.logger.log(`[BFF] Repasse concluído com status ${response.status}`);
      return res.status(response.status).send(response.data);
    } catch (error: any) {
      this.logger.error(`[BFF] Erro no repasse: ${error.message}`);
      if (error.response) {
         // Converte o buffer de erro para string só pra logar bonito
         const errorStr = error.response.data instanceof Buffer 
            ? error.response.data.toString() 
            : JSON.stringify(error.response.data);
         this.logger.error(`[BFF] Erro detalhado do Core: ${errorStr}`);
      }
      const status = error.response?.status || 500;
      return res.status(status).send(error.response?.data);
    }
  }
}