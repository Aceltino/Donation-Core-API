import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express'; // <-- AQUI FOI CORRIGIDO
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
    async forwardStripeWebhook(@Req() req: Request, @Res() res: Response) {
        this.logger.log('[BFF] Recebendo Webhook do Stripe e repassando ao Core...');
        const donationCoreUrl = this.configService.get<string>('DONATION_CORE_URL');

        try {
            const stripeSignature = req.headers['stripe-signature'];

            const response = await firstValueFrom(
                this.httpService.post(
                    `${donationCoreUrl}/webhooks/stripe`,
                    req.body,
                    {
                        headers: {
                            'stripe-signature': stripeSignature,
                        },
                    }
                )
            );

            return res.status(response.status).send(response.data);
        } catch (error: any) {
            this.logger.error(`[BFF] Erro ao repassar Webhook para o Core: ${error.message}`);
            const status = error.response?.status || 500;
            return res.status(status).send(error.response?.data || 'Erro interno no BFF ao processar webhook');
        }
    }
}