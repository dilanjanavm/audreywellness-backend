import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TaskEntity } from './task.entity';
import { TaskPhaseEntity } from './task-phase.entity';
import { User } from '../../users/user.entity';

@Entity('task_movement_history')
export class TaskMovementHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TaskEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => TaskPhaseEntity)
  @JoinColumn({ name: 'from_phase_id' })
  fromPhase: TaskPhaseEntity;

  @Column({ name: 'from_phase_id' })
  fromPhaseId: string;

  @ManyToOne(() => TaskPhaseEntity)
  @JoinColumn({ name: 'to_phase_id' })
  toPhase: TaskPhaseEntity;

  @Column({ name: 'to_phase_id' })
  toPhaseId: string;

  @Column({ name: 'from_status', nullable: true })
  fromStatus?: string;

  @Column({ name: 'to_status', nullable: true })
  toStatus?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moved_by_user_id' })
  movedByUser?: User;

  @Column({ name: 'moved_by_user_id', nullable: true })
  movedByUserId?: string;

  @Column({ name: 'moved_by_name', nullable: true })
  movedByName?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string; // Optional reason/notes for the movement

  @CreateDateColumn({ name: 'moved_at' })
  movedAt: Date;
}

