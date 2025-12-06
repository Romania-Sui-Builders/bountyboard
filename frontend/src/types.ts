// On-chain data types matching the Move contract

export interface Board {
  id: string;
  name: string;
  description: string;
  owner: string;
  statuses: string[];
  taskIds: string[];
  totalTasks: number;
  completedTasks: number;
  createdAt: number;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string;
  status: string;
  assignee: string | null;
  dueDate: number;
  effortHours: number;
  parentTaskId: string | null;
  subtaskIds: string[];
  creator: string;
  createdAt: number;
  updatedAt: number;
}

export interface Member {
  address: string;
  role: MemberRole;
}

export enum MemberRole {
  CONTRIBUTOR = 1,
  ADMIN = 2,
}

export interface AdminCap {
  id: string;
  boardId: string;
}

export interface ContributorCap {
  id: string;
  boardId: string;
}

// Frontend types
export interface BoardWithTasks extends Board {
  tasks: Task[];
}

export interface KanbanColumn {
  status: string;
  tasks: Task[];
  color: string;
}

// Form types
export interface CreateBoardForm {
  name: string;
  description: string;
}

export interface CreateTaskForm {
  title: string;
  description: string;
  status: string;
  dueDate: number;
  effortHours: number;
}

export interface CreateSubtaskForm extends CreateTaskForm {
  parentTaskId: string;
}

export interface AddMemberForm {
  address: string;
  role: MemberRole;
}

// Status colors mapping
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'To-Do': { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500' },
  'In-Progress': { bg: 'bg-neon-cyan/20', text: 'text-neon-cyan', border: 'border-neon-cyan' },
  'Blocked': { bg: 'bg-neon-orange/20', text: 'text-neon-orange', border: 'border-neon-orange' },
  'Completed': { bg: 'bg-neon-green/20', text: 'text-neon-green', border: 'border-neon-green' },
  // Default for custom statuses
  'default': { bg: 'bg-neon-purple/20', text: 'text-neon-purple', border: 'border-neon-purple' },
};

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS['default'];
}
