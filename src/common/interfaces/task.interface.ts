import { TaskPriority, TaskStatus } from '../enums/task.enum';

export interface TaskAssigneeProfile {
  id: string;
  name: string;
  role?: string;
}

export interface TaskRawMaterialDto {
  rawMaterialId: string;
  rawMaterialName: string;
  percentage: string;
  unitPrice: string;
  units: string;
  supplier: string;
  category: string;
  kg: number;
  cost: number;
}

export interface CreateTaskCommentDto {
  comment: string;
  ownerId?: string; // Optional - User UUID, if not provided, ownerName/ownerEmail can be used
  ownerName?: string; // Optional - For anonymous or external comments
  ownerEmail?: string; // Optional - For anonymous or external comments
}

export interface TaskCommentResponseDto {
  id: string;
  taskId: string;
  comment: string;
  ownerId?: string;
  owner?: {
    id: string;
    userName: string;
    email: string;
  };
  ownerName?: string;
  ownerEmail?: string;
  commentedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhaseBaseDto {
  name: string;
  color: string;
  description?: string;
  statuses: TaskStatus[];
  order?: number;
  updatedBy?: string;
}

export interface CreatePhaseDto extends PhaseBaseDto {}

export interface UpdatePhaseDto extends Partial<PhaseBaseDto> {}

export interface PhaseResponseDto {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  statuses: TaskStatus[];
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
  tasks?: TaskResponseDto[];
}

export interface TaskBaseDto {
  taskId?: string; // Optional - will be auto-generated if not provided
  task: string; // Task Name (mandatory)
  description?: string; // Task Description (optional)
  phaseId: string; // Phase ID (mandatory)
  status: TaskStatus; // Status (mandatory)
  priority?: TaskPriority; // Priority (mandatory in template)
  startDate?: string; // Start Date (mandatory in template) - ISO date string
  dueDate?: string; // End Date (mandatory in template) - ISO date string
  assignee?: string | null; // Legacy - kept for backward compatibility
  assignedUserId?: string; // Assign To - User UUID (mandatory in template)
  costingId?: string; // Costed Product - Costing UUID (optional)
  batchSize?: string; // Batch Size Ratio - Batch size (e.g., "batch0_5kg") (optional)
  rawMaterials?: TaskRawMaterialDto[]; // Raw materials array (optional)
  comments?: number;
  views?: number;
  order?: number;
  updatedBy?: string;
  // Optional template fields
  orderNumber?: string; // Order Number (optional)
  customerName?: string; // Customer Name (optional)
  customerMobile?: string; // Customer Contact - Mobile number (validated for SMS) (optional)
  customerAddress?: string; // Customer Address (optional)
  courierNumber?: string; // Courier Number - Tracking number (optional)
  courierService?: string; // Courier Service - Vendor selection (e.g., DHL, Fedex) (optional)
}

export interface CreateTaskDto extends TaskBaseDto {}

export interface UpdateTaskDto extends Partial<Omit<TaskBaseDto, 'taskId'>> {}

export interface TaskResponseDto {
  id: string;
  taskId: string;
  phaseId: string;
  status: TaskStatus;
  order: number;
  task: string; // Task Name
  description?: string; // Task Description
  priority?: TaskPriority; // Priority
  startDate?: Date; // Start Date
  dueDate?: Date; // End Date
  assignee?: TaskAssigneeProfile | null; // Legacy - kept for backward compatibility
  assignedUserId?: string; // Assign To - User UUID
  assignedUser?: { // Assign To - User object
    id: string;
    userName: string;
    email: string;
  };
  costingId?: string; // Costed Product - Costing UUID
  costing?: { // Costed Product - Costing object
    id: string;
    itemName: string;
    itemCode: string;
    version: number;
    isActive: boolean;
  };
  batchSize?: string; // Batch Size Ratio
  rawMaterials?: TaskRawMaterialDto[]; // Raw materials array
  comments: number; // Legacy count field
  commentList?: TaskCommentResponseDto[]; // Array of comments
  views: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  // Optional template fields
  orderNumber?: string; // Order Number
  customerName?: string; // Customer Name
  customerMobile?: string; // Customer Contact
  customerAddress?: string; // Customer Address
  courierNumber?: string; // Courier Number
  courierService?: string; // Courier Service
}

export interface PhaseTaskFilters {
  status?: TaskStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface TaskPositionDto {
  phaseId: string;
  status: TaskStatus;
  order: number;
  updatedBy?: string;
}

export interface MoveTaskDto {
  toPhaseId: string;
  toStatus?: TaskStatus; // Optional - defaults to first status of target phase
  order?: number; // Optional - defaults to next available order
  reason?: string; // Optional reason/notes for the movement
  movedBy?: string; // Optional - user ID or name who initiated the movement
}

export interface TaskMovementHistoryResponseDto {
  id: string;
  taskId: string;
  fromPhaseId: string;
  fromPhaseName?: string;
  toPhaseId: string;
  toPhaseName?: string;
  fromStatus?: string;
  toStatus?: string;
  movedByUserId?: string;
  movedByName?: string;
  movedByUser?: {
    id: string;
    userName: string;
    email: string;
  };
  reason?: string;
  movedAt: Date;
}
