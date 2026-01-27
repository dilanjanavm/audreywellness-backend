// src/modules/complaint/complaint.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintService } from './complaint.service';
import { ComplaintController } from './complaint.controller';
import { ComplaintEntity } from './entities/complaint.entity';
import { ComplaintTimelineEntity } from './entities/complaint-timeline.entity';
import { CustomerModule } from '../customer/customer.module';
import { UsersModule } from '../users/users.module';
import { AttachmentModule } from '../attachment/attachment.module'; // NEW

import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplaintEntity, ComplaintTimelineEntity]),
    CustomerModule,
    UsersModule,
    AttachmentModule,
    SmsModule,
  ],
  controllers: [ComplaintController],
  providers: [ComplaintService],
  exports: [ComplaintService],
})
export class ComplaintModule { }
