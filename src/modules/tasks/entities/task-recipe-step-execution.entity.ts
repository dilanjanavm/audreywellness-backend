import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskRecipeExecutionEntity } from './task-recipe-execution.entity';
import { StepExecutionStatus } from '../../../common/enums/recipe-execution.enum';

@Entity('task_recipe_step_executions')
export class TaskRecipeStepExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => TaskRecipeExecutionEntity,
    (execution) => execution.stepExecutions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'execution_id' })
  execution: TaskRecipeExecutionEntity;

  @Column({ name: 'execution_id' })
  executionId: string;

  // Reference to recipe step
  @Column({ name: 'recipe_step_id', type: 'uuid' })
  recipeStepId: string;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder: number;

  // Step execution status
  @Column({
    type: 'enum',
    enum: StepExecutionStatus,
    default: StepExecutionStatus.PENDING,
  })
  status: StepExecutionStatus;

  // Progress within this step (0-100%)
  @Column({
    name: 'progress',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  progress: number;

  // Actual values recorded during execution
  @Column({
    name: 'actual_temperature',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  actualTemperature?: number;

  @Column({ name: 'actual_duration', type: 'int', nullable: true })
  actualDuration?: number; // in minutes

  // Accumulated elapsed time for this step (in minutes) - excludes pause time
<<<<<<< HEAD
  @Column({ name: 'step_elapsed_time', type: 'int', default: 0 })
=======
  @Column({
    name: 'step_elapsed_time',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
>>>>>>> origin/new-dev
  stepElapsedTime: number;

  // Timestamps
  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ name: 'paused_at', type: 'datetime', nullable: true })
  pausedAt?: Date;

  @Column({ name: 'resumed_at', type: 'datetime', nullable: true })
  resumedAt?: Date; // Track when this step was last resumed

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  // Notes/observations for this step
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

