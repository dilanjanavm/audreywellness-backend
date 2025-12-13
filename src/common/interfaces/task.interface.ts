import { TaskPriority, TaskStatus } from '../enums/task.enum';

export interface TaskAssigneeProfile {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
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
  assignee?: string | null;
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
  assignee?: TaskAssigneeProfile | null;
  comments: number;
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
