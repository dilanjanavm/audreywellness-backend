import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import {
  CreateTaskTemplateDto,
  UpdateTaskTemplateDto,
  TaskTemplateResponseDto,
} from './dto/task-template.dto';

@Controller('tasks/templates')
export class TaskTemplateController {
  private readonly logger = new Logger(TaskTemplateController.name);

  constructor(private readonly templateService: TaskTemplateService) {
    this.logger.log('TaskTemplateController initialized');
  }

  /**
   * Get all templates
   * GET /api/tasks/templates
   */
  @Get()
  async findAll(): Promise<{ is_success: boolean; data: TaskTemplateResponseDto[]; message: string }> {
    this.logger.log('GET /tasks/templates - Getting all templates');
    const data = await this.templateService.findAll();
    return {
      is_success: true,
      data,
      message: 'Templates retrieved successfully',
    };
  }

  /**
   * Get template by ID
   * GET /api/tasks/templates/:templateId
   */
  @Get(':templateId')
  async findOne(
    @Param('templateId') templateId: string,
  ): Promise<{ is_success: boolean; data: TaskTemplateResponseDto }> {
    this.logger.log(`GET /tasks/templates/${templateId} - Getting template`);
    const data = await this.templateService.findOne(templateId);
    return {
      is_success: true,
      data,
    };
  }

  /**
   * Get template by phase ID
   * GET /api/tasks/templates/by-phase/:phaseId
   */
  @Get('by-phase/:phaseId')
  async findByPhaseId(
    @Param('phaseId') phaseId: string,
  ): Promise<{ is_success: boolean; data: TaskTemplateResponseDto }> {
    this.logger.log(`GET /tasks/templates/by-phase/${phaseId} - Getting template for phase`);
    const data = await this.templateService.findByPhaseId(phaseId);
    return {
      is_success: true,
      data,
    };
  }

  /**
   * Get default template
   * GET /api/tasks/templates/default
   */
  @Get('default')
  async findDefault(): Promise<{ is_success: boolean; data: TaskTemplateResponseDto }> {
    this.logger.log('GET /tasks/templates/default - Getting default template');
    const data = await this.templateService.findDefault();
    return {
      is_success: true,
      data,
    };
  }

  /**
   * Create a new template
   * POST /api/tasks/templates
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTaskTemplateDto,
  ): Promise<{ is_success: boolean; data: TaskTemplateResponseDto; message: string }> {
    this.logger.log(`POST /tasks/templates - Creating template: ${dto.name}`);
    // TODO: Get createdBy from authenticated user
    const data = await this.templateService.create(dto);
    return {
      is_success: true,
      data,
      message: 'Template created successfully',
    };
  }

  /**
   * Update an existing template
   * PUT /api/tasks/templates/:templateId
   */
  @Put(':templateId')
  async update(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateTaskTemplateDto,
  ): Promise<{ is_success: boolean; data: TaskTemplateResponseDto; message: string }> {
    this.logger.log(`PUT /tasks/templates/${templateId} - Updating template`);
    const data = await this.templateService.update(templateId, dto);
    return {
      is_success: true,
      data,
      message: 'Template updated successfully',
    };
  }

  /**
   * Delete a template
   * DELETE /api/tasks/templates/:templateId
   */
  @Delete(':templateId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('templateId') templateId: string,
  ): Promise<{ is_success: boolean; message: string }> {
    this.logger.log(`DELETE /tasks/templates/${templateId} - Deleting template`);
    await this.templateService.delete(templateId);
    return {
      is_success: true,
      message: 'Template deleted successfully',
    };
  }
}
