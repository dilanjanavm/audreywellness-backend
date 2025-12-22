// src/modules/recipes/entities/recipe-ingredient.entity.ts
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

@Entity('recipe_ingredients')
export class RecipeIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ type: 'varchar', length: 255 })
  name: string; // Ingredient name (e.g., "DI Water", "Vitamin E")

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number; // Quantity needed for the batch size

  @Column({ type: 'varchar', length: 255 })
  unit: string; // Unit of measurement (e.g., "Kg", "L", "g")

  @Column({ type: 'varchar', length: 255, nullable: true })
  category: string | null; // Ingredient category (e.g., "Raw Material")

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

