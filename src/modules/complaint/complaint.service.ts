// src/modules/complaint/complaint.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, ILike } from 'typeorm';
import { ComplaintEntity } from './entities/complaint.entity';
import { ComplaintTimelineEntity } from './entities/complaint-timeline.entity';
import { CustomerService } from '../customer/customer.service';
import { CustomerEntity } from '../customer/entities/customer.entity';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
  ComplaintResponseDto,
  ComplaintSearchFilters,
  UpdateComplaintStatusDto,
} from '../../common/interfaces/complaint.interface';

import { TimelineEntryType } from '../../common/interfaces/timeline.interface';
import { UsersService } from '../users/users.service';
import {
  ComplaintStatus,
  PriorityLevel,
} from '../../common/enums/complain.enum';

@Injectable()
export class ComplaintService {
  constructor(
    @InjectRepository(ComplaintEntity)
    private readonly complaintRepository: Repository<ComplaintEntity>,
    @InjectRepository(ComplaintTimelineEntity)
    private readonly timelineRepository: Repository<ComplaintTimelineEntity>,
    private readonly customerService: CustomerService,
    private readonly userService: UsersService,
  ) {}

  async generateComplaintNumber(): Promise<string> {
    const lastComplaint = await this.complaintRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!lastComplaint) {
      return 'COMP-2025-001';
    }

