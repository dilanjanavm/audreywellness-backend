// src/common/interfaces/attachment.interface.ts
import { AttachmentType } from '../../modules/attachment/entities/attachment.entity';

export interface UploadedByUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface AttachmentResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: AttachmentType;
  filePath: string;
  description?: string;
  uploadedBy: UploadedByUser;
  createdAt: Date;
  downloadUrl: string;
  previewUrl?: string;
}

export interface CreateAttachmentDto {
  complaintId: string;
  description?: string;
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  fileType: AttachmentType;
}

export interface DeleteAttachmentResponse {
  message: string;
  deletedAttachment: {
    id: string;
    originalName: string;
  };
}
