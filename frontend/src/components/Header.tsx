import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { LayoutGrid, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onShowBoardList: () => void;
}

export function Header({ onShowBoardList }: HeaderProps) {
  const account = useCurrentAccount();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-card border-b border-surface-border px-6 py-4"
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-display font-bold text-gradient">
              Bounty Board
            </h1>
            <p className="text-xs text-gray-500 font-mono">On-Chain Task Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {account && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShowBoardList}
              className="btn-ghost flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>My Boards</span>
            </motion.button>
          )}
          
          <div className="relative">
            <ConnectButton 
              connectText="Connect Wallet"
            />
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
