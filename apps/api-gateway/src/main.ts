import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Donation Core API Gateway')
    .setDescription('Backend for Frontend for Transparent Donations')
    .setVersion('1.0')
    .addTag('donations', 'Donation management endpoints')
    .addServer('http://localhost:3001', 'Local development')
    .addServer('https://api.your-domain.com', 'Production')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORTGATEWAY ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway is running on: http://0.0.0.0:${port}`);
}
void bootstrap();
