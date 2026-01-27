import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CourierWebhookDto {
  @IsString()
  @IsNotEmpty()
  tracking_number: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  item_id: string;

  @IsString()
  @IsNotEmpty()
  status_type: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  action_datetime?: string;

  @IsString()
  @IsOptional()
  delivered_datetime?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

