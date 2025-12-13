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
  task: string;
  description?: string;
  phaseId: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignee?: string | null; // Legacy - kept for backward compatibility
  assignedUserId?: string; // NEW - User UUID
  costingId?: string; // NEW - Costing UUID
  batchSize?: string; // NEW - Batch size (e.g., "batch0_5kg")
  rawMaterials?: TaskRawMaterialDto[]; // NEW - Raw materials array
  comments?: number;
  views?: number;
  order?: number;
  updatedBy?: string;
}

export interface CreateTaskDto extends TaskBaseDto {}

export interface UpdateTaskDto extends Partial<Omit<TaskBaseDto, 'taskId'>> {}

export interface TaskResponseDto {
  id: string;
  taskId: string;
  phaseId: string;
  status: TaskStatus;
  order: number;
  task: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignee?: TaskAssigneeProfile | null; // Legacy - kept for backward compatibility
  assignedUserId?: string; // NEW
  assignedUser?: { // NEW
    id: string;
    userName: string;
    email: string;
  };
  costingId?: string; // NEW
  costing?: { // NEW
    id: string;
    itemName: string;
    itemCode: string;
    version: number;
    isActive: boolean;
  };
  batchSize?: string; // NEW
  rawMaterials?: TaskRawMaterialDto[]; // NEW
  comments: number; // Legacy count field
  commentList?: TaskCommentResponseDto[]; // NEW - Array of comments
  views: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
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