    const lastNumber = parseInt(lastComplaint.complaintNumber.split('-')[2]);
    const newNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `COMP-2025-${newNumber}`;
  }

  async findOrCreateCustomer(
    createComplaintDto: CreateComplaintDto,
  ): Promise<CustomerEntity | null> {
    try {
      // First, try to find customer by email or phone
      const existingCustomers = await this.customerService.search(
        createComplaintDto.customerEmail || createComplaintDto.customerPhone,
      );

      const existingCustomer = existingCustomers.find(
        (customer) =>
          customer.email === createComplaintDto.customerEmail ||
          customer.smsPhone === createComplaintDto.customerPhone,
      );

      if (existingCustomer) {
        console.log(`✅ Found existing customer: ${existingCustomer.name}`);
        const customerRepo =
          this.complaintRepository.manager.getRepository(CustomerEntity);
        return await customerRepo.findOne({
          where: { id: existingCustomer.id },
        });
      }

      // If not found, create new customer
      console.log(
        `🆕 Creating new customer: ${createComplaintDto.customerName}`,
      );

      // Generate S_No for new customer
      const sNo = await this.customerService.generateSNo();

      const newCustomer = await this.customerService.create({
        sNo,
        name: createComplaintDto.customerName,
        shortName: createComplaintDto.customerName.substring(0, 20), // Truncate for short name
        branchName: createComplaintDto.customerCompany || 'Main Branch',
        cityArea: 'Unknown', // Default value
        email: createComplaintDto.customerEmail,
        smsPhone: createComplaintDto.customerPhone,
        currency: 'LKR',
        salesGroup: 'General', // Default group
        address: '', // Empty address
      });

      // Convert CustomerResponseDto to CustomerEntity
      const customerRepo =
        this.complaintRepository.manager.getRepository(CustomerEntity);
      return await customerRepo.findOne({ where: { id: newCustomer.id } });
    } catch (error) {
      console.error('❌ Error in findOrCreateCustomer:', error);
      throw new InternalServerErrorException(
        'Failed to process customer information',
      );
    }
  }

  async create(
    createComplaintDto: CreateComplaintDto,
    createdById: string,
  ): Promise<ComplaintResponseDto> {
    try {
      console.log(
        `🔄 Creating complaint for customer: ${createComplaintDto.customerEmail}`,
      );

      // Step 1: Validate assigned employee exists
      if (!createComplaintDto.assignedToId) {
        throw new BadRequestException('assignedToId is required');
      }

      // Validate assigned employee exists (will throw NotFoundException if not found)
      const assignedUser = await this.userService.findOne(
        createComplaintDto.assignedToId,
      );

      // Step 2: Find or create customer
      const customer = await this.findOrCreateCustomer(createComplaintDto);

      // Step 3: Generate complaint number
      const complaintNumber = await this.generateComplaintNumber();

      // Step 4: Create complaint with ASSIGNED status (since employee is assigned)
      const complaint = this.complaintRepository.create({
        complaintNumber,
        customerId: customer?.id,
        headline: createComplaintDto.headline,
        description: createComplaintDto.description,
        category: createComplaintDto.category,
        priority: createComplaintDto.priority || PriorityLevel.MEDIUM,
        status: ComplaintStatus.ASSIGNED, // Start with ASSIGNED since employee is assigned
        assignedToId: createComplaintDto.assignedToId,
        targetResolutionDate: createComplaintDto.targetResolutionDate,
      });

      const savedComplaint = await this.complaintRepository.save(complaint);

      // Step 5: Create initial timeline entries
      await this.createTimelineEntry(
        savedComplaint.id,
        createdById,
        TimelineEntryType.STATUS_CHANGE,
        `Complaint created and assigned to ${assignedUser.userName || assignedUser.email}`,
      );

      console.log(`✅ Complaint created successfully: ${complaintNumber}`);

      return this.mapToResponseDto(savedComplaint);
    } catch (error) {
      console.error('❌ Error creating complaint:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create complaint');
    }
  }

  async createTimelineEntry(
    complaintId: string,
    createdById: string,
    entryType: TimelineEntryType,
    description: string,
  ): Promise<ComplaintTimelineEntity> {
    const timelineEntry = this.timelineRepository.create({
      complaintId,
      createdById,
      entryType,
      description,
    });

    return await this.timelineRepository.save(timelineEntry);
  }

  async findAll(filters: ComplaintSearchFilters = {}): Promise<{
    data: ComplaintResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        searchTerm,
        status,
        priority,
        category,
        assignedToId,
        customerId,
        dateRange,
        page = 1,
        limit = 10,
      } = filters;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (searchTerm) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.headline = ILike(`%${searchTerm}%`);
      }

      if (status && status.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.status = In(status);
      }

      if (priority && priority.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.priority = In(priority);
      }

      if (category && category.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.category = In(category);
      }

      if (assignedToId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.assignedToId = assignedToId;
      }

      if (customerId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.customerId = customerId;
      }

      if (dateRange) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.createdAt = Between(dateRange.startDate, dateRange.endDate);
      }

      const [complaints, total] = await this.complaintRepository.findAndCount({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        relations: [
          'customer',
          'assignedTo',
          'timelineEntries',
          'timelineEntries.createdBy',
        ],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return {
        data: complaints.map((complaint) => this.mapToResponseDto(complaint)),
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error finding complaints:', error);
      throw new InternalServerErrorException('Failed to retrieve complaints');
    }
  }

  async findOne(id: string): Promise<ComplaintResponseDto> {
    try {
      const complaint = await this.complaintRepository.findOne({
        where: { id },
        relations: [
          'customer',
          'assignedTo',
          'timelineEntries',
          'timelineEntries.createdBy',
        ],
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      return this.mapToResponseDto(complaint);
    } catch (error) {
      console.error('Error finding complaint:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateComplaintDto: UpdateComplaintDto,
    updatedById: string,
  ): Promise<ComplaintResponseDto> {
    try {
      const complaint = await this.complaintRepository.findOne({
        where: { id },
        relations: ['customer', 'assignedTo'],
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      // Track status change for timeline
      if (
        updateComplaintDto.status &&
        updateComplaintDto.status !== complaint.status
      ) {
        await this.createTimelineEntry(
          id,
          updatedById,
          TimelineEntryType.STATUS_CHANGE,
          `Status changed from ${complaint.status} to ${updateComplaintDto.status}`,
        );

        // Set resolution date if status is RESOLVED
        const resolvedStatuses = [
          ComplaintStatus.RESOLVED,
          ComplaintStatus.AWAITING_FEEDBACK, // Legacy
        ];
        if (
          resolvedStatuses.includes(updateComplaintDto.status) &&
          !complaint.actualResolutionDate
        ) {
          updateComplaintDto.actualResolutionDate = new Date();
        }

        // Set closed date if status is CLOSED
        if (
          updateComplaintDto.status === ComplaintStatus.CLOSED &&
          !complaint.closedAt
        ) {
          updateComplaintDto.closedAt = new Date();
        }
      }

      const updatedComplaint = await this.complaintRepository.save({
        ...complaint,
        ...updateComplaintDto,
      });

      return this.mapToResponseDto(updatedComplaint);
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  }

  // NEW METHOD: Update complaint status separately
  async updateStatus(
    id: string,
    updateStatusDto: UpdateComplaintStatusDto,
    updatedById: string,
  ): Promise<ComplaintResponseDto> {
    try {
      const complaint = await this.complaintRepository.findOne({
        where: { id },
        relations: ['customer', 'assignedTo'],
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      // Validate status transition
      this.validateStatusTransition(complaint.status, updateStatusDto.status);

      // Create timeline entry for status change
      await this.createTimelineEntry(
        id,
        updatedById,
        TimelineEntryType.STATUS_CHANGE,
        `Status changed from ${complaint.status} to ${updateStatusDto.status}`,
      );

      const updateData: Partial<ComplaintEntity> = {
        status: updateStatusDto.status,
      };

      // Set resolution date if status is RESOLVED
      const resolvedStatuses = [
        ComplaintStatus.RESOLVED,
        ComplaintStatus.AWAITING_FEEDBACK, // Legacy
      ];
      if (
        resolvedStatuses.includes(updateStatusDto.status) &&
        !complaint.actualResolutionDate
      ) {
        updateData.actualResolutionDate = new Date();
      }

      // Set closed date if status is CLOSED
      if (
        updateStatusDto.status === ComplaintStatus.CLOSED &&
        !complaint.closedAt
      ) {
        updateData.closedAt = new Date();
      }

      // Add note if provided
      if (updateStatusDto.note) {
        await this.createTimelineEntry(
          id,
          updatedById,
          TimelineEntryType.NOTE_ADDED,
          updateStatusDto.note,
        );
      }

      const updatedComplaint = await this.complaintRepository.save({
        ...complaint,
        ...updateData,
      });

      return this.mapToResponseDto(updatedComplaint);
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw error;
    }
  }

  // Validate status transitions
  private validateStatusTransition(
    currentStatus: ComplaintStatus,
    newStatus: ComplaintStatus,
  ): void {
    // Map legacy statuses to new ones for validation
    const normalizeStatus = (status: ComplaintStatus): ComplaintStatus => {
      const legacyMap: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
        [ComplaintStatus.OPEN]: ComplaintStatus.RECEIVED,
        [ComplaintStatus.AWAITING_FEEDBACK]: ComplaintStatus.AWAITING_CUSTOMER,
        [ComplaintStatus.REOPENED]: ComplaintStatus.RECEIVED,
      };
      return legacyMap[status] || status;
    };

    const normalizedCurrent = normalizeStatus(currentStatus);
    const normalizedNew = normalizeStatus(newStatus);

    // If it's the same status, allow it (for legacy compatibility)
    if (currentStatus === newStatus) {
      return;
    }

    const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      [ComplaintStatus.RECEIVED]: [
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.REJECTED,
      ],
      [ComplaintStatus.ASSIGNED]: [
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.ON_HOLD,
        ComplaintStatus.REJECTED,
      ],
      [ComplaintStatus.IN_PROGRESS]: [
        ComplaintStatus.ON_HOLD,
        ComplaintStatus.AWAITING_CUSTOMER,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.REJECTED,
      ],
      [ComplaintStatus.ON_HOLD]: [
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.AWAITING_CUSTOMER,
        ComplaintStatus.REJECTED,
      ],
      [ComplaintStatus.AWAITING_CUSTOMER]: [
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.REJECTED,
      ],
      [ComplaintStatus.RESOLVED]: [
        ComplaintStatus.CLOSED,
        ComplaintStatus.AWAITING_CUSTOMER, // Can reopen if customer feedback needed
      ],
      [ComplaintStatus.CLOSED]: [
        ComplaintStatus.RECEIVED, // Can reopen a closed complaint
      ],
      [ComplaintStatus.REJECTED]: [
        ComplaintStatus.RECEIVED, // Can reopen a rejected complaint
      ],
      // Legacy statuses for backward compatibility
      [ComplaintStatus.OPEN]: [
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.REJECTED,
      ],
      [ComplaintStatus.AWAITING_FEEDBACK]: [
        ComplaintStatus.CLOSED,
        ComplaintStatus.RESOLVED,
      ],
      [ComplaintStatus.REOPENED]: [
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
      ],
    };

    const allowedTransitions =
      validTransitions[normalizedCurrent] || validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(normalizedNew) && !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async addNote(
    complaintId: string,
    note: string,
    createdById: string,
  ): Promise<ComplaintResponseDto> {
    try {
      const complaint = await this.complaintRepository.findOne({
        where: { id: complaintId },
      });

      if (!complaint) {
        throw new NotFoundException(
          `Complaint with ID ${complaintId} not found`,
        );
      }

      await this.createTimelineEntry(
        complaintId,
        createdById,
        TimelineEntryType.NOTE_ADDED,
        note,
      );

      return this.findOne(complaintId);
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  async submitFeedback(
    id: string,
    feedback: string,
    rating: number,
  ): Promise<ComplaintResponseDto> {
    try {
      const complaint = await this.complaintRepository.findOne({
        where: { id },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      const updatedComplaint = await this.complaintRepository.save({
        ...complaint,
        clientFeedback: feedback,
        feedbackRating: rating,
        status: ComplaintStatus.CLOSED,
        closedAt: new Date(),
      });

      await this.createTimelineEntry(
        id,
        complaint.assignedToId,
        TimelineEntryType.NOTE_ADDED,
        `Customer feedback received: Rating ${rating}/5`,
      );

      return this.mapToResponseDto(updatedComplaint);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  private mapToResponseDto(complaint: ComplaintEntity): ComplaintResponseDto {
    return {
      id: complaint.id,
      complaintNumber: complaint.complaintNumber,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      customer: this.mapCustomerToDto(complaint.customer),
      headline: complaint.headline,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      assignedTo: this.mapUserToDto(complaint.assignedTo),
      targetResolutionDate: complaint.targetResolutionDate,
      actualResolutionDate: complaint.actualResolutionDate,
      closedAt: complaint.closedAt,
      clientFeedback: complaint.clientFeedback,
      feedbackRating: complaint.feedbackRating,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      timelineEntries:
        complaint.timelineEntries?.map((timeline) => ({
          id: timeline.id,
          entryType: timeline.entryType,
          description: timeline.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdBy: this.mapUserToDto(timeline.createdBy),
          createdAt: timeline.createdAt,
        })) || [],
    };
  }

  private mapCustomerToDto(customer: any): any {
    if (!customer) return null;

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      id: customer.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      sNo: customer.sNo, // Updated from customerCode to sNo
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      name: customer.name, // Updated from fullName to name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      email: customer.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      phone: customer.smsPhone, // Updated from phone to smsPhone
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      branchName: customer.branchName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      cityArea: customer.cityArea,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      salesGroup: customer.salesGroup,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      customerType: customer.customerType,
    };
  }

  private mapUserToDto(user: any): any {
    if (!user) return null;

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      id: user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      email: user.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      username: user.username,
      // Add other user fields as needed
    };
  }
}
