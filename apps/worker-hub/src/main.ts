import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import newrelicWinstonEnricher from '@newrelic/winston-enricher';

async function bootstrap() {
  // Inicializa o formatador do New Relic passando a instância do winston
  const newrelicFormatter = newrelicWinstonEnricher(winston);

  const app = await NestFactory.create(AppModule, {
    // Substitui o Logger nativo do NestJS pelo Winston
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            newrelicFormatter() // Isso injeta os metadados do New Relic em cada linha de log
          ),
        }),
      ],
    }),
  });

  await app.listen(process.env.PORTWORKER ?? 3002);
}
void bootstrap();