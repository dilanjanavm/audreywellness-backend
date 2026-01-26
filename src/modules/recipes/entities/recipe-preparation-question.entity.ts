// src/modules/recipes/entities/recipe-preparation-question.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecipePreparationStep } from './recipe-preparation-step.entity';

@Entity('recipe_preparation_questions')
export class RecipePreparationQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'preparation_step_id', type: 'uuid' })
  preparationStepId: string;

  @ManyToOne(() => RecipePreparationStep, (step) => step.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'preparation_step_id' })
  preparationStep: RecipePreparationStep;

  @Column({ type: 'varchar', length: 500 })
  question: string; // Question text (max 500 characters)

  @Column({ name: 'has_checkbox', type: 'boolean', default: true })
  hasCheckbox: boolean; // Whether to display checkbox for this question

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
