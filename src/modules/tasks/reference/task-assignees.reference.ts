import { TaskAssigneeProfile } from '../../../common/interfaces/task.interface';

export const TASK_ASSIGNEE_REFERENCE: Record<string, TaskAssigneeProfile> = {
  'tonya-noble': {
    id: 'tonya-noble',
    name: 'Tonya Noble',
    avatar: 'avatar-10.jpg',
    role: 'Project Manager',
  },
  'ian-clarkson': {
    id: 'ian-clarkson',
    name: 'Ian Clarkson',
    avatar: 'avatar-12.jpg',
    role: 'Product Designer',
  },
  'mira-devon': {
    id: 'mira-devon',
    name: 'Mira Devon',
    avatar: 'avatar-08.jpg',
    role: 'Operations Lead',
  },
};

const DEFAULT_ROLE = 'Collaborator';

export const resolveAssigneeProfile = (
  assigneeId?: string,
): TaskAssigneeProfile | null => {
  if (!assigneeId) {
    return null;
  }

  const record = TASK_ASSIGNEE_REFERENCE[assigneeId];
  if (record) {
    return record;
  }

  const normalizedName = assigneeId
    .split(/[-_]/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

  return {
    id: assigneeId,
    name: normalizedName,
    role: DEFAULT_ROLE,
  };
};
