// src/modules/complaint/entities/complaint-timeline.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComplaintEntity } from './complaint.entity';
import { User } from '../../users/user.entity';
import { TimelineEntryType } from '../../../common/interfaces/timeline.interface';

@Entity('complaint_timelines')
export class ComplaintTimelineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ComplaintEntity, (complaint) => complaint.timelineEntries)
  complaint: ComplaintEntity;

  @Column()
  complaintId: string;

  @Column({ type: 'enum', enum: TimelineEntryType })
  entryType: TimelineEntryType;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
