// src/database/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../modules/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
