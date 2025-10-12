// src/modules/item-management/entities/item.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'items' })
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  // We'll treat these as simple number columns for now.
  // Later, we can create relationships to Supplier and Ingredient entities.
  @Column({ nullable: true })
  supplier_id: number;

  @Column({ nullable: true })
  ingredient_id: number;

  @Column('text', { nullable: true })
  description: string;

  // Use 'decimal' for currency to avoid floating-point errors
  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  unit_price: number;

  @Column({ nullable: true })
  category: string;

  // TypeORM will automatically manage these columns
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}