// src/modules/item/entities/item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoryEntity } from '../../category/entities/category.entity';
import { ItemType, MBFlag, UnitType } from '../../../common/enums/item.enum';

@Entity('items')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: ItemType;

  @Column({ unique: true })
  itemCode: string;

  @Column()
  stockId: string;

  @Column({ nullable: true })
  isbnNo: string;

  @Column()
  description: string;

  // Category relationship - FIX: Reference categoryId instead of id
  @ManyToOne(() => CategoryEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'categoryId', referencedColumnName: 'categoryId' })
  category: CategoryEntity;

  @Column()
  categoryId: string;

  @Column({ type: 'varchar', length: 20 })
  units: UnitType;

  @Column({ nullable: true })
  dummy: string;

  @Column({ type: 'varchar', length: 1 })
  mbFlag: MBFlag;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  altPrice: number;

  @Column()
  salesAccount: string;

  @Column()
  inventoryAccount: string;

  @Column()
  cogsAccount: string;

  @Column()
  adjustmentAccount: string;

  @Column()
  wipAccount: string;

  @Column({ nullable: true })
  hsCode: string;

  @Column({ type: 'text', nullable: true })
  longDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}