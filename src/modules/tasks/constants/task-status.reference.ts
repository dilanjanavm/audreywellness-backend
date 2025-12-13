import { TaskStatus, TaskStatusMeta } from '../../../common/enums/task.enum';

export const TASK_STATUS_REFERENCE: TaskStatusMeta[] = [
  { id: TaskStatus.PENDING, label: 'Pending', color: '#d9d9d9' },
  { id: TaskStatus.ONGOING, label: 'In Progress', color: '#722ed1' },
  { id: TaskStatus.REVIEW, label: 'Review', color: '#fa8c16' },
  { id: TaskStatus.COMPLETED, label: 'Completed', color: '#52c41a' },
  { id: TaskStatus.FAILED, label: 'Failed', color: '#ff4d4f' },
];

export const TASK_STATUS_IDS = new Set(
  TASK_STATUS_REFERENCE.map((status) => status.id),
);
