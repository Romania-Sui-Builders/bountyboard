// Contract configuration - Update PACKAGE_ID after deploying to testnet
export const PACKAGE_ID = '0x18814b1fda3953cba93e521bac8d62df9bcf85c302c5da21541f67400a8fd43b';
export const MODULE_NAME = 'board';

// Function names
export const FUNCTIONS = {
  CREATE_BOARD: 'create_board',
  UPDATE_BOARD: 'update_board',
  ADD_MEMBER: 'add_member',
  REMOVE_MEMBER: 'remove_member',
  UPDATE_MEMBER_ROLE: 'update_member_role',
  ADD_STATUS: 'add_status',
  REMOVE_STATUS: 'remove_status',
  CREATE_TASK: 'create_task',
  CREATE_SUBTASK: 'create_subtask',
  UPDATE_TASK: 'update_task',
  UPDATE_TASK_STATUS: 'update_task_status',
  ASSIGN_TASK: 'assign_task',
  UNASSIGN_TASK: 'unassign_task',
} as const;

// Object types for querying
export const OBJECT_TYPES = {
  BOARD: `${PACKAGE_ID}::${MODULE_NAME}::Board`,
  TASK: `${PACKAGE_ID}::${MODULE_NAME}::Task`,
  ADMIN_CAP: `${PACKAGE_ID}::${MODULE_NAME}::AdminCap`,
  CONTRIBUTOR_CAP: `${PACKAGE_ID}::${MODULE_NAME}::ContributorCap`,
} as const;

// Role constants (matching Move contract)
export const ROLES = {
  CONTRIBUTOR: 1,
  ADMIN: 2,
} as const;

// Default statuses (matching Move contract defaults)
export const DEFAULT_STATUSES = ['To-Do', 'In-Progress', 'Blocked', 'Completed'];

// UI Constants
export const COLUMN_COLORS = [
  'from-gray-500/30 to-gray-600/10',
  'from-neon-cyan/30 to-neon-cyan/10',
  'from-neon-orange/30 to-neon-orange/10',
  'from-neon-green/30 to-neon-green/10',
  'from-neon-purple/30 to-neon-purple/10',
  'from-neon-pink/30 to-neon-pink/10',
];

export function getColumnColor(index: number): string {
  return COLUMN_COLORS[index % COLUMN_COLORS.length];
}
