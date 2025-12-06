import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Settings,
  Users,
  Clock,
  User,
  GitBranch,
  MoreVertical,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useBoard, useCapabilities, useUpdateTaskStatus } from '../hooks/useSui';
import { getStatusColor, type Task } from '../types';
import { getColumnColor } from '../constants';
import { format } from 'date-fns';

interface KanbanBoardProps {
  boardId: string;
  onBack: () => void;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onCreateSubtask: (parentTask: Task) => void;
  onOpenSettings: () => void;
  onManageMembers: () => void;
}

export function KanbanBoard({
  boardId,
  onBack,
  onCreateTask,
  onEditTask,
  onCreateSubtask,
  onOpenSettings,
  onManageMembers,
}: KanbanBoardProps) {
  const { data: boardData, isLoading, error } = useBoard(boardId);
  const { data: capabilities } = useCapabilities(boardId);
  const updateTaskStatus = useUpdateTaskStatus();

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<string | null>(null);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    if (!boardData) return {};
    const grouped: Record<string, Task[]> = {};
    
    // Initialize all columns
    boardData.statuses.forEach((status) => {
      grouped[status] = [];
    });

    // Group root tasks (no parent) by status
    boardData.tasks
      .filter((task) => !task.parentTaskId)
      .forEach((task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        }
      });

    return grouped;
  }, [boardData]);

  // Get subtasks for a task
  const getSubtasks = (taskId: string): Task[] => {
    if (!boardData) return [];
    return boardData.tasks.filter((t) => t.parentTaskId === taskId);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDropTargetStatus(status);
  };

  const handleDragLeave = () => {
    setDropTargetStatus(null);
  };

  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status && capabilities?.contributorCap) {
      updateTaskStatus.mutate({
        boardId,
        taskId: draggedTask.id,
        contributorCapId: capabilities.contributorCap.id,
        newStatus: status,
      });
    }
    setDraggedTask(null);
    setDropTargetStatus(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  if (error || !boardData) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">Failed to load board</p>
        <button onClick={onBack} className="btn-ghost mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const isAdmin = !!capabilities?.adminCap;
  const canContribute = !!capabilities?.contributorCap;

  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="btn-ghost p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {boardData.name}
            </h1>
            {boardData.description && (
              <p className="text-gray-400 mt-1">{boardData.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="font-mono text-neon-cyan">{boardData.completedTasks}</span>
              <span>/</span>
              <span className="font-mono">{boardData.totalTasks}</span>
              <span className="text-gray-500">completed</span>
            </div>
          </div>

          {isAdmin && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onManageMembers}
                className="btn-ghost flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Members
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenSettings}
                className="btn-ghost flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </motion.button>
            </>
          )}

          {canContribute && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateTask}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Task
            </motion.button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6">
        {boardData.statuses.map((status, index) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status] || []}
            colorGradient={getColumnColor(index)}
            isDropTarget={dropTargetStatus === status}
            canContribute={canContribute}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status)}
            onDragStart={handleDragStart}
            onEditTask={onEditTask}
            onCreateSubtask={onCreateSubtask}
            getSubtasks={getSubtasks}
            updateTaskStatus={updateTaskStatus}
            boardId={boardId}
            contributorCapId={capabilities?.contributorCap?.id}
            statuses={boardData.statuses}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  colorGradient: string;
  isDropTarget: boolean;
  canContribute: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragStart: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onCreateSubtask: (task: Task) => void;
  getSubtasks: (taskId: string) => Task[];
  updateTaskStatus: any;
  boardId: string;
  contributorCapId?: string;
  statuses: string[];
}

function KanbanColumn({
  status,
  tasks,
  isDropTarget,
  canContribute,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onEditTask,
  onCreateSubtask,
  getSubtasks,
  updateTaskStatus,
  boardId,
  contributorCapId,
  statuses,
}: KanbanColumnProps) {
  const statusColor = getStatusColor(status);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`kanban-column transition-all duration-200 ${
        isDropTarget ? 'ring-2 ring-neon-cyan/50 bg-neon-cyan/5' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between mb-4 pb-3 border-b border-surface-border`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor.bg} ${statusColor.border} border`} />
          <h3 className="font-display font-semibold text-white">{status}</h3>
          <span className="text-xs font-mono text-gray-500 bg-surface-hover px-2 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canContribute={canContribute}
              onDragStart={() => onDragStart(task)}
              onEdit={() => onEditTask(task)}
              onCreateSubtask={() => onCreateSubtask(task)}
              subtasks={getSubtasks(task.id)}
              updateTaskStatus={updateTaskStatus}
              boardId={boardId}
              contributorCapId={contributorCapId}
              statuses={statuses}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  canContribute: boolean;
  onDragStart: () => void;
  onEdit: () => void;
  onCreateSubtask: () => void;
  subtasks: Task[];
  updateTaskStatus: any;
  boardId: string;
  contributorCapId?: string;
  statuses: string[];
}

function TaskCard({
  task,
  canContribute,
  onDragStart,
  onEdit,
  onCreateSubtask,
  subtasks,
  updateTaskStatus,
  boardId,
  contributorCapId,
  statuses,
}: TaskCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const isOverdue = task.dueDate > 0 && task.dueDate < Date.now();

  const handleStatusChange = (newStatus: string) => {
    if (contributorCapId && newStatus !== task.status) {
      updateTaskStatus.mutate({
        boardId,
        taskId: task.id,
        contributorCapId,
        newStatus,
      });
    }
    setShowStatusMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      draggable={canContribute}
      onDragStart={onDragStart}
      className="task-card relative group"
    >
      {/* Quick status change */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 glass-card p-2 z-10">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-surface-hover transition-colors ${
                    s === task.status ? 'text-neon-cyan' : 'text-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
              <div className="border-t border-surface-border mt-2 pt-2">
                <button
                  onClick={onEdit}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-surface-hover text-gray-300"
                >
                  Edit Task
                </button>
                <button
                  onClick={onCreateSubtask}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-surface-hover text-gray-300"
                >
                  Add Subtask
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-white pr-8 mb-2">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Due date */}
        {task.dueDate > 0 && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded ${
              isOverdue
                ? 'bg-red-500/20 text-red-400'
                : 'bg-surface-hover text-gray-400'
            }`}
          >
            <Clock className="w-3 h-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        )}

        {/* Effort */}
        {task.effortHours > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-surface-hover rounded text-gray-400">
            <span className="font-mono">{task.effortHours}h</span>
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-1 px-2 py-1 bg-surface-hover rounded text-gray-400">
            <User className="w-3 h-3" />
            <span className="font-mono">
              {task.assignee.slice(0, 6)}...{task.assignee.slice(-4)}
            </span>
          </div>
        )}

        {/* Subtasks count */}
        {subtasks.length > 0 && (
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-1 px-2 py-1 bg-neon-purple/20 text-neon-purple rounded hover:bg-neon-purple/30 transition-colors"
          >
            <GitBranch className="w-3 h-3" />
            <span>{subtasks.length} subtask{subtasks.length > 1 ? 's' : ''}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showSubtasks ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Subtasks */}
      <AnimatePresence>
        {showSubtasks && subtasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-surface-border space-y-2"
          >
            {subtasks.map((subtask) => {
              const subtaskColor = getStatusColor(subtask.status);
              return (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 text-sm p-2 bg-surface-dark rounded-lg"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${subtaskColor.bg} ${subtaskColor.border} border`}
                  />
                  <span className="text-gray-300 flex-1 truncate">{subtask.title}</span>
                  <span className={`text-xs ${subtaskColor.text}`}>{subtask.status}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
