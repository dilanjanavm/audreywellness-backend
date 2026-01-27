import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateContactGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateContactGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
