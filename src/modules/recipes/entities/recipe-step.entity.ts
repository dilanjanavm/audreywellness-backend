// src/modules/recipes/entities/recipe-step.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
export class RecipeStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ type: 'int' })
  order: number; // Step order (1, 2, 3, ...)

  @Column({ type: 'text' })
  instruction: string; // Step instruction text (can be long with @mentions)

  @Column({ type: 'int', nullable: true })
  temperature: number | null; // Temperature in Celsius

  @Column({ type: 'int' })
  duration: number; // Duration in minutes

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

