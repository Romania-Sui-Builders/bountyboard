import { motion } from 'framer-motion';
import { Plus, ChevronRight, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { useBoards } from '../hooks/useSui';
import type { Board } from '../types';

interface BoardListProps {
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: () => void;
}

export function BoardList({ onSelectBoard, onCreateBoard }: BoardListProps) {
  const { data: boards, isLoading, error } = useBoards();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">Failed to load boards</p>
        <p className="text-sm text-gray-500 mt-2">{String(error)}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">My Boards</h2>
          <p className="text-gray-400 mt-1">
            {boards?.length || 0} workspace{boards?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateBoard}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Board
        </motion.button>
      </div>

      {/* Board Grid */}
      {boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onClick={() => onSelectBoard(board.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateBoard={onCreateBoard} />
      )}
    </motion.div>
  );
}

function BoardCard({ board, onClick }: { board: Board; onClick: () => void }) {
  const completionRate = board.totalTasks > 0
    ? Math.round((board.completedTasks / board.totalTasks) * 100)
    : 0;

  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
      }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="task-card group cursor-pointer"
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-t-2xl" />

      <div className="pt-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-display font-semibold text-white group-hover:text-neon-cyan transition-colors">
            {board.name}
          </h3>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
        </div>

        {board.description && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {board.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-border">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <ListTodo className="w-4 h-4" />
            <span>{board.totalTasks} tasks</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-neon-green" />
            <span>{completionRate}% done</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-surface-dark rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full"
          />
        </div>

        {/* Statuses preview */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {board.statuses.slice(0, 4).map((status) => (
            <span
              key={status}
              className="px-2 py-0.5 text-xs font-mono bg-surface-hover rounded text-gray-400"
            >
              {status}
            </span>
          ))}
          {board.statuses.length > 4 && (
            <span className="px-2 py-0.5 text-xs font-mono text-gray-500">
              +{board.statuses.length - 4}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-12 text-center"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
        <LayoutGrid className="w-10 h-10 text-neon-cyan" />
      </div>
      <h3 className="text-xl font-display font-semibold text-white mb-2">
        No boards yet
      </h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Create your first board to start managing tasks on-chain with your team.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateBoard}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create Your First Board
      </motion.button>
    </motion.div>
  );
}

function LayoutGrid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
