// src/modules/suppliers/suppliers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from './entities/supplier.entity';
import { ItemEntity } from '../item/entities/item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      ItemEntity, // Import ItemEntity to use in SuppliersService
    ]),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService], // Export if other modules need to use SuppliersService
})
export class SuppliersModule {}
