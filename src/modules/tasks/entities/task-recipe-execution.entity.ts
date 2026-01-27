import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskEntity } from './task.entity';
import { TaskRecipeStepExecutionEntity } from './task-recipe-step-execution.entity';
import { TaskRecipePreparationQuestionStatusEntity } from './task-recipe-preparation-question-status.entity';
import { RecipeExecutionStatus } from '../../../common/enums/recipe-execution.enum';

@Entity('task_recipe_executions')
export class TaskRecipeExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TaskEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @Column({ name: 'task_id' })
  taskId: string;

  // Store recipe reference (recipe can be versioned, so store the ID)
  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  // Current execution status
  @Column({
    type: 'enum',
    enum: RecipeExecutionStatus,
    default: RecipeExecutionStatus.NOT_STARTED,
  })
  status: RecipeExecutionStatus;

  // Current step being executed (null if not started)
  @Column({ name: 'current_step_id', type: 'uuid', nullable: true })
  currentStepId?: string;

  @Column({ name: 'current_step_order', type: 'int', nullable: true })
  currentStepOrder?: number; // Which step (1, 2, 3, 4...)

  // Progress within current step (0-100%)
  @Column({
    name: 'current_step_progress',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  currentStepProgress: number;

  // Timestamps
  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ name: 'paused_at', type: 'datetime', nullable: true })
  pausedAt?: Date;

  @Column({ name: 'resumed_at', type: 'datetime', nullable: true })
  resumedAt?: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date;

  // Total elapsed time (in minutes) - accumulated across pauses
  @Column({ name: 'total_elapsed_time', type: 'int', default: 0 })
  totalElapsedTime: number;

  // Pause information
  @Column({ name: 'pause_reason', type: 'text', nullable: true })
  pauseReason?: string; // Reason for pausing

  @Column({ name: 'remaining_time_at_pause', type: 'decimal', precision: 10, scale: 2, nullable: true })
  remainingTimeAtPause?: number; // Remaining time in minutes when paused

  @OneToMany(
    () => TaskRecipeStepExecutionEntity,
    (stepExecution) => stepExecution.execution,
    { cascade: true },
  )
  stepExecutions?: TaskRecipeStepExecutionEntity[];

  @OneToMany(
    () => TaskRecipePreparationQuestionStatusEntity,
    (questionStatus) => questionStatus.execution,
    { cascade: true },
  )
  preparationQuestionStatuses?: TaskRecipePreparationQuestionStatusEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

