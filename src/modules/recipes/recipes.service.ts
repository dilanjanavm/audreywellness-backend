// src/modules/recipes/recipes.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Recipe, RecipeStatus } from './entities/recipe.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipePreparationStep } from './entities/recipe-preparation-step.entity';
import { RecipePreparationQuestion } from './entities/recipe-preparation-question.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import {
  RecipeResponseDto,
  RecipeStepResponseDto,
  RecipeIngredientResponseDto,
  RecipeVersionHistoryDto,
} from './dto/recipe-response.dto';
import { ItemEntity } from '../item/entities/item.entity';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeStep)
    private readonly stepRepository: Repository<RecipeStep>,
    @InjectRepository(RecipeIngredient)
    private readonly ingredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(RecipePreparationStep)
    private readonly preparationStepRepository: Repository<RecipePreparationStep>,
    @InjectRepository(RecipePreparationQuestion)
    private readonly preparationQuestionRepository: Repository<RecipePreparationQuestion>,
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
<<<<<<< HEAD
  ) {}
=======
  ) { }
>>>>>>> origin/new-dev

  /**
   * Create a new recipe with versioning support
   */
  async create(createRecipeDto: CreateRecipeDto, userId?: string): Promise<RecipeResponseDto> {
    this.logger.log(`Creating recipe for product: ${createRecipeDto.productId}, batch: ${createRecipeDto.batchSize}`);

    try {
      // Validate product/item exists
      const product = await this.itemRepository.findOne({
        where: { id: createRecipeDto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${createRecipeDto.productId} not found`);
      }

      // Validate totalTime matches sum of step durations
      const totalStepDuration = createRecipeDto.steps.reduce((sum, step) => sum + step.duration, 0);
      if (totalStepDuration !== createRecipeDto.totalTime) {
        throw new BadRequestException(
          `Total time (${createRecipeDto.totalTime}) must equal sum of step durations (${totalStepDuration})`,
        );
      }

      // Validate unified queue order (steps + preparationQuestions)
      const allOrders: number[] = [];
      createRecipeDto.steps.forEach((step) => allOrders.push(step.order));
      if (createRecipeDto.preparationQuestions) {
        createRecipeDto.preparationQuestions.forEach((prep) => allOrders.push(prep.order));
      }
<<<<<<< HEAD
      
=======

>>>>>>> origin/new-dev
      // Check for duplicate orders
      const uniqueOrders = new Set(allOrders);
      if (allOrders.length !== uniqueOrders.size) {
        throw new BadRequestException(
          `Order values must be unique across steps and preparationQuestions. Duplicate orders found.`,
        );
      }

      // Get the latest version for this product and batch size
      const existingRecipes = await this.recipeRepository.find({
        where: {
          productId: createRecipeDto.productId,
          batchSize: createRecipeDto.batchSize,
        },
        order: { version: 'DESC' },
        take: 1,
      });

      const nextVersion = existingRecipes.length > 0 ? existingRecipes[0].version + 1 : 1;

      // If this is the first version or status is active, set as active version
      const isActiveVersion = nextVersion === 1 || createRecipeDto.status === RecipeStatus.ACTIVE;

      // If setting as active, deactivate other versions
      if (isActiveVersion) {
        await this.recipeRepository.update(
          {
            productId: createRecipeDto.productId,
            batchSize: createRecipeDto.batchSize,
            isActiveVersion: true,
          },
          { isActiveVersion: false },
        );
      }

      // Generate recipe name if not provided
      const recipeName =
        createRecipeDto.name ||
        `${product.description || product.itemCode} - ${createRecipeDto.batchSize} Recipe`;

      // Create recipe
      const recipe = this.recipeRepository.create({
        name: recipeName,
        productId: createRecipeDto.productId,
        itemId: createRecipeDto.itemId,
        batchSize: createRecipeDto.batchSize,
        totalTime: createRecipeDto.totalTime,
        status: createRecipeDto.status || RecipeStatus.DRAFT,
        version: nextVersion,
        isActiveVersion: isActiveVersion,
        createdBy: userId,
      });

      const savedRecipe = await this.recipeRepository.save(recipe);

<<<<<<< HEAD
=======
      // Assign product for response mapping
      savedRecipe.product = product;

>>>>>>> origin/new-dev
      // Create steps
      const steps = createRecipeDto.steps.map((stepDto) =>
        this.stepRepository.create({
          recipeId: savedRecipe.id,
          order: stepDto.order,
          instruction: stepDto.instruction,
          temperature: stepDto.temperature,
          duration: stepDto.duration,
        }),
      );
      await this.stepRepository.save(steps);

      // Create ingredients
      const ingredients = createRecipeDto.ingredients.map((ingredientDto) =>
        this.ingredientRepository.create({
          recipeId: savedRecipe.id,
          name: ingredientDto.name,
          quantity: ingredientDto.quantity,
          unit: ingredientDto.unit,
          category: ingredientDto.category || null,
        }),
      );
      await this.ingredientRepository.save(ingredients);

      // Create preparation steps and questions if provided
      if (createRecipeDto.preparationQuestions && createRecipeDto.preparationQuestions.length > 0) {
        for (const prepStepDto of createRecipeDto.preparationQuestions) {
          const preparationStep = this.preparationStepRepository.create({
            recipeId: savedRecipe.id,
            order: prepStepDto.order,
          });
          const savedPrepStep = await this.preparationStepRepository.save(preparationStep);

          // Create questions for this preparation step
          const questions = prepStepDto.questions.map((questionDto) =>
            this.preparationQuestionRepository.create({
              preparationStepId: savedPrepStep.id,
              question: questionDto.question,
              hasCheckbox: questionDto.hasCheckbox,
            }),
          );
          await this.preparationQuestionRepository.save(questions);
        }
      }

      this.logger.log(`Recipe created successfully: ${savedRecipe.id}, version: ${nextVersion}`);

      return this.mapToResponseDto(savedRecipe);
    } catch (error) {
      this.logger.error(`Error creating recipe: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create recipe');
    }
  }

  /**
   * Find all recipes with filters and pagination
   */
  async findAll(query: RecipeQueryDto): Promise<{
    data: RecipeResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Finding recipes with filters: ${JSON.stringify(query)}`);

    try {
      const queryBuilder = this.recipeRepository.createQueryBuilder('recipe');

      // Apply filters
      if (query.productId) {
        queryBuilder.andWhere('recipe.productId = :productId', { productId: query.productId });
      }

      if (query.itemId) {
        queryBuilder.andWhere('recipe.itemId = :itemId', { itemId: query.itemId });
      }

      if (query.batchSize) {
        queryBuilder.andWhere('recipe.batchSize = :batchSize', { batchSize: query.batchSize });
      }

      if (query.status) {
        queryBuilder.andWhere('recipe.status = :status', { status: query.status });
      }

      if (query.search) {
        queryBuilder.andWhere(
          '(recipe.name LIKE :search OR recipe.batchSize LIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      // By default, only show active versions unless includeVersions is true
      if (query.includeVersions !== 'true') {
        queryBuilder.andWhere('recipe.isActiveVersion = :isActiveVersion', { isActiveVersion: true });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      queryBuilder
        .leftJoinAndSelect('recipe.steps', 'steps')
        .leftJoinAndSelect('recipe.ingredients', 'ingredients')
<<<<<<< HEAD
=======
        .leftJoinAndSelect('recipe.product', 'product')
>>>>>>> origin/new-dev
        .leftJoinAndSelect('recipe.preparationSteps', 'preparationSteps')
        .leftJoinAndSelect('preparationSteps.questions', 'preparationQuestions')
        .orderBy('recipe.createdAt', 'DESC')
        .addOrderBy('recipe.version', 'DESC')
        .skip(skip)
        .take(limit);

      const recipes = await queryBuilder.getMany();

      // For each recipe, fetch latest 3 versions and count total versions
      const recipesWithVersions = await Promise.all(
        recipes.map(async (recipe) => {
          // Get latest 3 versions (excluding current if it's already the latest)
          const latestVersions = await this.recipeRepository.find({
            where: {
              productId: recipe.productId,
              batchSize: recipe.batchSize,
            },
            order: { version: 'DESC' },
            take: 3,
            relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
          });

          // Count total versions
          const countOfVersions = await this.recipeRepository.count({
            where: {
              productId: recipe.productId,
              batchSize: recipe.batchSize,
            },
          });

          const responseDto = this.mapToResponseDto(recipe);
          responseDto.latestVersions = latestVersions.map((v) => this.mapToVersionHistoryDto(v));
          responseDto.countOfVersions = countOfVersions;

          return responseDto;
        }),
      );

      return {
        data: recipesWithVersions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error finding recipes: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve recipes');
    }
  }

  /**
   * Find recipe by ID (includes all versions)
   */
  async findOne(id: string, includeVersions: boolean = false): Promise<RecipeResponseDto> {
    this.logger.log(`Finding recipe: ${id}`);

    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id },
<<<<<<< HEAD
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
=======

        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
>>>>>>> origin/new-dev
        order: {
          steps: { order: 'ASC' },
        },
      });

      if (!recipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }

      // Get all versions for this product/batch
      const allVersions = await this.recipeRepository.find({
        where: {
          productId: recipe.productId,
          batchSize: recipe.batchSize,
        },
        order: { version: 'DESC' },
<<<<<<< HEAD
        relations: ['steps', 'ingredients'],
=======
        relations: ['steps', 'ingredients', 'product'],
>>>>>>> origin/new-dev
      });

      // Sort steps for each version
      allVersions.forEach((v) => {
        if (v.steps) {
          v.steps.sort((a, b) => a.order - b.order);
        }
      });

      // Count total versions
      const countOfVersions = allVersions.length;

      const responseDto = this.mapToResponseDto(recipe);
<<<<<<< HEAD
      
=======

>>>>>>> origin/new-dev
      // If includeVersions is true, return full recipe data for all versions
      // Otherwise, return summary only
      if (includeVersions) {
        responseDto.allVersions = allVersions.map((v) => this.mapToResponseDto(v));
      } else {
        responseDto.allVersions = allVersions.map((v) => this.mapToVersionHistoryDto(v));
      }
<<<<<<< HEAD
      
=======

>>>>>>> origin/new-dev
      responseDto.countOfVersions = countOfVersions;

      return responseDto;
    } catch (error) {
      this.logger.error(`Error finding recipe: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve recipe');
    }
  }

  /**
   * Get version history for a recipe
   */
  async getVersionHistory(productId: string, batchSize: string): Promise<RecipeVersionHistoryDto[]> {
    this.logger.log(`Getting version history for product: ${productId}, batch: ${batchSize}`);

    try {
      const recipes = await this.recipeRepository.find({
        where: {
          productId,
          batchSize,
        },
        order: { version: 'DESC' },
<<<<<<< HEAD
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
=======
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
>>>>>>> origin/new-dev
      });

      return recipes.map((recipe) => this.mapToVersionHistoryDto(recipe));
    } catch (error) {
      this.logger.error(`Error getting version history: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve version history');
    }
  }

  /**
   * Update recipe (creates new version if status changes to active)
   */
  async update(id: string, updateRecipeDto: UpdateRecipeDto, userId?: string): Promise<RecipeResponseDto> {
    this.logger.log(`Updating recipe: ${id}`);

    try {
      const existingRecipe = await this.recipeRepository.findOne({
        where: { id },
<<<<<<< HEAD
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
=======
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
>>>>>>> origin/new-dev
      });

      if (!existingRecipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }

      // If updating status to active and it's not currently active, create new version
      if (
        updateRecipeDto.status === RecipeStatus.ACTIVE &&
        existingRecipe.status !== RecipeStatus.ACTIVE &&
        !existingRecipe.isActiveVersion
      ) {
        this.logger.log(`Creating new version for recipe: ${id}`);
        return this.createNewVersion(existingRecipe, updateRecipeDto, userId);
      }

      // Validate unified queue order if steps or preparationQuestions are updated
      if (updateRecipeDto.steps || updateRecipeDto.preparationQuestions) {
        const allOrders: number[] = [];
        if (updateRecipeDto.steps) {
          updateRecipeDto.steps.forEach((step) => allOrders.push(step.order));
        } else if (existingRecipe.steps) {
          existingRecipe.steps.forEach((step) => allOrders.push(step.order));
        }
        if (updateRecipeDto.preparationQuestions) {
          updateRecipeDto.preparationQuestions.forEach((prep) => allOrders.push(prep.order));
        } else if (existingRecipe.preparationSteps) {
          existingRecipe.preparationSteps.forEach((prep) => allOrders.push(prep.order));
        }
<<<<<<< HEAD
        
=======

>>>>>>> origin/new-dev
        // Check for duplicate orders
        const uniqueOrders = new Set(allOrders);
        if (allOrders.length !== uniqueOrders.size) {
          throw new BadRequestException(
            `Order values must be unique across steps and preparationQuestions. Duplicate orders found.`,
          );
        }
      }

      // Validate totalTime if steps are updated
      if (updateRecipeDto.steps) {
        const totalStepDuration = updateRecipeDto.steps.reduce((sum, step) => sum + step.duration, 0);
        if (updateRecipeDto.totalTime && totalStepDuration !== updateRecipeDto.totalTime) {
          throw new BadRequestException(
            `Total time (${updateRecipeDto.totalTime}) must equal sum of step durations (${totalStepDuration})`,
          );
        }
        updateRecipeDto.totalTime = totalStepDuration;
      }

      // Update recipe fields (exclude steps, ingredients, and preparationQuestions as they are handled separately)
      const { steps, ingredients, preparationQuestions, ...recipeFields } = updateRecipeDto;
      Object.assign(existingRecipe, {
        ...recipeFields,
        updatedBy: userId,
      });

      const savedRecipe = await this.recipeRepository.save(existingRecipe);

      // Update steps if provided
      if (updateRecipeDto.steps) {
        await this.stepRepository.delete({ recipeId: id });
        const steps = updateRecipeDto.steps.map((stepDto) =>
          this.stepRepository.create({
            recipeId: id,
            order: stepDto.order,
            instruction: stepDto.instruction,
            temperature: stepDto.temperature,
            duration: stepDto.duration,
          }),
        );
        await this.stepRepository.save(steps);
      }

      // Update ingredients if provided
      if (updateRecipeDto.ingredients) {
        await this.ingredientRepository.delete({ recipeId: id });
        const ingredients = updateRecipeDto.ingredients.map((ingredientDto) =>
          this.ingredientRepository.create({
            recipeId: id,
            name: ingredientDto.name,
            quantity: ingredientDto.quantity,
            unit: ingredientDto.unit,
            category: ingredientDto.category || null,
          }),
        );
        await this.ingredientRepository.save(ingredients);
      }

      // Update preparation steps and questions if provided
      if (updateRecipeDto.preparationQuestions !== undefined) {
        // Delete all existing preparation steps (cascade will delete questions)
        await this.preparationStepRepository.delete({ recipeId: id });

        // Create new preparation steps and questions
        if (updateRecipeDto.preparationQuestions.length > 0) {
          for (const prepStepDto of updateRecipeDto.preparationQuestions) {
            const preparationStep = this.preparationStepRepository.create({
              recipeId: id,
              order: prepStepDto.order,
            });
            const savedPrepStep = await this.preparationStepRepository.save(preparationStep);

            // Create questions for this preparation step
            const questions = prepStepDto.questions.map((questionDto) =>
              this.preparationQuestionRepository.create({
                preparationStepId: savedPrepStep.id,
                question: questionDto.question,
                hasCheckbox: questionDto.hasCheckbox,
              }),
            );
            await this.preparationQuestionRepository.save(questions);
          }
        }
      }

      // Reload with relations
      const updatedRecipe = await this.recipeRepository.findOne({
        where: { id },
<<<<<<< HEAD
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
=======
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
>>>>>>> origin/new-dev
        order: {
          steps: { order: 'ASC' },
        },
      });

      this.logger.log(`Recipe updated successfully: ${id}`);
      return this.mapToResponseDto(updatedRecipe!);
    } catch (error) {
      this.logger.error(`Error updating recipe: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update recipe');
    }
  }

  /**
   * Create a new version of a recipe
   */
  private async createNewVersion(
    existingRecipe: Recipe,
    updateRecipeDto: UpdateRecipeDto,
    userId?: string,
  ): Promise<RecipeResponseDto> {
<<<<<<< HEAD
      // Load existing recipe with relations if not already loaded
      if (!existingRecipe.steps || !existingRecipe.ingredients || !existingRecipe.preparationSteps) {
        const fullRecipe = await this.recipeRepository.findOne({
          where: { id: existingRecipe.id },
          relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
        });
        if (fullRecipe) {
          existingRecipe.steps = fullRecipe.steps;
          existingRecipe.ingredients = fullRecipe.ingredients;
          existingRecipe.preparationSteps = fullRecipe.preparationSteps;
        }
      }
=======
    // Load existing recipe with relations if not already loaded
    if (!existingRecipe.steps || !existingRecipe.ingredients || !existingRecipe.preparationSteps) {
      const fullRecipe = await this.recipeRepository.findOne({
        where: { id: existingRecipe.id },
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
      });
      if (fullRecipe) {
        existingRecipe.steps = fullRecipe.steps;
        existingRecipe.ingredients = fullRecipe.ingredients;
        existingRecipe.preparationSteps = fullRecipe.preparationSteps;
      }
    }
>>>>>>> origin/new-dev

    // Get next version number
    const existingRecipes = await this.recipeRepository.find({
      where: {
        productId: existingRecipe.productId,
        batchSize: existingRecipe.batchSize,
      },
      order: { version: 'DESC' },
      take: 1,
    });

    const nextVersion = existingRecipes[0]?.version + 1 || existingRecipe.version + 1;

    // Deactivate other versions
    await this.recipeRepository.update(
      {
        productId: existingRecipe.productId,
        batchSize: existingRecipe.batchSize,
        isActiveVersion: true,
      },
      { isActiveVersion: false },
    );

    // Create new version
    const newRecipe = this.recipeRepository.create({
      name: updateRecipeDto.name || existingRecipe.name,
      productId: existingRecipe.productId,
      itemId: existingRecipe.itemId,
      batchSize: updateRecipeDto.batchSize || existingRecipe.batchSize,
      totalTime: updateRecipeDto.totalTime || existingRecipe.totalTime,
      status: updateRecipeDto.status || RecipeStatus.ACTIVE,
      version: nextVersion,
      isActiveVersion: true,
      createdBy: userId || existingRecipe.createdBy,
    });

    const savedRecipe = await this.recipeRepository.save(newRecipe);

    // Copy steps - need to load existing steps if not provided
    let stepsToCopy = updateRecipeDto.steps;
    if (!stepsToCopy && existingRecipe.steps) {
      stepsToCopy = existingRecipe.steps.map((step) => ({
        order: step.order,
        instruction: step.instruction,
        temperature: step.temperature,
        duration: step.duration,
      }));
    }

    if (stepsToCopy) {
      const steps = stepsToCopy.map((step) =>
        this.stepRepository.create({
          recipeId: savedRecipe.id,
          order: step.order,
          instruction: step.instruction,
          temperature: step.temperature,
          duration: step.duration,
        }),
      );
      await this.stepRepository.save(steps);
    }

    // Copy ingredients - need to load existing ingredients if not provided
    let ingredientsToCopy = updateRecipeDto.ingredients;
    if (!ingredientsToCopy && existingRecipe.ingredients) {
      ingredientsToCopy = existingRecipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: Number(ingredient.quantity),
        unit: ingredient.unit,
        category: ingredient.category,
      }));
    }

    if (ingredientsToCopy) {
      const ingredients = ingredientsToCopy.map((ingredient) =>
        this.ingredientRepository.create({
          recipeId: savedRecipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category || null,
        }),
      );
      await this.ingredientRepository.save(ingredients);
    }

    // Copy preparation steps - need to load existing preparation steps if not provided
    let preparationStepsToCopy = updateRecipeDto.preparationQuestions;
    if (!preparationStepsToCopy && existingRecipe.preparationSteps) {
      preparationStepsToCopy = existingRecipe.preparationSteps.map((prepStep) => ({
        order: prepStep.order,
        questions: prepStep.questions.map((question) => ({
          question: question.question,
          hasCheckbox: question.hasCheckbox,
        })),
      }));
    }

    if (preparationStepsToCopy) {
      for (const prepStepDto of preparationStepsToCopy) {
        const preparationStep = this.preparationStepRepository.create({
          recipeId: savedRecipe.id,
          order: prepStepDto.order,
        });
        const savedPrepStep = await this.preparationStepRepository.save(preparationStep);

        // Create questions for this preparation step
        const questions = prepStepDto.questions.map((questionDto) =>
          this.preparationQuestionRepository.create({
            preparationStepId: savedPrepStep.id,
            question: questionDto.question,
            hasCheckbox: questionDto.hasCheckbox,
          }),
        );
        await this.preparationQuestionRepository.save(questions);
      }
    }

    // Reload with relations
    const recipe = await this.recipeRepository.findOne({
      where: { id: savedRecipe.id },
<<<<<<< HEAD
      relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
=======
      relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
>>>>>>> origin/new-dev
      order: {
        steps: { order: 'ASC' },
      },
    });

    return this.mapToResponseDto(recipe!);
  }

  /**
   * Delete recipe
   */
  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting recipe: ${id}`);

    try {
      const recipe = await this.recipeRepository.findOne({ where: { id } });

      if (!recipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }

      await this.recipeRepository.delete(id);

      this.logger.log(`Recipe deleted successfully: ${id}`);
      return { message: 'Recipe deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting recipe: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete recipe');
    }
  }

  /**
   * Find recipe by productId, batchSize, and version number
   */
  async findRecipeByProductBatchVersion(
    productId: string,
    batchSize: string,
    version: number,
  ): Promise<Recipe> {
    this.logger.log(
      `Finding recipe by productId: ${productId}, batchSize: ${batchSize}, version: ${version}`,
    );

    const recipe = await this.recipeRepository.findOne({
      where: {
        productId,
        batchSize,
        version,
      },
    });

    if (!recipe) {
      throw new NotFoundException(
        `Recipe not found for productId: ${productId}, batchSize: ${batchSize}, version: ${version}`,
      );
    }

    return recipe;
  }

  /**
   * Set recipe as active version
   */
  async setActiveVersion(id: string, userId?: string): Promise<RecipeResponseDto> {
    this.logger.log(`Setting recipe as active version: ${id}`);

    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id },
<<<<<<< HEAD
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions'],
=======
        relations: ['steps', 'ingredients', 'preparationSteps', 'preparationSteps.questions', 'product'],
>>>>>>> origin/new-dev
      });

      if (!recipe) {
        throw new NotFoundException(`Recipe with ID ${id} not found`);
      }

      // Deactivate other versions
      await this.recipeRepository.update(
        {
          productId: recipe.productId,
          batchSize: recipe.batchSize,
          isActiveVersion: true,
        },
        { isActiveVersion: false },
      );

      // Set this version as active
      recipe.isActiveVersion = true;
      recipe.status = RecipeStatus.ACTIVE;
      recipe.updatedBy = userId;

      const savedRecipe = await this.recipeRepository.save(recipe);

      this.logger.log(`Recipe set as active version: ${id}`);
      return this.mapToResponseDto(savedRecipe);
    } catch (error) {
      this.logger.error(`Error setting active version: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to set active version');
    }
  }

  /**
   * Map entity to version history DTO
   */
  private mapToVersionHistoryDto(recipe: Recipe): RecipeVersionHistoryDto {
    return {
      id: recipe.id,
      name: recipe.name,
      version: recipe.version,
      isActiveVersion: recipe.isActiveVersion,
      status: recipe.status,
      totalTime: recipe.totalTime,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(recipe: Recipe): RecipeResponseDto {
    return {
      id: recipe.id,
      name: recipe.name,
<<<<<<< HEAD
=======
      productName: recipe.product?.description || recipe.product?.itemCode,
>>>>>>> origin/new-dev
      productId: recipe.productId,
      itemId: recipe.itemId,
      batchSize: recipe.batchSize,
      totalTime: recipe.totalTime,
      status: recipe.status,
      version: recipe.version,
      isActiveVersion: recipe.isActiveVersion,
      createdBy: recipe.createdBy,
      updatedBy: recipe.updatedBy,
      steps: (recipe.steps || [])
        .sort((a, b) => a.order - b.order)
        .map((step) => ({
          id: step.id,
          order: step.order,
          instruction: step.instruction,
          temperature: step.temperature,
          duration: step.duration,
          createdAt: step.createdAt,
          updatedAt: step.updatedAt,
        })),
      ingredients: (recipe.ingredients || []).map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: Number(ingredient.quantity),
        unit: ingredient.unit,
        category: ingredient.category,
        createdAt: ingredient.createdAt,
        updatedAt: ingredient.updatedAt,
      })),
      preparationQuestions: (recipe.preparationSteps || [])
        .sort((a, b) => a.order - b.order)
        .map((prepStep) => ({
          id: prepStep.id,
          order: prepStep.order,
          questions: (prepStep.questions || []).map((question) => ({
            id: question.id,
            question: question.question,
            hasCheckbox: question.hasCheckbox,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          })),
          createdAt: prepStep.createdAt,
          updatedAt: prepStep.updatedAt,
        })),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }
}

