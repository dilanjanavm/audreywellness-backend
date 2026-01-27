import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsOptional()
  @MaxLength(11)
  sender_id?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
