// src/modules/item/item-management.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemManagementController } from './item-management.controller';
import { ItemManagementService } from './item-management.service';
import { ItemEntity } from './entities/item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CategoryModule } from '../category/category.module';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemEntity, Supplier]),
    CategoryModule,
    SuppliersModule,
  ],
  controllers: [ItemManagementController],
  providers: [ItemManagementService],
  exports: [ItemManagementService],
})
export class ItemManagementModule {}
