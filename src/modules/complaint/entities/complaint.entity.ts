// src/modules/complaint/entities/complaint.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ComplaintCategory,
  ComplaintStatus,
  PriorityLevel,
} from '../../../common/enums/complain.enum';
import { User } from '../../users/user.entity';
import { ComplaintTimelineEntity } from './complaint-timeline.entity';
import { CustomerEntity } from '../../customer/entities/customer.entity';

@Entity('complaints')
export class ComplaintEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  complaintNumber: string;

  @ManyToOne(() => CustomerEntity, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: CustomerEntity;

  @Column()
  customerId: string;

  @Column()
  headline: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ComplaintCategory })
  category: ComplaintCategory;

  @Column({ type: 'enum', enum: PriorityLevel, default: PriorityLevel.MEDIUM })
  priority: PriorityLevel;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.ASSIGNED,
  })
  status: ComplaintStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column()
  assignedToId: string;

  @Column()
  targetResolutionDate: Date;

  @Column({ nullable: true })
  actualResolutionDate: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ type: 'text', nullable: true })
  clientFeedback: string;

  @Column({ nullable: true })
  feedbackRating: number;

  @Column({ default: false })
  hasAttachments: boolean;

  @Column({ default: 0 })
  attachmentCount: number;

  @OneToMany(() => ComplaintTimelineEntity, (timeline) => timeline.complaint)
  timelineEntries: ComplaintTimelineEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
