import * as dotenv from 'dotenv';

dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SeedService } from './database/seeds/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  console.log('main.ts ');
  // Get allowed origins from environment or use defaults
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3000', // Your frontend URL
        'http://localhost:4200', // Angular dev server
        'http://localhost:3001', // React dev server
        'http://localhost:3002',
        'http://127.0.0.1:3004', // React dev server
        'http://localhost:3004', // React dev server
        'http://localhost:8080',
        'http://127.0.0.1:3000', // Alternative localhost
        'http://206.189.82.117:3003', // Production API URL
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Request-Method',
      'Access-Control-Allow-Origin',
    ],
    credentials: true, // If you need cookies/auth
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  const seedService = app.get(SeedService);
  await seedService.run();

  await app.listen(process.env.PORT ?? 3005);
  console.log(`🚀 Application is running on:${process.env.PORT} `);
}

bootstrap();
