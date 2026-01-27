import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskEntity } from './task.entity';
import { User } from '../../users/user.entity';

@Entity('task_comments')
export class TaskCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TaskEntity, (task) => task.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @Column({ name: 'owner_id', nullable: true })
  ownerId?: string;

  @Column({ name: 'owner_name', nullable: true })
  ownerName?: string;

  @Column({ name: 'owner_email', nullable: true })
  ownerEmail?: string;

  @CreateDateColumn({ name: 'commented_date' })
  commentedDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

