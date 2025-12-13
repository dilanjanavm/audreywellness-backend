// src/modules/costing/costing.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CostingService } from './costing.service';
import { CreateCostingDto } from './dto/create-costing.dto';
import { UpdateCostingDto } from './dto/update-costing.dto';
import { CostingResponseDto } from './dto/costing-response.dto';
import {
  ItemWithCostingResponseDto,
  PaginatedItemsWithCostingResponse,
} from './dto/items-with-costing.dto';
import { ItemsWithCostingQueryDto } from './dto/items-with-costing-query.dto';
import { ItemsByCategoriesDto } from './dto/ItemsByCategoriesDto';
import {
  PaginatedCostedProductsResponse,
  ProductCostHistoryDto,
} from './dto/cost-history.dto';

@Controller('costing')
export class CostingController {
  constructor(private readonly costingService: CostingService) {}

  /**
   * Create a new costing
   */
  @Post()
  async create(
    @Body() createCostingDto: CreateCostingDto,
  ): Promise<{ message: string; data: CostingResponseDto }> {
    try {
      const costing = await this.costingService.create(createCostingDto);
      return {
        message: 'Costing created successfully',
        data: costing,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all costings for an item
   */
  @Get('item/:itemId')
  async findByItemId(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<{ data: CostingResponseDto[] }> {
    try {
      const costings = await this.costingService.findByItemId(itemId);
      return { data: costings };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active costing for an item
   */
  @Get('item/:itemId/active')
  async findActiveByItemId(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<{ data: CostingResponseDto }> {
    try {
      const costing = await this.costingService.findActiveByItemId(itemId);
      return { data: costing };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get costing by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: CostingResponseDto }> {
    try {
      const costing = await this.costingService.findOne(id);
      return { data: costing };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update costing
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCostingDto: UpdateCostingDto,
  ): Promise<{ message: string; data: CostingResponseDto }> {
    try {
      const costing = await this.costingService.update(id, updateCostingDto);
      return {
        message: 'Costing updated successfully',
        data: costing,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set costing as active version
   */
  @Put(':id/set-active')
  async setActiveVersion(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; data: CostingResponseDto }> {
    try {
      const costing = await this.costingService.setActiveVersion(id);
      return {
        message: 'Costing set as active version successfully',
        data: costing,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete costing
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    try {
      await this.costingService.remove(id);
      return { message: 'Costing deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare two costing versions
   */
  @Get('compare/:costingId1/:costingId2')
  async compareCostings(
    @Param('costingId1', ParseUUIDPipe) costingId1: string,
    @Param('costingId2', ParseUUIDPipe) costingId2: string,
  ): Promise<{
    data: {
      costing1: CostingResponseDto;
      costing2: CostingResponseDto;
      differences: any;
    };
  }> {
    try {
      const [costing1, costing2] = await Promise.all([
        this.costingService.findOne(costingId1),
        this.costingService.findOne(costingId2),
      ]);

      const differences = this.calculateDifferences(costing1, costing2);

      return {
        data: {
          costing1,
          costing2,
          differences,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get costing history for an item
   */
  @Get('item/:itemId/history')
  async getCostingHistory(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{
    data: CostingResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const costings = await this.costingService.findByItemId(itemId);

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCostings = costings.slice(startIndex, endIndex);

      return {
        data: paginatedCostings,
        total: costings.length,
        page,
        limit,
        totalPages: Math.ceil(costings.length / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recalculate costing based on current raw material prices
   */
  @Post(':id/recalculate')
  async recalculateCosting(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; data: CostingResponseDto }> {
    try {
      const updatedCosting = await this.recalculateWithCurrentPrices(id);
      return {
        message: 'Costing recalculated with current prices',
        data: updatedCosting,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk operations - set multiple costings as inactive
   */
  @Post('bulk/deactivate')
  async bulkDeactivate(
    @Body('costingIds') costingIds: string[],
  ): Promise<{ message: string; deactivatedCount: number }> {
    try {
      if (
        !costingIds ||
        !Array.isArray(costingIds) ||
        costingIds.length === 0
      ) {
        throw new BadRequestException('costingIds array cannot be empty');
      }

      let deactivatedCount = 0;
      for (const costingId of costingIds) {
        try {
          const costing = await this.costingService.findOne(costingId);
          if (costing.isActive) {
            await this.costingService.update(costingId, {
              isActive: false,
            } as UpdateCostingDto);
            deactivatedCount++;
          }
        } catch (error) {
          console.error(`Failed to deactivate costing ${costingId}:`, error);
        }
      }

      return {
        message: `${deactivatedCount} costings deactivated successfully`,
        deactivatedCount,
      };
    } catch (error) {
      throw error;
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private calculateDifferences(
    costing1: CostingResponseDto,
    costing2: CostingResponseDto,
  ): any {
    const differences = {
      totalCosts: {} as any,
      rawMaterials: [] as any[],
      additionalCosts: [] as any[],
    };

    costing1.totalCosts.forEach((tc1) => {
      const tc2 = costing2.totalCosts.find(
        (tc) => tc.batchSize === tc1.batchSize,
      );
      if (tc2) {
        differences.totalCosts[tc1.batchSize] = {
          cost1: tc1.cost,
          cost2: tc2.cost,
          difference: tc2.cost - tc1.cost,
          percentageChange: ((tc2.cost - tc1.cost) / tc1.cost) * 100,
        };
      }
    });

    costing1.rawMaterials.forEach((rm1) => {
      const rm2 = costing2.rawMaterials.find(
        (rm) => rm.rawMaterialId === rm1.rawMaterialId,
      );
      if (rm2) {
        differences.rawMaterials.push({
          rawMaterialName: rm1.rawMaterialName,
          percentage1: rm1.percentage,
          percentage2: rm2.percentage,
          unitPrice1: rm1.unitPrice,
          unitPrice2: rm2.unitPrice,
          totalCost1: rm1.totalCost,
          totalCost2: rm2.totalCost,
        });
      }
    });

    return differences;
  }

  private async recalculateWithCurrentPrices(
    costingId: string,
  ): Promise<CostingResponseDto> {
    const existingCosting = await this.costingService.findOne(costingId);

    const updateDto: UpdateCostingDto = {
      rawMaterials: existingCosting.rawMaterials.map((rm) => ({
        rawMaterialId: rm.rawMaterialId,
        rawMaterialName: rm.rawMaterialName,
        percentage: rm.percentage,
        unitPrice: rm.unitPrice,
        supplier: rm.supplier,
        supplierId: rm.supplierId,
        category: rm.category,
        categoryId: rm.categoryId,
        units: rm.units,
        amountNeeded: rm.amountNeeded,
        batchCalculations: rm.batchCalculations,
      })),
      recalculate: true,
    };

    return await this.costingService.update(costingId, updateDto);
  }

  /**
   * Health check endpoint
   */
  @Get('health/check')
  healthCheck(): {
    status: string;
    timestamp: string;
    service: string;
  } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Costing Service',
    };
  }

  @Get('items/co')
  async findAllItemsWithCosting(
    @Query() query: ItemsWithCostingQueryDto,
  ): Promise<{ data: PaginatedItemsWithCostingResponse }> {
    try {
      const result = await this.costingService.findAllItemsWithCosting(query);
      return { data: result };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get items by category with costing information (paginated)
   */
  @Get('items/category/:category')
  async findItemsByCategoryWithCosting(
    @Param('category') category: string,
    @Query() query: Omit<ItemsWithCostingQueryDto, 'category'>,
  ): Promise<{ data: PaginatedItemsWithCostingResponse }> {
    try {
      const result = await this.costingService.findItemsByCategoryWithCosting(
        category,
        query,
      );
      return { data: result };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single item with costing information
   */
  @Get('items/:itemCode')
  async findItemWithCosting(
    @Param('itemCode') itemCode: string,
  ): Promise<{ data: ItemWithCostingResponseDto }> {
    try {
      const item = await this.costingService.findItemWithCosting(itemCode);
      return { data: item };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search items with costing information (paginated)
   */
  @Get('items/search/:term')
  async searchItemsWithCosting(
    @Param('term') searchTerm: string,
    @Query() query: Omit<ItemsWithCostingQueryDto, 'search'>,
  ): Promise<{ data: PaginatedItemsWithCostingResponse }> {
    try {
      const result = await this.costingService.searchItemsWithCosting(
        searchTerm,
        query,
      );
      return { data: result };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get items by multiple category IDs with costing information (paginated)
   */
  @Post('items/by-categories')
  async findItemsByCategoryIdsWithCosting(
    @Body() dto: ItemsByCategoriesDto,
  ): Promise<{ data: PaginatedItemsWithCostingResponse }> {
    try {
      const result =
        await this.costingService.findItemsByCategoryIdsWithCosting(dto);
      return { data: result };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all products that have costing records (costed products)
   */
  @Get('products/costed')
  async getCostedProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ): Promise<{ data: PaginatedCostedProductsResponse }> {
    try {
      const result = await this.costingService.getCostedProducts(
        page,
        limit,
        search,
        category,
      );
      return { data: result };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get detailed cost history for a product with cost change tracking
   */
  @Get('products/:itemId/cost-history')
  async getProductCostHistory(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<{ data: ProductCostHistoryDto }> {
    try {
      const history = await this.costingService.getProductCostHistory(itemId);
      return { data: history };
    } catch (error) {
      throw error;
    }
  }
}
