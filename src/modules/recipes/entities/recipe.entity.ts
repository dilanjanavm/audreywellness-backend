// src/modules/recipes/entities/recipe.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ItemEntity } from '../../item/entities/item.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipePreparationStep } from './recipe-preparation-step.entity';

export enum RecipeStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('recipes')
@Index(['productId', 'batchSize', 'version'])
@Index(['productId', 'status'])
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => ItemEntity, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: ItemEntity;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ name: 'batch_size', type: 'varchar', length: 100 })
  batchSize: string;

  @Column({ name: 'total_time', type: 'int' })
  totalTime: number; // in minutes

  @Column({
    type: 'enum',
    enum: RecipeStatus,
    default: RecipeStatus.DRAFT,
  })
  status: RecipeStatus;

  @Column({ type: 'int', default: 1 })
  version: number; // Version number for this recipe

  @Column({ name: 'is_active_version', type: 'boolean', default: false })
  isActiveVersion: boolean; // True for the current active version

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @OneToMany(() => RecipeStep, (step) => step.recipe, {
    cascade: true,
    eager: false,
  })
  steps: RecipeStep[];

  @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, {
    cascade: true,
    eager: false,
  })
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipePreparationStep, (preparationStep) => preparationStep.recipe, {
    cascade: true,
    eager: false,
  })
  preparationSteps: RecipePreparationStep[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

