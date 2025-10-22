// src/modules/prices/entities/price.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ItemEntity } from '../../item/entities/item.entity';
import { CategoryEntity } from '../../category/entities/category.entity';

@Entity('prices')
export class PriceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // From CSV: "PRICE"

  @Column({ unique: true })
  stockId: string; // Manual entry - stock_id from CSV

  @Column()
  description: string; // Item Name from CSV

  @Column({ nullable: true })
  itemCode: string; // Optional from CSV

  // RELATIONSHIP: Link to Item
  @ManyToOne(() => ItemEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'itemId' })
  item: ItemEntity;

  @Column({ nullable: true })
  itemId: string;

  // RELATIONSHIP: Link to Category
  @ManyToOne(() => CategoryEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: CategoryEntity;

  @Column()
  categoryId: string;

  @Column({ default: 'LKR' })
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ nullable: true })
  customer: string; // Optional

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  altPrice: number; // Optional

  @Column({ nullable: true })
  supplierCode: string; // Optional - Supplier Code from CSV

  @Column({ nullable: true })
  supplierName: string; // Optional - Supplier Name from CSV

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
