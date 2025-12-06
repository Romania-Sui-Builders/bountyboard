import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PACKAGE_ID, MODULE_NAME, FUNCTIONS, OBJECT_TYPES, ROLES } from '../constants';
import type { Board, Task, AdminCap, ContributorCap } from '../types';

// Helper to parse on-chain data
function parseBoard(data: any): Board {
  const fields = data.data?.content?.fields || data.content?.fields || data;
  return {
    id: data.data?.objectId || data.objectId || fields.id?.id,
    name: fields.name,
    description: fields.description,
    owner: fields.owner,
    statuses: fields.statuses || [],
    taskIds: fields.task_ids || [],
    totalTasks: Number(fields.total_tasks || 0),
    completedTasks: Number(fields.completed_tasks || 0),
    createdAt: Number(fields.created_at || 0),
  };
}

function parseTask(data: any): Task {
  const fields = data.data?.content?.fields || data.content?.fields || data;
  return {
    id: data.data?.objectId || data.objectId || fields.id?.id,
    boardId: fields.board_id,
    title: fields.title,
    description: fields.description,
    status: fields.status,
    assignee: fields.assignee?.fields?.vec?.[0] || null,
    dueDate: Number(fields.due_date || 0),
    effortHours: Number(fields.effort_hours || 0),
    parentTaskId: fields.parent_task_id?.fields?.vec?.[0] || null,
    subtaskIds: fields.subtask_ids || [],
    creator: fields.creator,
    createdAt: Number(fields.created_at || 0),
    updatedAt: Number(fields.updated_at || 0),
  };
}

// Hook to fetch all boards owned by user or where user has capability
export function useBoards() {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['boards', account?.address],
    queryFn: async () => {
      if (!account?.address) return [];

      // Query for boards - get all Board objects
      // In a real app, you might want to index these events or use a different query approach
      const boardsResponse = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: OBJECT_TYPES.ADMIN_CAP,
        },
        options: {
          showContent: true,
        },
      });

      const boardIds = boardsResponse.data
        .map((cap: any) => cap.data?.content?.fields?.board_id)
        .filter(Boolean);

      if (boardIds.length === 0) return [];

      // Fetch actual board objects
      const boards: Board[] = [];
      for (const boardId of boardIds) {
        try {
          const boardData = await client.getObject({
            id: boardId,
            options: { showContent: true },
          });
          if (boardData.data) {
            boards.push(parseBoard(boardData));
          }
        } catch (e) {
          console.error('Failed to fetch board:', boardId, e);
        }
      }

      return boards;
    },
    enabled: !!account?.address,
  });
}

// Hook to fetch a single board with its tasks
export function useBoard(boardId: string | null) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!boardId) return null;

      const boardData = await client.getObject({
        id: boardId,
        options: { showContent: true },
      });

      if (!boardData.data) return null;

      const board = parseBoard(boardData);

      // Fetch all tasks for this board
      const tasks: Task[] = [];
      for (const taskId of board.taskIds) {
        try {
          const taskData = await client.getObject({
            id: taskId,
            options: { showContent: true },
          });
          if (taskData.data) {
            tasks.push(parseTask(taskData));
          }
        } catch (e) {
          console.error('Failed to fetch task:', taskId, e);
        }
      }

      return { ...board, tasks };
    },
    enabled: !!boardId,
  });
}

// Hook to fetch user's capabilities
export function useCapabilities(boardId: string | null) {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['capabilities', account?.address, boardId],
    queryFn: async () => {
      if (!account?.address || !boardId) return { adminCap: null, contributorCap: null };

      // Fetch admin caps
      const adminCapsResponse = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: OBJECT_TYPES.ADMIN_CAP,
        },
        options: { showContent: true },
      });

      const adminCap = adminCapsResponse.data.find(
        (cap: any) => cap.data?.content?.fields?.board_id === boardId
      );

      // Fetch contributor caps
      const contributorCapsResponse = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: OBJECT_TYPES.CONTRIBUTOR_CAP,
        },
        options: { showContent: true },
      });

      const contributorCap = contributorCapsResponse.data.find(
        (cap: any) => cap.data?.content?.fields?.board_id === boardId
      );

      return {
        adminCap: adminCap ? { id: adminCap.data?.objectId, boardId } as AdminCap : null,
        contributorCap: contributorCap ? { id: contributorCap.data?.objectId, boardId } as ContributorCap : null,
      };
    },
    enabled: !!account?.address && !!boardId,
  });
}

