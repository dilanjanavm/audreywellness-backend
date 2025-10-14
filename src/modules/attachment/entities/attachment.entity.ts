// src/modules/attachment/entities/attachment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column('int')
  size: number;

  @Column({ type: 'enum', enum: AttachmentType })
  fileType: AttachmentType;

  @Column()
  filePath: string;

  // Remove TypeScript union types - just use nullable columns
  @Column({ nullable: true })
  complaintId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  uploadedById: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
