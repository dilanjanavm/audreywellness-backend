// src/modules/attachment/attachment.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  UseGuards,
  Request,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AttachmentService } from './attachment.service';
import { AttachmentResponseDto } from '../../common/interfaces/attachment.interface';
import { AttachmentType } from './entities/attachment.entity';

@Controller('attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // ✅ GENERIC FILE UPLOAD - No reason/entity required
  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string,
    @Request() req,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.attachmentService.uploadFile(
      file,
      description || '',
      req.user.userId,
    );
  }

  // ✅ GET ALL GENERIC UPLOADS (files without complaint/customer association)
  @Get('uploads/generic')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getGenericUploads(): Promise<AttachmentResponseDto[]> {
    return this.attachmentService.getGenericUploads();
  }

  // ✅ GET ALL UPLOADS (both generic and entity-specific)
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAllUploads(): Promise<AttachmentResponseDto[]> {
    return this.attachmentService.getAllUploads();
  }

  // ✅ UPLOAD FILE FOR COMPLAINT
  @Post('complaint/:complaintId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadComplaintAttachment(
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string,
    @Request() req,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.attachmentService.uploadComplaintAttachment(
      complaintId,
      file,
      description || '',
      req.user.userId,
    );
  }

  // ✅ GET ATTACHMENTS FOR SPECIFIC COMPLAINT
  @Get('complaint/:complaintId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getComplaintAttachments(
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
  ): Promise<AttachmentResponseDto[]> {
    return this.attachmentService.getComplaintAttachments(complaintId);
  }

  // ✅ DOWNLOAD ATTACHMENT
  @Get(':id/download')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async downloadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: express.Response,
  ): Promise<void> {
    const { stream, attachment } =
      await this.attachmentService.downloadAttachment(id);

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
      'Content-Length': attachment.size,
    });

    stream.pipe(res);
  }

  // ✅ PREVIEW ATTACHMENT (especially for images)
  @Get(':id/preview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async previewAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: express.Response,
  ): Promise<void> {
    const { stream, attachment } =
      await this.attachmentService.downloadAttachment(id);

    // For images, serve as inline content
    if (attachment.fileType === AttachmentType.IMAGE) {
      res.set({
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `inline; filename="${attachment.originalName}"`,
        'Content-Length': attachment.size,
      });
    } else {
      // For documents, still force download
      res.set({
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Content-Length': attachment.size,
      });
    }

    stream.pipe(res);
  }

  // ✅ GET SINGLE ATTACHMENT INFO
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getAttachment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttachmentResponseDto> {
    const attachment = await this.attachmentService.getAttachmentById(id);
    return this.attachmentService.mapToResponseDto(attachment);
  }

  // ✅ DELETE ATTACHMENT
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteAttachment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.attachmentService.deleteAttachment(id);
  }
}
