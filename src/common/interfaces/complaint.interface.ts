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

  assignedToId?: string;
  targetResolutionDate: Date;
}

export interface UpdateComplaintDto {
  closedAt: Date;
  actualResolutionDate: Date;
  headline?: string;
  description?: string;
  category?: ComplaintCategory;
  priority?: PriorityLevel;
  status?: ComplaintStatus;
  assignedToId?: string;
  targetResolutionDate?: Date;
  clientFeedback?: string;
  feedbackRating?: number;
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
  assignedTo: any; // User response
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
  createdBy: any; // User response
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
