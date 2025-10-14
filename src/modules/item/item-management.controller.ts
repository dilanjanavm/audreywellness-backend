// src/modules/item/item-management.controller.ts
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
  ParseArrayPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ItemManagementService } from './item-management.service';
import * as itemInterface from '../../common/interfaces/item.interface';
import * as csvInterface from '../../common/interfaces/csv.interface';
import * as itemInterface_1 from '../../common/interfaces/item.interface';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemManagementController {
  constructor(private readonly itemService: ItemManagementService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // Uncomment this
  async create(
    @Body() createItemDto: itemInterface_1.CreateItemDto,
  ): Promise<itemInterface_1.ItemResponseDto> {
    console.log('Creating item:', createItemDto);
    return this.itemService.create(createItemDto);
  }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(): Promise<itemInterface.ItemResponseDto[]> {
    return this.itemService.findAll();
  }

  @Get(':itemCode')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(
    @Param('itemCode') itemCode: string,
  ): Promise<itemInterface.ItemResponseDto> {
    return this.itemService.findOne(itemCode);
  }

  @Put(':itemCode')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('itemCode') itemCode: string,
    @Body() updateItemDto: itemInterface.UpdateItemDto,
  ): Promise<itemInterface.ItemResponseDto> {
    return this.itemService.update(itemCode, updateItemDto);
  }

  @Delete(':itemCode')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN)
  async remove(@Param('itemCode') itemCode: string): Promise<void> {
    return this.itemService.remove(itemCode);
  }

  @Post('bulk-remove')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN)
  async bulkRemove(
    @Body('itemCodes', ParseArrayPipe) itemCodes: string[],
  ): Promise<{ deletedCount: number }> {
    return this.itemService.bulkRemove(itemCodes);
  }

  @Post('import')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async importFromCSV(
    @Body('csvContent') csvContent: string,
  ): Promise<csvInterface.CSVImportResult> {
    return this.itemService.importFromCSV(csvContent);
  }

  @Get('export/csv')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async exportToCSV(
    @Query() options: csvInterface.CSVExportOptions,
  ): Promise<string> {
    return this.itemService.exportToCSV(options);
  }

  @Get('search/:term')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async search(
    @Param('term') searchTerm: string,
  ): Promise<itemInterface.ItemResponseDto[]> {
    return this.itemService.search(searchTerm);
  }

  @Get('category/:categoryId')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findByCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<itemInterface.ItemResponseDto[]> {
    return this.itemService.findByCategory(categoryId);
  }
}
