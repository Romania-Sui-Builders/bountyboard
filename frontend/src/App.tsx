import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { BoardList } from './components/BoardList';
import { KanbanBoard } from './components/KanbanBoard';
import {
  CreateBoardModal,
  CreateTaskModal,
  EditTaskModal,
  BoardSettingsModal,
  MembersModal,
} from './components/Modals';
import { useBoard, useCapabilities } from './hooks/useSui';
import type { Task } from './types';

type View = 'landing' | 'boards' | 'board';

export default function App() {
  const account = useCurrentAccount();
  const [view, setView] = useState<View>('landing');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Modal states
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);

  // Fetch board data and capabilities when a board is selected
  const { data: boardData } = useBoard(selectedBoardId);
  const { data: capabilities } = useCapabilities(selectedBoardId);

  // Handle wallet connection state
  const isConnected = !!account?.address;

  // Navigation handlers
  const handleShowBoards = () => {
    setView('boards');
    setSelectedBoardId(null);
  };

  const handleSelectBoard = (boardId: string) => {
    setSelectedBoardId(boardId);
    setView('board');
  };

  const handleBack = () => {
    if (view === 'board') {
      setView('boards');
      setSelectedBoardId(null);
    }
  };

  // Task handlers
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditTask(true);
  };

  const handleCreateSubtask = (parentTask: Task) => {
    setParentTaskForSubtask(parentTask);
    setShowCreateTask(true);
  };

  const handleCloseCreateTask = () => {
    setShowCreateTask(false);
    setParentTaskForSubtask(null);
  };

  // Determine current view content
  const renderContent = () => {
    if (!isConnected) {
      return <Landing />;
    }

    switch (view) {
      case 'boards':
        return (
          <div className="max-w-screen-xl mx-auto px-6 py-8">
            <BoardList
              onSelectBoard={handleSelectBoard}
              onCreateBoard={() => setShowCreateBoard(true)}
            />
          </div>
        );

      case 'board':
        if (!selectedBoardId) {
          return (
            <div className="max-w-screen-xl mx-auto px-6 py-8">
              <BoardList
                onSelectBoard={handleSelectBoard}
                onCreateBoard={() => setShowCreateBoard(true)}
              />
            </div>
          );
        }
        return (
          <div className="max-w-screen-2xl mx-auto px-6 py-8">
            <KanbanBoard
              boardId={selectedBoardId}
              onBack={handleBack}
              onCreateTask={() => setShowCreateTask(true)}
              onEditTask={handleEditTask}
              onCreateSubtask={handleCreateSubtask}
              onOpenSettings={() => setShowSettings(true)}
              onManageMembers={() => setShowMembers(true)}
            />
          </div>
        );

      default:
        return (
          <div className="max-w-screen-xl mx-auto px-6 py-8">
            <BoardList
              onSelectBoard={handleSelectBoard}
              onCreateBoard={() => setShowCreateBoard(true)}
            />
          </div>
        );
    }
  };

  // Auto-navigate to boards when wallet connects
  if (isConnected && view === 'landing') {
    setView('boards');
  }

  return (
    <div className="min-h-screen">
      <Header onShowBoardList={handleShowBoards} />

      <main>{renderContent()}</main>

      {/* Modals */}
      <CreateBoardModal
        isOpen={showCreateBoard}
        onClose={() => setShowCreateBoard(false)}
      />

      {selectedBoardId && capabilities?.contributorCap && boardData && (
        <CreateTaskModal
          isOpen={showCreateTask}
          onClose={handleCloseCreateTask}
          boardId={selectedBoardId}
          contributorCapId={capabilities.contributorCap.id}
          statuses={boardData.statuses}
          parentTask={parentTaskForSubtask}
        />
      )}

      {selectedBoardId && capabilities?.contributorCap && (
        <EditTaskModal
          isOpen={showEditTask}
          onClose={() => {
            setShowEditTask(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          boardId={selectedBoardId}
          contributorCapId={capabilities.contributorCap.id}
        />
      )}

      {selectedBoardId && capabilities?.adminCap && (
        <>
          <BoardSettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            board={boardData || null}
            adminCapId={capabilities.adminCap.id}
          />

          <MembersModal
            isOpen={showMembers}
            onClose={() => setShowMembers(false)}
            boardId={selectedBoardId}
            adminCapId={capabilities.adminCap.id}
          />
        </>
      )}
    </div>
  );
}
