export enum TaskStatus {
  PENDING = 'pending',
  ONGOING = 'ongoing',
  REVIEW = 'review',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface TaskStatusMeta {
  id: TaskStatus;
  label: string;
  color: string;
}
