// src/modules/costing/costing.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingController } from './costing.controller';
import { CostingService } from './costing.service';
import { CostingEntity } from './entities/costing.entity';
import { CostingRawMaterial } from './entities/costing-raw-material.entity';
import { CostingAdditionalCost } from './entities/costing-additional-cost.entity';
import { CostingTotalCost } from './entities/costing-total-cost.entity';
import { ItemEntity } from '../item/entities/item.entity';
import { CategoryEntity } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CostingEntity,
      CostingRawMaterial,
      CostingAdditionalCost,
      CostingTotalCost,
      ItemEntity,
      CategoryEntity,
    ]),
  ],
  controllers: [CostingController],
  providers: [CostingService],
  exports: [CostingService],
})
export class CostingModule {}
