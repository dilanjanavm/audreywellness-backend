// src/modules/suppliers/entities/supplier.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ItemEntity } from '../../item/entities/item.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  supplierCode: string;

  @Column()
  name: string;

  @Column()
  reference: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  phone2: string;

  @Column({ nullable: true })
  fax: string;

  @Column({ nullable: true })
  ntnNumber: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ nullable: true })
  paymentTerms: string;

  @Column({ nullable: true })
  taxGroup: string;

  @Column({ default: 'LKR' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  // SIMPLE Many-to-Many - Let TypeORM handle everything
  @ManyToMany(() => ItemEntity, (item) => item.suppliers)
  @JoinTable()
  items: ItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
