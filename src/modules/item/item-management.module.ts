import { Module } from '@nestjs/common';
import { ItemManagementService } from './item-management.service';
import { ItemManagementController } from './item-management.controller';

@Module({
  providers: [ItemManagementService],
  controllers: [ItemManagementController]
})
export class ItemManagementModule {}
