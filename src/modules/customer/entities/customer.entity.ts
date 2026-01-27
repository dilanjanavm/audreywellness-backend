// src/modules/customer/entities/customer.entity.ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerType } from '../../../common/enums/customer.enum';
import { ComplaintEntity } from '../../complaint/entities/complaint.entity';
import { SalesType } from '../../../common/enums/sales-type';
import { PaymentTerms } from '../../../common/enums/payment-terms';
import { Status } from '../../../common/enums/status';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sNo: string; // Changed from customerCode to sNo (S_No from CSV)

  @Column()
  name: string; // Full business/customer name

  @Column()
  shortName: string; // Short name/identifier

  @Column()
  branchName: string; // Branch name

  @Column()
  cityArea: string; // City/Area

  @Column({ nullable: true })
  email: string;

  @Column()
  smsPhone: string; // SMS phone number

  @Column({ default: 'LKR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: SalesType,
    default: SalesType.RETAIL,
  })
  salesType: SalesType;

  @Column({
    type: 'enum',
    enum: PaymentTerms,
    default: PaymentTerms.COD_IML,
  })
  paymentTerms: PaymentTerms;

  @Column({ type: 'date', nullable: true })
  dob: Date; // Date of Birth or Establishment

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;

  @Column()
  salesGroup: string; // Sales Group/Category

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.INDIVIDUAL,
  })
  customerType: CustomerType;

  @OneToMany(() => ComplaintEntity, (complaint) => complaint.customer)
  complaints: ComplaintEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
