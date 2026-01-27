// src/modules/attachment/attachment.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachmentEntity, AttachmentType } from './entities/attachment.entity';
import { FileStorageService } from './file-storage.service';
import {
  AttachmentResponseDto,
  FileUploadResult,
  DeleteAttachmentResponse,
  UploadedByUser,
} from '../../common/interfaces/attachment.interface';
import * as fs from 'node:fs';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  // Generic file upload without entity association
  async uploadFile(
    file: Express.Multer.File,
    description: string,
    uploadedById: string,
  ): Promise<AttachmentResponseDto> {
    try {
      console.log(`📎 Uploading generic file`);

      // Save file to storage
      const fileResult: FileUploadResult =
        await this.fileStorageService.saveFile(file);

      // Create attachment record without complaint/customer association
      const attachment = this.attachmentRepository.create({
        filename: fileResult.filename,
        originalName: fileResult.originalName,
        mimeType: fileResult.mimeType,
        size: fileResult.size,
        fileType: fileResult.fileType,
        filePath: fileResult.filePath,
        description,
        uploadedById,
        // No complaintId or customerId - this is a generic upload
      });

      const savedAttachment = await this.attachmentRepository.save(attachment);

      console.log(`✅ File uploaded successfully: ${savedAttachment.id}`);

      return this.mapToResponseDto(savedAttachment);
    } catch (error) {
      console.error('❌ Error uploading file:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  // Upload file and assign to complaint (if needed elsewhere)
  async uploadComplaintAttachment(
    complaintId: string,
    file: Express.Multer.File,
    description: string,
    uploadedById: string,
  ): Promise<AttachmentResponseDto> {
    try {
      console.log(`📎 Uploading attachment for complaint: ${complaintId}`);

      // Save file to storage
      const fileResult: FileUploadResult =
        await this.fileStorageService.saveFile(file);

      // Create attachment record with complaint reference
      const attachment = this.attachmentRepository.create({
        complaintId,
        filename: fileResult.filename,
        originalName: fileResult.originalName,
        mimeType: fileResult.mimeType,
        size: fileResult.size,
        fileType: fileResult.fileType,
        filePath: fileResult.filePath,
        description,
        uploadedById,
      });

      const savedAttachment = await this.attachmentRepository.save(attachment);

      console.log(`✅ Complaint attachment uploaded: ${savedAttachment.id}`);

      return this.mapToResponseDto(savedAttachment);
    } catch (error) {
      console.error('❌ Error uploading complaint attachment:', error);
      throw new InternalServerErrorException(
        'Failed to upload complaint attachment',
      );
    }
  }

  async getGenericUploads(): Promise<AttachmentResponseDto[]> {
    try {
      // Use query builder for more complex conditions
      const attachments = await this.attachmentRepository
        .createQueryBuilder('attachment')
        .where('attachment.complaintId IS NULL')
        .andWhere('attachment.customerId IS NULL')
        .orderBy('attachment.createdAt', 'DESC')
        .getMany();

      return attachments.map((attachment) => this.mapToResponseDto(attachment));
    } catch (error) {
      console.error('Error getting generic uploads:', error);
      throw new InternalServerErrorException('Failed to retrieve uploads');
    }
  }

  async getComplaintAttachments(
    complaintId: string,
  ): Promise<AttachmentResponseDto[]> {
    try {
      const attachments = await this.attachmentRepository.find({
        where: { complaintId },
        order: { createdAt: 'DESC' },
      });

      return attachments.map((attachment) => this.mapToResponseDto(attachment));
    } catch (error) {
      console.error('Error getting complaint attachments:', error);
      throw new InternalServerErrorException('Failed to retrieve attachments');
    }
  }

  async getAttachmentById(id: string): Promise<AttachmentEntity> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  async downloadAttachment(
    id: string,
  ): Promise<{ stream: fs.ReadStream; attachment: AttachmentEntity }> {
    const attachment = await this.getAttachmentById(id);

    try {
      const stream = await this.fileStorageService.getFileStream(
        attachment.filename,
      );
      return { stream, attachment };
    } catch (error) {
      console.error('Error downloading attachment:', error);

      if (error instanceof BadRequestException) {
        throw new NotFoundException('File not found');
      }

      throw new InternalServerErrorException('Failed to download file');
    }
  }

  async deleteAttachment(
    id: string,
    userId: any,
  ): Promise<DeleteAttachmentResponse> {
    try {
      const attachment = await this.getAttachmentById(id);

      // Delete physical file
      await this.fileStorageService.deleteFile(attachment.filename);

      // Delete database record
      await this.attachmentRepository.delete(id);

      return {
        message: 'Attachment deleted successfully',
        deletedAttachment: {
          id: attachment.id,
          originalName: attachment.originalName,
        },
      };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw new InternalServerErrorException('Failed to delete attachment');
    }
  }

  async getAllUploads(): Promise<AttachmentResponseDto[]> {
    try {
      const attachments = await this.attachmentRepository.find({
        order: { createdAt: 'DESC' },
      });

      return attachments.map((attachment) => this.mapToResponseDto(attachment));
    } catch (error) {
      console.error('Error getting all uploads:', error);
      throw new InternalServerErrorException('Failed to retrieve uploads');
    }
  }

  mapToResponseDto(attachment: AttachmentEntity): AttachmentResponseDto {
    const uploadedBy: UploadedByUser = {
      id: attachment.uploadedById,
      email: 'user@example.com', // You'll get this from your user service
      username: 'user',
    };

    return {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      fileType: attachment.fileType,
      filePath: attachment.filePath,
      description: attachment.description,
      uploadedBy,
      createdAt: attachment.createdAt,
      downloadUrl: `/api/attachments/${attachment.id}/download`,
      previewUrl:
        attachment.fileType === AttachmentType.IMAGE
          ? `/api/attachments/${attachment.id}/preview`
          : undefined,
    };
  }
}
