// src/modules/complaint/complaint.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
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
} from '../../common/interfaces/complaint.interface';

import { TimelineEntryType } from '../../common/interfaces/timeline.interface';
import { UsersService } from '../users/users.service';
import { ComplaintStatus, PriorityLevel } from '../../common/enums/complain.enum';

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
      // First, try to find customer by email
      const existingCustomers = await this.customerService.search(
        createComplaintDto.customerEmail,
      );
      const existingCustomer = existingCustomers.find(
        (customer) => customer.email === createComplaintDto.customerEmail,
      );

      if (existingCustomer) {
        console.log(`✅ Found existing customer: ${existingCustomer.fullName}`);
        // Convert CustomerResponseDto to CustomerEntity (we need the full entity)
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
      const newCustomer = await this.customerService.create({
        fullName: createComplaintDto.customerName,
        email: createComplaintDto.customerEmail,
        phone: createComplaintDto.customerPhone,
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

      // Step 1: Find or create customer
      const customer = await this.findOrCreateCustomer(createComplaintDto);

      // Step 2: Generate complaint number
      const complaintNumber = await this.generateComplaintNumber();

      // Step 3: Create complaint
      const complaint = this.complaintRepository.create({
        complaintNumber,
        customerId: customer?.id,
        headline: createComplaintDto.headline,
        description: createComplaintDto.description,
        category: createComplaintDto.category,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        priority: createComplaintDto.priority || PriorityLevel.MEDIUM,
        status: ComplaintStatus.OPEN,
        assignedToId: createComplaintDto.assignedToId || createdById, // Default to creator
        targetResolutionDate: createComplaintDto.targetResolutionDate,
      });

      const savedComplaint = await this.complaintRepository.save(complaint);

      // Step 4: Create initial timeline entry
      await this.createTimelineEntry(
        savedComplaint.id,
        createdById,
        TimelineEntryType.STATUS_CHANGE,
        `Complaint created and set to ${ComplaintStatus.OPEN}`,
      );

      console.log(`✅ Complaint created successfully: ${complaintNumber}`);

      return this.mapToResponseDto(savedComplaint);
    } catch (error) {
      console.error('❌ Error creating complaint:', error);
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
        if (
          updateComplaintDto.status === ComplaintStatus.RESOLVED &&
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
        complaint.assignedToId, // Use assigned staff ID
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
      id: customer.id,
      customerCode: customer.customerCode,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
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
