// src/modules/category/entities/category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ItemEntity } from '../../item/entities/item.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  categoryId: string; // Like "CAT001", "CAT002"

  @Column()
  categoryName: string;

  @Column({ type: 'text', nullable: true })
  categoryDesc: string;

  @Column({ nullable: true })
  categoryColor: string; // Hex color code like "#FF5733"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'enum', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status: string;

  @OneToMany(() => ItemEntity, (item) => item.category)
  items: ItemEntity[];
}
