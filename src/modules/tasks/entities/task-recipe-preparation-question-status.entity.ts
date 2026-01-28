// src/modules/tasks/entities/task-recipe-preparation-question-status.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TaskRecipeExecutionEntity } from './task-recipe-execution.entity';

@Entity('task_recipe_preparation_question_statuses')
@Index(['executionId', 'preparationStepId', 'questionId'], { unique: true })
export class TaskRecipePreparationQuestionStatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => TaskRecipeExecutionEntity,
    (execution) => execution.preparationQuestionStatuses,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'execution_id' })
  execution: TaskRecipeExecutionEntity;

  @Column({ name: 'execution_id' })
  executionId: string;

  // Reference to preparation step (from recipe)
  @Column({ name: 'preparation_step_id', type: 'uuid' })
  preparationStepId: string;

  // Reference to question (from recipe)
  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  // Checked status
  @Column({ type: 'boolean', default: false })
  checked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
