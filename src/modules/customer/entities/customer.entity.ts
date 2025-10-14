import {
  Column,
  CreateDateColumn, DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerType } from '../../../common/enums/customer.enum';
import { ComplaintEntity } from '../../complaint/entities/complaint.entity';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerCode: string; // CUST-2025-001 (auto-generated)

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({
    type: 'enum',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    enum: CustomerType,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    default: CustomerType.INDIVIDUAL,
  })
  customerType: CustomerType;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @OneToMany(() => ComplaintEntity, (complaint) => complaint.customer)
  complaints: ComplaintEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
