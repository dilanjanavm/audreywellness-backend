import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { TaskPhaseEntity } from './task-phase.entity';
import { TaskPriority, TaskStatus } from '../../../common/enums/task.enum';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id', unique: true })
  taskId: string;

  @Column({ length: 512 })
  task: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => TaskPhaseEntity, (phase) => phase.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'phase_id' })
  phase: TaskPhaseEntity;

  @RelationId((task: TaskEntity) => task.phase)
  phaseId: string;

  @Column({ type: 'enum', enum: TaskStatus })
  status: TaskStatus;

  @Column({
    name: 'order_index',
    type: 'int',
    unsigned: true,
    default: 0,
  })
  order: number;

  @Column({ type: 'enum', enum: TaskPriority, nullable: true })
  priority?: TaskPriority;

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'assignee_name', nullable: true })
  assigneeName?: string;

  @Column({ name: 'assignee_avatar', nullable: true })
  assigneeAvatar?: string;

  @Column({ name: 'assignee_role', nullable: true })
  assigneeRole?: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  comments: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  views: number;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
