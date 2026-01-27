// src/modules/attachment/file-storage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadResult } from '../../common/interfaces/attachment.interface';
import { AttachmentType } from './entities/attachment.entity';

@Injectable()
export class FileStorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = {
    [AttachmentType.IMAGE]: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    [AttachmentType.DOCUMENT]: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  };

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getFileType(mimeType: string): AttachmentType {
    if (this.allowedMimeTypes[AttachmentType.IMAGE].includes(mimeType)) {
      return AttachmentType.IMAGE;
    }
    if (this.allowedMimeTypes[AttachmentType.DOCUMENT].includes(mimeType)) {
      return AttachmentType.DOCUMENT;
    }
    return AttachmentType.OTHER;
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed size is ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    const fileType = this.getFileType(file.mimetype);
    if (fileType === AttachmentType.OTHER) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: Images (JPEG, PNG, GIF, WebP) and Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)`,
      );
    }
  }

  async saveFile(file: Express.Multer.File): Promise<FileUploadResult> {
    try {
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      // Save file to disk
      await fs.promises.writeFile(filePath, file.buffer);

      const fileType = this.getFileType(file.mimetype);

      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath,
        fileType,
      };
    } catch (error) {
      console.error('Error saving file:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(`Failed to save file: ${error.message}`);
    }
  }

  async getFileStream(filename: string): Promise<fs.ReadStream> {
    const filePath = path.join(this.uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    return fs.createReadStream(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  getFileUrl(filename: string): string {
    return `/api/attachments/${filename}/download`;
  }

  getPreviewUrl(filename: string): string {
    return `/api/attachments/${filename}/preview`;
  }
}
