import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { TaskPhaseEntity } from './task-phase.entity';
import { TaskPriority, TaskStatus } from '../../../common/enums/task.enum';
import { User } from '../../users/user.entity';
import { CostingEntity } from '../../costing/entities/costing.entity';
import { TaskCommentEntity } from './task-comment.entity';
import { TaskRecipeExecutionEntity } from './task-recipe-execution.entity';

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

  // User assignment relation (NEW)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser?: User;

  @Column({ name: 'assigned_user_id', nullable: true })
  assignedUserId?: string;

  // Keep existing assignee fields for backward compatibility
  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'assignee_name', nullable: true })
  assigneeName?: string;

  @Column({ name: 'assignee_role', nullable: true })
  assigneeRole?: string;

  // Costed product assignment relation (NEW)
  @ManyToOne(() => CostingEntity, { nullable: true })
  @JoinColumn({ name: 'costing_id' })
  costing?: CostingEntity;

  @Column({ name: 'costing_id', nullable: true })
  costingId?: string;

  // Batch size and raw materials (NEW)
  @Column({ nullable: true })
  batchSize?: string;

  @Column({ type: 'json', nullable: true })
  rawMaterials?: Array<{
    rawMaterialId: string;
    rawMaterialName: string;
    percentage: string;
    unitPrice: string;
    units: string;
    supplier: string;
    category: string;
    kg: number;
    cost: number;
  }>;

  @Column({ type: 'int', unsigned: true, default: 0 })
  comments: number; // Legacy count field

  @OneToMany(() => TaskCommentEntity, (comment) => comment.task, {
    cascade: true,
  })
  commentList?: TaskCommentEntity[];

  @Column({ type: 'int', unsigned: true, default: 0 })
  views: number;

  // Recipe execution relation
  @OneToOne(() => TaskRecipeExecutionEntity, { nullable: true })
  @JoinColumn({ name: 'recipe_execution_id' })
  recipeExecution?: TaskRecipeExecutionEntity;

  @Column({ name: 'recipe_execution_id', nullable: true })
  recipeExecutionId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  // Filling & Packing Phase Specific Fields
  @Column({ name: 'order_number', nullable: true })
  orderNumber?: string; // Order number for Filling & Packing tasks

  @Column({ name: 'customer_name', nullable: true })
  customerName?: string; // Customer name for Filling & Packing tasks

  @Column({ name: 'customer_mobile', nullable: true })
  customerMobile?: string; // Customer mobile number (validated for SMS sending)

  @Column({ name: 'customer_address', type: 'text', nullable: true })
  customerAddress?: string; // Customer address for Filling & Packing tasks

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
