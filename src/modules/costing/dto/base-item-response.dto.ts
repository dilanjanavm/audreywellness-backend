import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../../common/enums/common.enum';

export class BaseItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemCode: string;

  @ApiProperty()
  stockId: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false })
  categoryId?: string;

  @ApiProperty()
  units: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  altPrice: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ type: [Object] })
  suppliers: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
