// src/modules/suppliers/dto/update-supplier.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
