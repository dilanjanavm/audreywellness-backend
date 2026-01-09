// src/modules/complaint/complaint.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseArrayPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ComplaintService } from './complaint.service';
import * as complaintInterface from '../../common/interfaces/complaint.interface';
import {
  ComplaintCategory,
  ComplaintStatus,
  PriorityLevel,
} from 'src/common/enums/complain.enum';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async create(
    @Body() createComplaintDto: complaintInterface.CreateComplaintDto,
    @Request() req,
  ): Promise<complaintInterface.ComplaintResponseDto> {
    console.log('called com');
    return this.complaintService.create(createComplaintDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findAll(
    @Query('search') searchTerm?: string,
    @Query('status', new ParseArrayPipe({ optional: true }))
    status?: ComplaintStatus[],
    @Query('priority', new ParseArrayPipe({ optional: true }))
    priority?: PriorityLevel[],
    @Query('category', new ParseArrayPipe({ optional: true }))
    category?: ComplaintCategory[],
    @Query('assignedTo') assignedToId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{
    data: complaintInterface.ComplaintResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filters: complaintInterface.ComplaintSearchFilters = {
      searchTerm,
      status,
      priority,
      category,
      assignedToId,
      customerId,
      dateRange:
        startDate && endDate
          ? {
              startDate: new Date(startDate),
              endDate: new Date(endDate),
            }
          : undefined,
      page,
      limit: limit > 100 ? 100 : limit,
    };
    return this.complaintService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<complaintInterface.ComplaintResponseDto> {
    return this.complaintService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplaintDto: complaintInterface.UpdateComplaintDto,
    @Request() req,
  ): Promise<complaintInterface.ComplaintResponseDto> {
    return this.complaintService.update(
      id,
      updateComplaintDto,
      req.user.userId,
    );
  }

  /**
   * Update complaint status with validation and timeline tracking
   * Employees (USER role) can update status of complaints assigned to them
   */
  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: complaintInterface.UpdateComplaintStatusDto,
    @Request() req,
  ): Promise<complaintInterface.ComplaintResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.userId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userRole = req.user.role;

    // Check if USER role is trying to update status - verify they're assigned to the complaint
    if (userRole === UserRole.USER) {
      const complaint = await this.complaintService.findOne(id);
      if (complaint.assignedTo?.id !== userId) {
        throw new BadRequestException(
          'You can only update status of complaints assigned to you',
        );
      }
    }

    return this.complaintService.updateStatus(id, updateStatusDto, userId);
  }

  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
    @Request() req,
  ): Promise<complaintInterface.ComplaintResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.complaintService.addNote(id, note, req.user.userId);
  }

  @Post(':id/feedback')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async submitFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('feedback') feedback: string,
    @Body('rating') rating: number,
  ): Promise<complaintInterface.ComplaintResponseDto> {
    return this.complaintService.submitFeedback(id, feedback, rating);
  }
}
