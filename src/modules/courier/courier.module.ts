import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierOrderEntity } from './entities/courier-order.entity';
import { CourierTrackingHistoryEntity } from './entities/courier-tracking-history.entity';
import { CourierController } from './courier.controller';
import { CourierTrackingService } from './services/courier-tracking.service';
import { CitypakApiService } from './services/citypak-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourierOrderEntity,
      CourierTrackingHistoryEntity,
    ]),
  ],
  controllers: [CourierController],
  providers: [CourierTrackingService, CitypakApiService],
  exports: [CourierTrackingService, CitypakApiService],
})
export class CourierModule {}

