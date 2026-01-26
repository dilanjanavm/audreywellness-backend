// src/modules/recipes/entities/recipe-preparation-step.entity.ts
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
import { Recipe } from './recipe.entity';
import { RecipePreparationQuestion } from './recipe-preparation-question.entity';

@Entity('recipe_preparation_steps')
export class RecipePreparationStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.preparationSteps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ type: 'int' })
  order: number; // Order in unified queue (1, 2, 3, ...) - same as steps

  @OneToMany(() => RecipePreparationQuestion, (question) => question.preparationStep, {
    cascade: true,
    eager: false,
  })
  questions: RecipePreparationQuestion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
