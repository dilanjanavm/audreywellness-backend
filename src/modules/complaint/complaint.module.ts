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

<<<<<<< HEAD
=======
import { SmsModule } from '../sms/sms.module';

>>>>>>> origin/new-dev
@Module({
  imports: [
    TypeOrmModule.forFeature([ComplaintEntity, ComplaintTimelineEntity]),
    CustomerModule,
    UsersModule,
<<<<<<< HEAD
    AttachmentModule, // NEW
=======
    AttachmentModule,
    SmsModule,
>>>>>>> origin/new-dev
  ],
  controllers: [ComplaintController],
  providers: [ComplaintService],
  exports: [ComplaintService],
})
<<<<<<< HEAD
export class ComplaintModule {}
=======
export class ComplaintModule { }
>>>>>>> origin/new-dev
