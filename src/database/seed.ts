import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seeds/seed.module';
import { SeedService } from './seeds/seed.service';
import * as dotenv from 'dotenv';

dotenv.config(); // Ensure .env is loaded

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  try {
    console.log('🌱 Starting the seed process...');
    const seeder = app.get(SeedService);
    await seeder.run();
    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
