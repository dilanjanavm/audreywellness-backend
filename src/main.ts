import * as dotenv from 'dotenv';
import * as path from 'path';

// Load base .env file first (for shared defaults)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Check NODE_ENV after loading .env (might be set in .env file)
const env = process.env.NODE_ENV || 'development';

// Load environment-specific file (overrides base .env)
if (env === 'production') {
  const envFile = '.env.production';
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });
  console.log(`🔧 Environment: ${env}`);
  console.log(`📄 Loaded environment files: .env, ${envFile}`);
} else if (env === 'development') {
  // Try to load .env.development, but fallback to .env if it doesn't exist
  const envFile = '.env.development';
  const envPath = path.resolve(process.cwd(), envFile);
  try {
    dotenv.config({ path: envPath, override: false });
    console.log(`🔧 Environment: ${env}`);
    console.log(`📄 Loaded environment files: .env, ${envFile}`);
  } catch (error) {
    // If .env.development doesn't exist, just use .env (this is fine)
    console.log(`🔧 Environment: ${env}`);
    console.log(`📄 Loaded environment file: .env (${envFile} not found, using defaults)`);
  }
} else {
  console.log(`🔧 Environment: ${env}`);
  console.log(`📄 Loaded environment file: .env`);
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SeedService } from './database/seeds/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  console.log('main.ts ');
  
  // Get current environment (check again after .env files are loaded)
  const currentEnv = process.env.NODE_ENV || 'development';
  console.log(`🔍 Current NODE_ENV: ${currentEnv}`);
  
  // Get allowed origins from environment or use environment-specific defaults
  const getDefaultOrigins = () => {
    // Always include production URLs for safety
    const productionUrls = [
      'http://206.189.82.117:8080', // Production Frontend URL
      'http://206.189.82.117:3003', // Production Backend URL (if needed)
    ];
    
    if (currentEnv === 'production') {
      return productionUrls;
    }
    
    // Development: include both localhost and production URLs
    return [
      'http://localhost:3000', // Your frontend URL
      'http://localhost:4200', // Angular dev server
      'http://localhost:3001', // React dev server
      'http://localhost:3002',
      'http://127.0.0.1:3004', // React dev server
      'http://localhost:3004', // React dev server
      'http://localhost:8080', // Local frontend
      'http://127.0.0.1:3000', // Alternative localhost
      ...productionUrls, // Also include production URLs in development
    ];
  };

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : getDefaultOrigins();

  console.log('🌐 CORS Allowed Origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowing origin: ${origin}`);
        return callback(null, true);
      }

      // Log blocked origins for debugging
      console.warn(`❌ CORS: Blocked origin: ${origin}`);
      console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    },
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
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for non-whitelisted properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
      validateCustomDecorators: true,
    }),
  );

  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  const seedService = app.get(SeedService);
  await seedService.run();

  await app.listen(process.env.PORT ?? 3005);
  console.log(`🚀 Application is running on:${process.env.PORT} `);
}

bootstrap();
