import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  sender_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
