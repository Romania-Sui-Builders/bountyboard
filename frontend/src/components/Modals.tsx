import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, UserPlus, Loader2 } from 'lucide-react';
import {
  useCreateBoard,
  useCreateTask,
  useCreateSubtask,
  useUpdateTask,
  useAddMember,
  useAddStatus,
  useRemoveStatus,
} from '../hooks/useSui';
import type { Task, Board } from '../types';
import { ROLES } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 border-b border-surface-border bg-surface-card/95 backdrop-blur-xl rounded-t-2xl">
              <h2 className="text-xl font-display font-bold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Create Board Modal
interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBoardModal({ isOpen, onClose }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createBoard = useCreateBoard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createBoard.mutate(
      { name, description },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Board Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Project Alpha"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your board..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createBoard.isPending || !name.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {createBoard.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Create Board
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Create Task Modal
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  contributorCapId: string;
  statuses: string[];
  parentTask?: Task | null;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  boardId,
  contributorCapId,
  statuses,
  parentTask,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(statuses[0] || 'To-Do');
  const [dueDate, setDueDate] = useState('');
  const [effortHours, setEffortHours] = useState('');

  const createTask = useCreateTask();
  const createSubtask = useCreateSubtask();

  const isSubtask = !!parentTask;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dueDateMs = dueDate ? new Date(dueDate).getTime() : 0;
    const effort = parseInt(effortHours) || 0;

    if (isSubtask && parentTask) {
      createSubtask.mutate(
        {
          boardId,
          parentTaskId: parentTask.id,
          contributorCapId,
          title,
          description,
          status,
          dueDate: dueDateMs,
          effortHours: effort,
        },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    } else {
      createTask.mutate(
        {
          boardId,
          contributorCapId,
          title,
          description,
          status,
          dueDate: dueDateMs,
          effortHours: effort,
        },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus(statuses[0] || 'To-Do');
    setDueDate('');
    setEffortHours('');
  };

  const isPending = createTask.isPending || createSubtask.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSubtask ? `Add Subtask to "${parentTask?.title}"` : 'Create New Task'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Implement login feature"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Effort (hours)
            </label>
            <input
              type="number"
              value={effortHours}
              onChange={(e) => setEffortHours(e.target.value)}
              placeholder="0"
              min="0"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {isSubtask ? 'Add Subtask' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Task Modal
interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  boardId: string;
  contributorCapId: string;
}

export function EditTaskModal({
  isOpen,
  onClose,
  task,
  boardId,
  contributorCapId,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [effortHours, setEffortHours] = useState('');

  const updateTask = useUpdateTask();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setEffortHours(task.effortHours.toString());
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !task) return;

    const dueDateMs = dueDate ? new Date(dueDate).getTime() : 0;
    const effort = parseInt(effortHours) || 0;

    updateTask.mutate(
      {
        boardId,
        taskId: task.id,
        contributorCapId,
        title,
        description,
        dueDate: dueDateMs,
        effortHours: effort,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Effort (hours)
            </label>
            <input
              type="number"
              value={effortHours}
              onChange={(e) => setEffortHours(e.target.value)}
              min="0"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateTask.isPending || !title.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {updateTask.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : null}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Board Settings Modal
interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  adminCapId: string;
}

export function BoardSettingsModal({
  isOpen,
  onClose,
  board,
  adminCapId,
}: BoardSettingsModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const addStatus = useAddStatus();
  const removeStatus = useRemoveStatus();

  const handleAddStatus = () => {
    if (!newStatus.trim() || !board) return;
    addStatus.mutate(
      { boardId: board.id, adminCapId, status: newStatus },
      { onSuccess: () => setNewStatus('') }
    );
  };

  const handleRemoveStatus = (status: string) => {
    if (!board) return;
    removeStatus.mutate({ boardId: board.id, adminCapId, status });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Board Settings">
      <div className="space-y-6">
        {/* Workflow Statuses */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Workflow Statuses
          </h3>
          <div className="space-y-2 mb-4">
            {board?.statuses.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 bg-surface-dark rounded-lg"
              >
                <span className="text-gray-200">{status}</span>
                <button
                  onClick={() => handleRemoveStatus(status)}
                  disabled={removeStatus.isPending}
                  className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="New status name"
              className="input-field flex-1"
            />
            <button
              onClick={handleAddStatus}
              disabled={addStatus.isPending || !newStatus.trim()}
              className="btn-primary px-4 flex items-center gap-2"
            >
              {addStatus.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border">
          <button onClick={onClose} className="btn-secondary w-full">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Members Modal
interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  adminCapId: string;
}

export function MembersModal({ isOpen, onClose, boardId, adminCapId }: MembersModalProps) {
  const [memberAddress, setMemberAddress] = useState('');
  const [role, setRole] = useState<number>(ROLES.CONTRIBUTOR);
  const addMember = useAddMember();

  const handleAddMember = () => {
    if (!memberAddress.trim()) return;
    addMember.mutate(
      { boardId, adminCapId, memberAddress, role },
      { onSuccess: () => setMemberAddress('') }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Members">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Add New Member</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={memberAddress}
              onChange={(e) => setMemberAddress(e.target.value)}
              placeholder="0x... (Sui address)"
              className="input-field font-mono"
            />
            <select
              value={role}
              onChange={(e) => setRole(parseInt(e.target.value))}
              className="input-field"
            >
              <option value={ROLES.CONTRIBUTOR}>Contributor</option>
              <option value={ROLES.ADMIN}>Administrator</option>
            </select>
            <button
              onClick={handleAddMember}
              disabled={addMember.isPending || !memberAddress.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {addMember.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              Add Member
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-border">
          <button onClick={onClose} className="btn-secondary w-full">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
