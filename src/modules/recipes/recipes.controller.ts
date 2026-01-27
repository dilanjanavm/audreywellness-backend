// src/modules/recipes/recipes.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Logger,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { RecipeResponseDto, RecipeVersionHistoryDto } from './dto/recipe-response.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly recipesService: RecipesService) {}

  /**
   * Create a new recipe
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(
    @Body() createRecipeDto: CreateRecipeDto,
    @Request() req,
  ): Promise<{ message: string; data: RecipeResponseDto }> {
    this.logger.log(`POST /recipes - Creating recipe for product: ${createRecipeDto.productId}`);
    try {
      const recipe = await this.recipesService.create(createRecipeDto, req.user?.userId);
      return {
        message: 'Recipe created successfully',
        data: recipe,
      };
    } catch (error) {
      this.logger.error(`POST /recipes - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all recipes with filters and pagination
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(
    @Query() query: RecipeQueryDto,
  ): Promise<{
    data: RecipeResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`GET /recipes - Query: ${JSON.stringify(query)}`);
    try {
      return await this.recipesService.findAll(query);
    } catch (error) {
      this.logger.error(`GET /recipes - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get recipe by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeVersions', new DefaultValuePipe(false), ParseBoolPipe) includeVersions?: boolean,
  ): Promise<{ data: RecipeResponseDto }> {
    this.logger.log(`GET /recipes/${id} - includeVersions: ${includeVersions}`);
    try {
      const recipe = await this.recipesService.findOne(id, includeVersions);
      return { data: recipe };
    } catch (error) {
      this.logger.error(`GET /recipes/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get version history for a product and batch size
   */
  @Get('product/:productId/batch/:batchSize/versions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async getVersionHistory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('batchSize') batchSize: string,
  ): Promise<{ data: RecipeVersionHistoryDto[] }> {
    this.logger.log(`GET /recipes/product/${productId}/batch/${batchSize}/versions`);
    try {
      const versions = await this.recipesService.getVersionHistory(productId, batchSize);
      return { data: versions };
    } catch (error) {
      this.logger.error(`GET /recipes/product/${productId}/batch/${batchSize}/versions - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update recipe
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req,
  ): Promise<{ message: string; data: RecipeResponseDto }> {
    this.logger.log(`PUT /recipes/${id} - Updating recipe`);
    try {
      const recipe = await this.recipesService.update(id, updateRecipeDto, req.user?.userId);
      return {
        message: 'Recipe updated successfully',
        data: recipe,
      };
    } catch (error) {
      this.logger.error(`PUT /recipes/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Set recipe as active version
   * 
   * This endpoint allows you to set a specific recipe version as the active version.
   * When a version is set as active, all other versions for the same product/batch
   * will be automatically deactivated.
   * 
   * Request Body: Empty object {} or omit body entirely
   */
  @Put(':id/set-active')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async setActiveVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string; data: RecipeResponseDto }> {
    this.logger.log(`PUT /recipes/${id}/set-active - Setting as active version`);
    try {
      const recipe = await this.recipesService.setActiveVersion(id, req.user?.userId);
      return {
        message: 'Recipe set as active version successfully',
        data: recipe,
      };
    } catch (error) {
      this.logger.error(`PUT /recipes/${id}/set-active - Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete recipe
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    this.logger.log(`DELETE /recipes/${id} - Deleting recipe`);
    try {
      return await this.recipesService.remove(id);
    } catch (error) {
      this.logger.error(`DELETE /recipes/${id} - Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}

