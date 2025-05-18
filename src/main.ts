/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // app.setGlobalPrefix('api');
  // Swagger configuration
  try {
    const config = new DocumentBuilder()
      .setTitle('Supabase Backend API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.listen(process.env.PORT ?? 3000);
  } catch (error) {
    console.error(error);
  }
}
bootstrap();
