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
  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  const seedService = app.get(SeedService);
  await seedService.run();

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Application is running on:${process.env.PORT} `);
}
bootstrap();
