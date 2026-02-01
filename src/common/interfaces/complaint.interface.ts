// src/common/interfaces/complaint.interface.ts
import {
  ComplaintCategory,
  ComplaintStatus,
  PriorityLevel,
} from '../enums/complain.enum';
import { CustomerResponseDto } from './customer.interface';

export interface CreateComplaintDto {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerCompany?: string;

  headline: string;
  description: string;
  category: ComplaintCategory;
  priority?: PriorityLevel;

  assignedToId: string; // Required: Employee must be assigned when creating complaint
  targetResolutionDate: Date;
}

export interface UpdateComplaintDto {
  headline?: string;
  description?: string;
  category?: ComplaintCategory;
  priority?: PriorityLevel;
  status?: ComplaintStatus;
  assignedToId?: string;
  targetResolutionDate?: Date;
  clientFeedback?: string;
  feedbackRating?: number;
  actualResolutionDate?: Date;
  closedAt?: Date;
}

// NEW INTERFACE: For updating status separately
export interface UpdateComplaintStatusDto {
  status: ComplaintStatus;
  note?: string; // Optional note for the status change
  smsNotification?: {
    send: boolean;
    phoneNumber: string;
    message: string;
  };
}

export interface ComplaintResponseDto {
  id: string;
  complaintNumber: string;
  customer: CustomerResponseDto;
  headline: string;
  description: string;
  category: ComplaintCategory;
  priority: PriorityLevel;
  status: ComplaintStatus;
  assignedTo: any;
  targetResolutionDate: Date;
  actualResolutionDate?: Date;
  closedAt?: Date;
  clientFeedback?: string;
  feedbackRating?: number;
  createdAt: Date;
  updatedAt: Date;
  timelineEntries: TimelineEntryResponseDto[];
}

export interface TimelineEntryResponseDto {
  id: string;
  entryType: string;
  description: string;
  createdBy: any;
  createdAt: Date;
}

export interface ComplaintSearchFilters {
  searchTerm?: string;
  status?: ComplaintStatus[];
  priority?: PriorityLevel[];
  category?: ComplaintCategory[];
  assignedToId?: string;
  customerId?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  page?: number;
  limit?: number;
}
