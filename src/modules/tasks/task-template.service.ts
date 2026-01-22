import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskTemplateEntity, MandatoryFields, OptionalFieldConfig } from './entities/task-template.entity';
import { TaskPhaseEntity } from './entities/task-phase.entity';
import {
  CreateTaskTemplateDto,
  UpdateTaskTemplateDto,
  TaskTemplateResponseDto,
  OptionalFieldInputType,
  MandatoryFieldsDto,
} from './dto/task-template.dto';

@Injectable()
export class TaskTemplateService {
  private readonly logger = new Logger(TaskTemplateService.name);

  constructor(
    @InjectRepository(TaskTemplateEntity)
    private readonly templateRepository: Repository<TaskTemplateEntity>,
    @InjectRepository(TaskPhaseEntity)
    private readonly phaseRepository: Repository<TaskPhaseEntity>,
  ) {}

  /**
   * Get all templates
   */
  async findAll(): Promise<TaskTemplateResponseDto[]> {
    this.logger.log('findAll - Getting all templates');
    const templates = await this.templateRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['assignedPhase', 'createdByUser'],
    });

    return templates.map((template) => this.mapToResponseDto(template));
  }

  /**
   * Get template by ID
   */
  async findOne(id: string): Promise<TaskTemplateResponseDto> {
    this.logger.log(`findOne - Getting template: ${id}`);
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['assignedPhase', 'createdByUser'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.mapToResponseDto(template);
  }

  /**
   * Get template by phase ID
   * Returns template assigned to phase, or default template if none assigned
   */
  async findByPhaseId(phaseId: string): Promise<TaskTemplateResponseDto> {
    this.logger.log(`findByPhaseId - Getting template for phase: ${phaseId}`);

    // Check if phase exists
    const phase = await this.phaseRepository.findOne({ where: { id: phaseId } });
    if (!phase) {
      throw new NotFoundException('Phase not found');
    }

    // First, try to find template assigned to this phase
    const phaseTemplate = await this.templateRepository.findOne({
      where: { assignedPhaseId: phaseId },
      relations: ['assignedPhase', 'createdByUser'],
    });

    if (phaseTemplate) {
      this.logger.log(`findByPhaseId - Found phase-specific template: ${phaseTemplate.id}`);
      return this.mapToResponseDto(phaseTemplate);
    }

    // Fallback to default template
    const defaultTemplate = await this.templateRepository.findOne({
      where: { isDefault: true },
      relations: ['assignedPhase', 'createdByUser'],
    });

    if (!defaultTemplate) {
      throw new NotFoundException(
        'No template found for this phase and no default template exists',
      );
    }

    this.logger.log(`findByPhaseId - Using default template: ${defaultTemplate.id}`);
    return this.mapToResponseDto(defaultTemplate);
  }

  /**
   * Get default template
   */
  async findDefault(): Promise<TaskTemplateResponseDto> {
    this.logger.log('findDefault - Getting default template');
    const template = await this.templateRepository.findOne({
      where: { isDefault: true },
      relations: ['assignedPhase', 'createdByUser'],
    });

    if (!template) {
      throw new NotFoundException('Default template not found');
    }

    return this.mapToResponseDto(template);
  }

  /**
   * Create a new template
   */
  async create(
    dto: CreateTaskTemplateDto,
    createdBy?: string,
  ): Promise<TaskTemplateResponseDto> {
    this.logger.log(`create - Creating template: ${dto.name}`);

    // Validate mandatory fields
    this.validateMandatoryFields(dto.mandatoryFields);

    // Validate optional fields configuration
    if (dto.optionalFields && dto.optionalFields.length > 0) {
      this.validateOptionalFieldsConfig(dto.optionalFields, dto.optionalFieldConfig || {});
    }

    // Handle default template logic
    if (dto.isDefault) {
      // Unset any existing default template
      await this.unsetDefaultTemplate();
      // Default template cannot be assigned to a phase
      if (dto.assignedPhaseId) {
        throw new BadRequestException(
          'Default template cannot be assigned to a specific phase',
        );
      }
    } else if (dto.assignedPhaseId) {
      // Validate phase exists
      const phase = await this.phaseRepository.findOne({
        where: { id: dto.assignedPhaseId },
      });
      if (!phase) {
        throw new NotFoundException(`Phase with ID ${dto.assignedPhaseId} not found`);
      }

      // Check if phase already has a template
      const existingTemplate = await this.templateRepository.findOne({
        where: { assignedPhaseId: dto.assignedPhaseId },
      });
      if (existingTemplate) {
        throw new ConflictException(
          `Phase ${dto.assignedPhaseId} already has an assigned template`,
        );
      }
    }

    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description,
      isDefault: dto.isDefault || false,
      assignedPhaseId: dto.assignedPhaseId,
      mandatoryFields: dto.mandatoryFields as MandatoryFields,
      optionalFields: dto.optionalFields || [],
      optionalFieldConfig: (dto.optionalFieldConfig || {}) as OptionalFieldConfig,
      createdBy,
    });

    const saved = await this.templateRepository.save(template);
    this.logger.log(`create - Template created: ${saved.id}`);

    const templateWithRelations = await this.templateRepository.findOne({
      where: { id: saved.id },
      relations: ['assignedPhase', 'createdByUser'],
    });

    return this.mapToResponseDto(templateWithRelations!);
  }

  /**
   * Update an existing template
   */
  async update(
    id: string,
    dto: UpdateTaskTemplateDto,
  ): Promise<TaskTemplateResponseDto> {
    this.logger.log(`update - Updating template: ${id}`);

    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['assignedPhase', 'createdByUser'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Validate mandatory fields if provided
    if (dto.mandatoryFields) {
      this.validateMandatoryFields(dto.mandatoryFields);
    }

    // Validate optional fields configuration if provided
    if (dto.optionalFields && dto.optionalFields.length > 0) {
      const config = dto.optionalFieldConfig || template.optionalFieldConfig;
      // Convert OptionalFieldConfig to the expected format
      const configRecord: Record<string, { inputType: OptionalFieldInputType }> = {};
      for (const [key, value] of Object.entries(config)) {
        configRecord[key] = { inputType: value.inputType as OptionalFieldInputType };
      }
      this.validateOptionalFieldsConfig(dto.optionalFields, configRecord);
    }

    // Handle default template logic
    if (dto.isDefault !== undefined) {
      if (dto.isDefault && !template.isDefault) {
        // Setting as default - unset existing default
        await this.unsetDefaultTemplate();
        // Clear phase assignment if setting as default
        if (dto.assignedPhaseId) {
          throw new BadRequestException(
            'Default template cannot be assigned to a specific phase',
          );
        }
      }
    }

    // Handle phase assignment
    if (dto.assignedPhaseId !== undefined) {
      if (dto.assignedPhaseId === null) {
        // Clearing phase assignment
        template.assignedPhaseId = undefined;
      } else {
        // Validate phase exists
        const phase = await this.phaseRepository.findOne({
          where: { id: dto.assignedPhaseId },
        });
        if (!phase) {
          throw new NotFoundException(`Phase with ID ${dto.assignedPhaseId} not found`);
        }

        // Check if another template is already assigned to this phase
        const existingTemplate = await this.templateRepository.findOne({
          where: { assignedPhaseId: dto.assignedPhaseId },
        });
        if (existingTemplate && existingTemplate.id !== id) {
          throw new ConflictException(
            `Phase ${dto.assignedPhaseId} already has an assigned template`,
          );
        }
      }
    }

    // Update fields
    if (dto.name !== undefined) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.isDefault !== undefined) template.isDefault = dto.isDefault;
    if (dto.assignedPhaseId !== undefined) {
      template.assignedPhaseId = dto.assignedPhaseId || undefined;
    }
    if (dto.mandatoryFields) {
      template.mandatoryFields = dto.mandatoryFields as MandatoryFields;
    }
    if (dto.optionalFields !== undefined) {
      template.optionalFields = dto.optionalFields;
    }
    if (dto.optionalFieldConfig !== undefined) {
      template.optionalFieldConfig = dto.optionalFieldConfig as OptionalFieldConfig;
    }

    const saved = await this.templateRepository.save(template);
    this.logger.log(`update - Template updated: ${saved.id}`);

    const templateWithRelations = await this.templateRepository.findOne({
      where: { id: saved.id },
      relations: ['assignedPhase', 'createdByUser'],
    });

    return this.mapToResponseDto(templateWithRelations!);
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`delete - Deleting template: ${id}`);

    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isDefault) {
      throw new BadRequestException('Cannot delete default template');
    }

    await this.templateRepository.remove(template);
    this.logger.log(`delete - Template deleted: ${id}`);
  }

  /**
   * Unset the current default template
   */
  private async unsetDefaultTemplate(): Promise<void> {
    const defaultTemplate = await this.templateRepository.findOne({
      where: { isDefault: true },
    });

    if (defaultTemplate) {
      defaultTemplate.isDefault = false;
      await this.templateRepository.save(defaultTemplate);
      this.logger.log(`unsetDefaultTemplate - Unset default template: ${defaultTemplate.id}`);
    }
  }

  /**
   * Validate mandatory fields structure
   */
  private validateMandatoryFields(mandatoryFields: MandatoryFieldsDto): void {
    if (!mandatoryFields.taskName) {
      throw new BadRequestException('mandatoryFields.taskName is required');
    }
    if (!mandatoryFields.assignTo) {
      throw new BadRequestException('mandatoryFields.assignTo is required');
    }
    if (!mandatoryFields.priority) {
      throw new BadRequestException('mandatoryFields.priority is required');
    }
    if (!mandatoryFields.startDate) {
      throw new BadRequestException('mandatoryFields.startDate is required');
    }
    if (!mandatoryFields.endDate) {
      throw new BadRequestException('mandatoryFields.endDate is required');
    }
    if (!mandatoryFields.status) {
      throw new BadRequestException('mandatoryFields.status is required');
    }
  }

  /**
   * Validate optional fields configuration
   */
  private validateOptionalFieldsConfig(
    optionalFields: string[],
    optionalFieldConfig: Record<string, { inputType: OptionalFieldInputType }>,
  ): void {
    for (const field of optionalFields) {
      if (!optionalFieldConfig[field]) {
        throw new BadRequestException(
          `Optional field "${field}" must have a corresponding entry in optionalFieldConfig`,
        );
      }

      const config = optionalFieldConfig[field];
      if (!config.inputType) {
        throw new BadRequestException(
          `Optional field "${field}" must have an inputType specified`,
        );
      }

      // Validate inputType is valid enum value
      if (!Object.values(OptionalFieldInputType).includes(config.inputType)) {
        throw new BadRequestException(
          `Invalid inputType "${config.inputType}" for field "${field}". Must be one of: ${Object.values(OptionalFieldInputType).join(', ')}`,
        );
      }
    }
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(template: TaskTemplateEntity): TaskTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      isDefault: template.isDefault,
      assignedPhaseId: template.assignedPhaseId,
      mandatoryFields: template.mandatoryFields,
      optionalFields: template.optionalFields,
      optionalFieldConfig: template.optionalFieldConfig,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
    };
  }
}
