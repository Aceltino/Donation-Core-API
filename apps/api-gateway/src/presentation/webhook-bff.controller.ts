import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common'; // <-- Separamos aqui como tipo!
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
    async forwardStripeWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
        this.logger.log('[BFF] Repassando RawBody do Stripe para o Core...');
        const donationCoreUrl = this.configService.get<string>('DONATION_CORE_URL');

        try {
            // 1. Pegamos o corpo bruto (Buffer)
            const rawPayload = req.rawBody;

            const response = await firstValueFrom(
                this.httpService.post(
                    `${donationCoreUrl}/webhooks/stripe`,
                    rawPayload, // Enviamos o BUFFER, não o objeto JSON
                    {
                        headers: {
                            'stripe-signature': req.headers['stripe-signature'],
                            'content-type': 'application/json', // Mantemos o type, mas o conteúdo é o buffer
                        },
                    }
                )
            );

            return res.status(response.status).send(response.data);
        } catch (error: any) {
            this.logger.error(`[BFF] Erro no repasse: ${error.message}`);
            const status = error.response?.status || 500;
            return res.status(status).send(error.response?.data);
        }
    }
}