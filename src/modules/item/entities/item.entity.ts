import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { CategoryEntity } from '../../category/entities/category.entity';
import { UnitType } from '../../../common/enums/item.enum';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Status } from '../../../common/enums/status';

@Entity('items')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  itemCode: string;

  @Column()
  stockId: string;

  @Column()
  description: string;

  // Store category name directly for simplicity
  @Column()
  category: string;

  // Optional: Keep category relationship for advanced features
  @ManyToOne(() => CategoryEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'categoryId' })
  categoryEntity?: CategoryEntity;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({ type: 'varchar', length: 20 })
  units: UnitType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  altPrice: number;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Many-to-Many relationship with suppliers
  @ManyToMany(() => Supplier, (supplier) => supplier.items)
  suppliers: Supplier[];
}