// Mutation hooks for transactions
export function useCreateBoard() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.CREATE_BOARD}`,
        arguments: [
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(description))),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useCreateTask() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      contributorCapId,
      title,
      description,
      status,
      dueDate,
      effortHours,
    }: {
      boardId: string;
      contributorCapId: string;
      title: string;
      description: string;
      status: string;
      dueDate: number;
      effortHours: number;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.CREATE_TASK}`,
        arguments: [
          tx.object(boardId),
          tx.object(contributorCapId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(title))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(description))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(status))),
          tx.pure.u64(dueDate),
          tx.pure.u64(effortHours),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useCreateSubtask() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      parentTaskId,
      contributorCapId,
      title,
      description,
      status,
      dueDate,
      effortHours,
    }: {
      boardId: string;
      parentTaskId: string;
      contributorCapId: string;
      title: string;
      description: string;
      status: string;
      dueDate: number;
      effortHours: number;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.CREATE_SUBTASK}`,
        arguments: [
          tx.object(boardId),
          tx.object(parentTaskId),
          tx.object(contributorCapId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(title))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(description))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(status))),
          tx.pure.u64(dueDate),
          tx.pure.u64(effortHours),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useUpdateTaskStatus() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      taskId,
      contributorCapId,
      newStatus,
    }: {
      boardId: string;
      taskId: string;
      contributorCapId: string;
      newStatus: string;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.UPDATE_TASK_STATUS}`,
        arguments: [
          tx.object(boardId),
          tx.object(taskId),
          tx.object(contributorCapId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(newStatus))),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useAssignTask() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      taskId,
      contributorCapId,
      assignee,
    }: {
      boardId: string;
      taskId: string;
      contributorCapId: string;
      assignee: string;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.ASSIGN_TASK}`,
        arguments: [
          tx.object(boardId),
          tx.object(taskId),
          tx.object(contributorCapId),
          tx.pure.address(assignee),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useAddMember() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      adminCapId,
      memberAddress,
      role,
    }: {
      boardId: string;
      adminCapId: string;
      memberAddress: string;
      role: number;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.ADD_MEMBER}`,
        arguments: [
          tx.object(boardId),
          tx.object(adminCapId),
          tx.pure.address(memberAddress),
          tx.pure.u8(role),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useAddStatus() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      adminCapId,
      status,
    }: {
      boardId: string;
      adminCapId: string;
      status: string;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.ADD_STATUS}`,
        arguments: [
          tx.object(boardId),
          tx.object(adminCapId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(status))),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useRemoveStatus() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      adminCapId,
      status,
    }: {
      boardId: string;
      adminCapId: string;
      status: string;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.REMOVE_STATUS}`,
        arguments: [
          tx.object(boardId),
          tx.object(adminCapId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(status))),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}

export function useUpdateTask() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      taskId,
      contributorCapId,
      title,
      description,
      dueDate,
      effortHours,
    }: {
      boardId: string;
      taskId: string;
      contributorCapId: string;
      title: string;
      description: string;
      dueDate: number;
      effortHours: number;
    }) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTIONS.UPDATE_TASK}`,
        arguments: [
          tx.object(boardId),
          tx.object(taskId),
          tx.object(contributorCapId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(title))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(description))),
          tx.pure.u64(dueDate),
          tx.pure.u64(effortHours),
        ],
      });

      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          }
        );
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
