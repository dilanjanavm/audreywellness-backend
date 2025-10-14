// src/modules/attachment/attachment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentService } from './attachment.service';
import { AttachmentController } from './attachment.controller';
import { FileStorageService } from './file-storage.service';
import { AttachmentEntity } from './entities/attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttachmentEntity]),
  ],
  controllers: [AttachmentController],
  providers: [AttachmentService, FileStorageService],
  exports: [AttachmentService, FileStorageService],
})
export class AttachmentModule {}
