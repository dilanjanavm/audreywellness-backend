import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
  ValidateNested,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MandatoryFields, OptionalFieldConfig } from '../entities/task-template.entity';

export enum OptionalFieldInputType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  RATIOS = 'ratios',
  CHECK = 'check',
  RADIO = 'radio',
  CHECKBOX_GROUP = 'checkboxGroup',
}

export class MandatoryFieldsDto {
  @IsBoolean()
  taskName: boolean;

  @IsBoolean()
  @IsOptional()
  taskDescription?: boolean;

  @IsBoolean()
  assignTo: boolean;

  @IsBoolean()
  priority: boolean;

  @IsBoolean()
  startDate: boolean;

  @IsBoolean()
  endDate: boolean;

  @IsBoolean()
  status: boolean;
}

export class OptionalFieldConfigDto {
  @IsEnum(OptionalFieldInputType)
  inputType: OptionalFieldInputType;
}

export class CreateTaskTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.isDefault !== true)
  assignedPhaseId?: string;

  @ValidateNested()
  @Type(() => MandatoryFieldsDto)
  mandatoryFields: MandatoryFieldsDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  optionalFields?: string[];

  @IsObject()
  @IsOptional()
  optionalFieldConfig?: Record<string, OptionalFieldConfigDto>;
}

export class UpdateTaskTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsUUID()
  @IsOptional()
  assignedPhaseId?: string;

  @ValidateNested()
  @Type(() => MandatoryFieldsDto)
  @IsOptional()
  mandatoryFields?: MandatoryFieldsDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  optionalFields?: string[];

  @IsObject()
  @IsOptional()
  optionalFieldConfig?: Record<string, OptionalFieldConfigDto>;
}

export class TaskTemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  assignedPhaseId?: string;
  mandatoryFields: MandatoryFields;
  optionalFields: string[];
  optionalFieldConfig: OptionalFieldConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}
