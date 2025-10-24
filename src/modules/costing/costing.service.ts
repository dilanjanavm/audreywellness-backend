// src/modules/costing/costing.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CostingEntity } from './entities/costing.entity';
import { CostingRawMaterial } from './entities/costing-raw-material.entity';
import { CostingAdditionalCost } from './entities/costing-additional-cost.entity';
import { CostingTotalCost } from './entities/costing-total-cost.entity';
import { ItemEntity } from '../item/entities/item.entity';
import {
  CreateCostingDto,
  RawMaterialDto,
  AdditionalCostDto,
} from './dto/create-costing.dto';
import { UpdateCostingDto } from './dto/update-costing.dto';
import { CostingResponseDto } from './dto/costing-response.dto';
import { BatchSize } from '../../common/enums/batch.enum';
import { Status } from '../../common/enums/common.enum';

@Injectable()
export class CostingService {
  constructor(
    @InjectRepository(CostingEntity)
    private readonly costingRepository: Repository<CostingEntity>,
    @InjectRepository(CostingRawMaterial)
    private readonly rawMaterialRepository: Repository<CostingRawMaterial>,
    @InjectRepository(CostingAdditionalCost)
    private readonly additionalCostRepository: Repository<CostingAdditionalCost>,
    @InjectRepository(CostingTotalCost)
    private readonly totalCostRepository: Repository<CostingTotalCost>,
    @InjectRepository(ItemEntity)
    private readonly itemRepository: Repository<ItemEntity>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new costing with version control
   */
  async create(createCostingDto: CreateCostingDto): Promise<CostingResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('Creating costing with data:', createCostingDto);

      // Validate item exists
      const item = await this.itemRepository.findOne({
        where: { id: createCostingDto.itemId },
      });

      if (!item) {
        throw new NotFoundException(
          `Item with ID ${createCostingDto.itemId} not found`,
        );
      }

      // Get next version number
      const latestCosting = await this.costingRepository.findOne({
        where: { itemId: createCostingDto.itemId },
        order: { version: 'DESC' },
      });

      const version = latestCosting ? latestCosting.version + 1 : 1;

      // Validate basic requirements
      this.validateCostingRequirements(createCostingDto);

      // Deactivate previous versions if setting as active
      if (createCostingDto.setAsActive) {
        await this.costingRepository.update(
          { itemId: createCostingDto.itemId, isActive: true },
          { isActive: false },
        );
      }

      // Create costing entity
      const costing = this.costingRepository.create({
        version,
        isActive: createCostingDto.setAsActive !== false,
        itemId: createCostingDto.itemId,
        itemName: createCostingDto.itemName,
        itemCode: createCostingDto.itemCode,
        totalPercentage: this.calculateTotalPercentage(
          createCostingDto.rawMaterials,
        ),
        totalRawMaterialCost: 0,
        totalAdditionalCost: 0,
        status: Status.ACTIVE,
      });

      const savedCosting = await queryRunner.manager.save(costing);
      console.log('Saved costing ID:', savedCosting.id);

      // Create raw materials
      const rawMaterials = await this.createRawMaterials(
        savedCosting.id,
        createCostingDto.rawMaterials,
        queryRunner,
      );

      // Create additional costs
      const additionalCosts = await this.createAdditionalCosts(
        savedCosting.id,
        createCostingDto.additionalCosts,
        queryRunner,
      );

      // Create total costs
      const totalCosts = await this.createTotalCosts(
        savedCosting.id,
        rawMaterials,
        additionalCosts,
        createCostingDto.totalCosts,
        queryRunner,
      );

      // Update costing with calculated totals
      savedCosting.totalRawMaterialCost =
        this.calculateTotalRawMaterialCost(rawMaterials);
      savedCosting.totalAdditionalCost =
        this.calculateTotalAdditionalCost(additionalCosts);

      await queryRunner.manager.save(CostingEntity, savedCosting);
      await queryRunner.commitTransaction();

      return this.mapToResponseDto({
        ...savedCosting,
        rawMaterials,
        additionalCosts,
        totalCosts,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating costing:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create costing');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all costings for an item
   */
  async findByItemId(itemId: string): Promise<CostingResponseDto[]> {
    try {
      const costings = await this.costingRepository.find({
        where: { itemId },
        relations: ['rawMaterials', 'additionalCosts', 'totalCosts'],
        order: { version: 'DESC' },
      });

      return costings.map((costing) => this.mapToResponseDto(costing));
    } catch (error) {
      console.error('Error finding costings by item:', error);
      throw new InternalServerErrorException('Failed to retrieve costings');
    }
  }

  /**
   * Get active costing for an item
   */
  async findActiveByItemId(itemId: string): Promise<CostingResponseDto> {
    try {
      const costing = await this.costingRepository.findOne({
        where: { itemId, isActive: true },
        relations: ['rawMaterials', 'additionalCosts', 'totalCosts'],
      });

      if (!costing) {
        throw new NotFoundException(
          `No active costing found for item ${itemId}`,
        );
      }

      return this.mapToResponseDto(costing);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding active costing:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve active costing',
      );
    }
  }

  /**
   * Get costing by ID
   */
  async findOne(id: string): Promise<CostingResponseDto> {
    try {
      const costing = await this.costingRepository.findOne({
        where: { id },
        relations: ['rawMaterials', 'additionalCosts', 'totalCosts'],
      });

      if (!costing) {
        throw new NotFoundException(`Costing with ID ${id} not found`);
      }

      return this.mapToResponseDto(costing);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding costing:', error);
      throw new InternalServerErrorException('Failed to retrieve costing');
    }
  }

  /**
   * Update costing
   */
  async update(
    id: string,
    updateCostingDto: UpdateCostingDto,
  ): Promise<CostingResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingCosting = await this.costingRepository.findOne({
        where: { id },
        relations: ['rawMaterials', 'additionalCosts', 'totalCosts'],
      });

      if (!existingCosting) {
        throw new NotFoundException(`Costing with ID ${id} not found`);
      }

      // // Update main costing
      // const updatedCosting = await queryRunner.manager.save(CostingEntity, {
      //   ...existingCosting,
      //   ...updateCostingDto,
      // });
      // console.log(updatedCosting);
      // Update related entities if provided
      if (updateCostingDto.rawMaterials) {
        await this.rawMaterialRepository.delete({ costingId: id });
        await this.createRawMaterials(
          id,
          updateCostingDto.rawMaterials,
          queryRunner,
        );
      }

      if (updateCostingDto.additionalCosts) {
        await this.additionalCostRepository.delete({ costingId: id });
        await this.createAdditionalCosts(
          id,
          updateCostingDto.additionalCosts,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating costing:', error);
      throw new InternalServerErrorException('Failed to update costing');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Set costing as active version
   */
  async setActiveVersion(id: string): Promise<CostingResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const costing = await this.costingRepository.findOne({ where: { id } });

      if (!costing) {
        throw new NotFoundException(`Costing with ID ${id} not found`);
      }

      // Deactivate all other versions for this item
      await this.costingRepository.update(
        { itemId: costing.itemId, isActive: true },
        { isActive: false },
      );

      // Activate this version
      costing.isActive = true;

      await queryRunner.manager.save(CostingEntity, costing);
      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error setting active version:', error);
      throw new InternalServerErrorException('Failed to set active version');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete costing
   */
  async remove(id: string): Promise<void> {
    try {
      const costing = await this.costingRepository.findOne({ where: { id } });

      if (!costing) {
        throw new NotFoundException(`Costing with ID ${id} not found`);
      }

      if (costing.isActive) {
        throw new BadRequestException(
          'Cannot delete active costing. Set another version as active first.',
        );
      }

      await this.costingRepository.delete(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error deleting costing:', error);
      throw new InternalServerErrorException('Failed to delete costing');
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private async createRawMaterials(
    costingId: string,
    rawMaterials: RawMaterialDto[],
    queryRunner: any,
  ): Promise<CostingRawMaterial[]> {
    console.log('Creating raw materials for costing:', costingId);
    console.log('Raw materials data:', rawMaterials);

    // FIX: Ensure rawMaterials is an array
    if (!Array.isArray(rawMaterials)) {
      console.error('rawMaterials is not an array:', rawMaterials);
      throw new BadRequestException('Raw materials must be an array');
    }

    const rawMaterialEntities = rawMaterials.map((rm) => {
      const totalCost = rm.unitPrice * rm.amountNeeded;

      // FIX: Handle missing batch calculations gracefully
      const batchCalculations = {
        batch0_5kg: rm.batchCalculations?.['batch0.5kg'] || { cost: 0, kg: 0 },
        batch1kg: rm.batchCalculations?.batch1kg || { cost: 0, kg: 0 },
        batch10kg: rm.batchCalculations?.batch10kg || { cost: 0, kg: 0 },
        batch25kg: rm.batchCalculations?.batch25kg || { cost: 0, kg: 0 },
        batch50kg: rm.batchCalculations?.batch50kg || { cost: 0, kg: 0 },
        batch100kg: rm.batchCalculations?.batch100kg || { cost: 0, kg: 0 },
        batch150kg: rm.batchCalculations?.batch150kg || { cost: 0, kg: 0 },
        batch200kg: rm.batchCalculations?.batch200kg || { cost: 0, kg: 0 },
      };

      // FIX: Handle missing supplier data
      return this.rawMaterialRepository.create({
        costingId,
        rawMaterialItemId: rm.rawMaterialId,
        rawMaterialName: rm.rawMaterialName,
        percentage: rm.percentage,
        unitPrice: rm.unitPrice,
        supplierId: rm.supplierId || '',
        supplierName: rm.supplier || '',
        category: rm.category,
        categoryId: rm.categoryId,
        units: rm.units,
        amountNeeded: rm.amountNeeded,
        batchCalculations,
        totalCost,
      });
    });

    return queryRunner.manager.save(CostingRawMaterial, rawMaterialEntities);
  }

  private async createAdditionalCosts(
    costingId: string,
    additionalCosts: AdditionalCostDto[],
    queryRunner: any,
  ): Promise<CostingAdditionalCost[]> {
    console.log('Creating additional costs for costing:', costingId);

    // FIX: Ensure additionalCosts is an array
    if (!Array.isArray(additionalCosts)) {
      console.error('additionalCosts is not an array:', additionalCosts);
      throw new BadRequestException('Additional costs must be an array');
    }

    const additionalCostEntities = additionalCosts.map((ac) => {
      // FIX: Handle missing batch costs gracefully
      const batchCosts = {
        batch0_5kg: ac.batchCosts?.['batch0.5kg'] || 0,
        batch1kg: ac.batchCosts?.batch1kg || 0,
        batch10kg: ac.batchCosts?.batch10kg || 0,
        batch25kg: ac.batchCosts?.batch25kg || 0,
        batch50kg: ac.batchCosts?.batch50kg || 0,
        batch100kg: ac.batchCosts?.batch100kg || 0,
        batch150kg: ac.batchCosts?.batch150kg || 0,
        batch200kg: ac.batchCosts?.batch200kg || 0,
      };

      return this.additionalCostRepository.create({
        costingId,
        costName: ac.costName,
        description: ac.description || '',
        costPerUnit: ac.costPerUnit,
        batchCosts,
      });
    });

    return queryRunner.manager.save(
      CostingAdditionalCost,
      additionalCostEntities,
    );
  }

  private async createTotalCosts(
    costingId: string,
    rawMaterials: CostingRawMaterial[],
    additionalCosts: CostingAdditionalCost[],
    totalCosts: Record<string, any>,
    queryRunner: any,
  ): Promise<CostingTotalCost[]> {
    console.log('Creating total costs for costing:', costingId);

    // FIX: Ensure rawMaterials and additionalCosts are arrays
    if (!Array.isArray(rawMaterials)) {
      console.error('rawMaterials is not an array in createTotalCosts:', rawMaterials);
      rawMaterials = [];
    }

    if (!Array.isArray(additionalCosts)) {
      console.error('additionalCosts is not an array in createTotalCosts:', additionalCosts);
      additionalCosts = [];
    }

    const totalCostEntities = Object.entries(totalCosts).map(
      ([batchSize, data]) => {
        let batchSizeEnum: BatchSize;

        switch (batchSize) {
          case 'batch0.5kg':
            batchSizeEnum = BatchSize.BATCH_0_5_KG;
            break;
          case 'batch1kg':
            batchSizeEnum = BatchSize.BATCH_1_KG;
            break;
          case 'batch10kg':
            batchSizeEnum = BatchSize.BATCH_10_KG;
            break;
          case 'batch25kg':
            batchSizeEnum = BatchSize.BATCH_25_KG;
            break;
          case 'batch50kg':
            batchSizeEnum = BatchSize.BATCH_50_KG;
            break;
          case 'batch100kg':
            batchSizeEnum = BatchSize.BATCH_100_KG;
            break;
          case 'batch150kg':
            batchSizeEnum = BatchSize.BATCH_150_KG;
            break;
          case 'batch200kg':
            batchSizeEnum = BatchSize.BATCH_200_KG;
            break;
          default:
            batchSizeEnum = BatchSize.BATCH_1_KG;
        }

        // FIX: Add array validation before calling reduce
        const rawMaterialCost = this.calculateBatchRawMaterialCost(
          rawMaterials,
          batchSizeEnum,
        );
        const additionalCost = this.calculateBatchAdditionalCost(
          additionalCosts,
          batchSizeEnum,
        );

        return this.totalCostRepository.create({
          costingId,
          batchSize: batchSizeEnum,
          cost: typeof data.cost === 'string' ? parseFloat(data.cost) : (data.cost || 0),
          kg: typeof data.kg === 'string' ? parseFloat(data.kg) : (data.kg || 0),
          rawMaterialCost,
          additionalCost,
        });
      },
    );

    return queryRunner.manager.save(CostingTotalCost, totalCostEntities);
  }

  private calculateBatchRawMaterialCost(
    rawMaterials: CostingRawMaterial[],
    batchSize: BatchSize,
  ): number {
    // FIX: Add array validation
    if (!Array.isArray(rawMaterials)) {
      console.error('rawMaterials is not an array in calculateBatchRawMaterialCost:', rawMaterials);
      return 0;
    }

    return rawMaterials.reduce((sum, rm) => {
      let batchCost = 0;

      // FIX: Add null checks for batchCalculations
      if (rm.batchCalculations) {
        switch (batchSize) {
          case BatchSize.BATCH_0_5_KG:
            batchCost = rm.batchCalculations.batch0_5kg?.cost || 0;
            break;
          case BatchSize.BATCH_1_KG:
            batchCost = rm.batchCalculations.batch1kg?.cost || 0;
            break;
          case BatchSize.BATCH_10_KG:
            batchCost = rm.batchCalculations.batch10kg?.cost || 0;
            break;
          case BatchSize.BATCH_25_KG:
            batchCost = rm.batchCalculations.batch25kg?.cost || 0;
            break;
          case BatchSize.BATCH_50_KG:
            batchCost = rm.batchCalculations.batch50kg?.cost || 0;
            break;
          case BatchSize.BATCH_100_KG:
            batchCost = rm.batchCalculations.batch100kg?.cost || 0;
            break;
          case BatchSize.BATCH_150_KG:
            batchCost = rm.batchCalculations.batch150kg?.cost || 0;
            break;
          case BatchSize.BATCH_200_KG:
            batchCost = rm.batchCalculations.batch200kg?.cost || 0;
            break;
        }
      }

      return sum + batchCost;
    }, 0);
  }

  private calculateBatchAdditionalCost(
    additionalCosts: CostingAdditionalCost[],
    batchSize: BatchSize,
  ): number {
    // FIX: Add array validation
    if (!Array.isArray(additionalCosts)) {
      console.error('additionalCosts is not an array in calculateBatchAdditionalCost:', additionalCosts);
      return 0;
    }

    return additionalCosts.reduce((sum, ac) => {
      let batchCost = 0;

      // FIX: Add null checks for batchCosts
      if (ac.batchCosts) {
        switch (batchSize) {
          case BatchSize.BATCH_0_5_KG:
            batchCost = ac.batchCosts.batch0_5kg || 0;
            break;
          case BatchSize.BATCH_1_KG:
            batchCost = ac.batchCosts.batch1kg || 0;
            break;
          case BatchSize.BATCH_10_KG:
            batchCost = ac.batchCosts.batch10kg || 0;
            break;
          case BatchSize.BATCH_25_KG:
            batchCost = ac.batchCosts.batch25kg || 0;
            break;
          case BatchSize.BATCH_50_KG:
            batchCost = ac.batchCosts.batch50kg || 0;
            break;
          case BatchSize.BATCH_100_KG:
            batchCost = ac.batchCosts.batch100kg || 0;
            break;
          case BatchSize.BATCH_150_KG:
            batchCost = ac.batchCosts.batch150kg || 0;
            break;
          case BatchSize.BATCH_200_KG:
            batchCost = ac.batchCosts.batch200kg || 0;
            break;
        }
      }

      return sum + batchCost;
    }, 0);
  }

  private validateCostingRequirements(
    createCostingDto: CreateCostingDto,
  ): void {
    if (
      !createCostingDto.rawMaterials ||
      !Array.isArray(createCostingDto.rawMaterials) ||
      createCostingDto.rawMaterials.length === 0
    ) {
      throw new BadRequestException('At least one raw material is required');
    }

    if (!createCostingDto.itemId) {
      throw new BadRequestException('Item ID is required');
    }
  }

  private calculateTotalPercentage(rawMaterials: RawMaterialDto[]): number {
    // FIX: Add array validation
    if (!Array.isArray(rawMaterials)) {
      console.error('rawMaterials is not an array in calculateTotalPercentage:', rawMaterials);
      return 0;
    }

    return rawMaterials.reduce((sum, rm) => sum + (rm.percentage || 0), 0);
  }

  private calculateTotalRawMaterialCost(
    rawMaterials: CostingRawMaterial[],
  ): number {
    // FIX: Add array validation
    if (!Array.isArray(rawMaterials)) {
      console.error('rawMaterials is not an array in calculateTotalRawMaterialCost:', rawMaterials);
      return 0;
    }

    return rawMaterials.reduce((sum, rm) => sum + (rm.totalCost || 0), 0);
  }

  private calculateTotalAdditionalCost(
    additionalCosts: CostingAdditionalCost[],
  ): number {
    // FIX: Add array validation
    if (!Array.isArray(additionalCosts)) {
      console.error('additionalCosts is not an array in calculateTotalAdditionalCost:', additionalCosts);
      return 0;
    }

    return additionalCosts.reduce((sum, ac) => {
      const batchTotal = Object.values(ac.batchCosts || {}).reduce(
        (batchSum, cost) => batchSum + (cost || 0),
        0,
      );
      return sum + batchTotal;
    }, 0);
  }

  private mapToResponseDto(costing: CostingEntity): CostingResponseDto {
    return {
      id: costing.id,
      version: costing.version,
      isActive: costing.isActive,
      itemId: costing.itemId,
      itemName: costing.itemName,
      itemCode: costing.itemCode,
      rawMaterials:
        costing.rawMaterials?.map((rm) => ({
          id: rm.id,
          rawMaterialId: rm.rawMaterialItemId,
          rawMaterialName: rm.rawMaterialName,
          percentage: rm.percentage,
          unitPrice: rm.unitPrice,
          supplier: rm.supplierName,
          supplierId: rm.supplierId,
          category: rm.category,
          categoryId: rm.categoryId,
          units: rm.units,
          amountNeeded: rm.amountNeeded,
          totalCost: rm.totalCost,
          batchCalculations: rm.batchCalculations,
          createdAt: rm.createdAt,
          updatedAt: rm.updatedAt,
        })) || [],
      additionalCosts:
        costing.additionalCosts?.map((ac) => ({
          id: ac.id,
          costName: ac.costName,
          description: ac.description,
          costPerUnit: ac.costPerUnit,
          batchCosts: ac.batchCosts,
          createdAt: ac.createdAt,
          updatedAt: ac.updatedAt,
        })) || [],
      totalCosts:
        costing.totalCosts?.map((tc) => ({
          id: tc.id,
          batchSize: tc.batchSize,
          cost: tc.cost,
          kg: tc.kg,
          rawMaterialCost: tc.rawMaterialCost,
          additionalCost: tc.additionalCost,
          createdAt: tc.createdAt,
          updatedAt: tc.updatedAt,
        })) || [],
      createdAt: costing.createdAt,
      updatedAt: costing.updatedAt,
      status: costing.status,
      totalRawMaterialCost: costing.totalRawMaterialCost,
      totalAdditionalCost: costing.totalAdditionalCost,
      totalPercentage: costing.totalPercentage,
    };
  }
}