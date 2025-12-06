import { motion } from 'framer-motion';
import { ConnectButton } from '@mysten/dapp-kit';
import {
  Sparkles,
  Shield,
  GitBranch,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink p-[2px]"
          >
            <div className="w-full h-full rounded-3xl bg-obsidian-900 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6"
          >
            <span className="text-gradient">Bounty Board</span>
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto"
          >
            On-chain task management for Web3 teams. Transparent, immutable, and
            fully decentralized collaboration on{' '}
            <span className="text-neon-cyan">Sui Network</span>.
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <ConnectButton connectText="Connect Wallet to Start" />
            <a
              href="https://docs.sui.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-surface-border">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-display font-bold text-center text-white mb-12"
          >
            Built for Web3 Teams
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 border-t border-surface-border bg-surface-dark/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-display font-bold text-white mb-12"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center text-2xl font-display font-bold text-neon-cyan">
                  {index + 1}
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-surface-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            <span className="font-display font-semibold text-white">Bounty Board</span>
          </div>
          <p className="text-sm text-gray-500">
            Built on <span className="text-neon-cyan">Sui Network</span> •{' '}
            Powered by Move
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Shield,
    title: 'On-Chain Security',
    description:
      'All tasks and permissions are stored on Sui blockchain with capability-based access control.',
    gradient: 'from-neon-cyan to-blue-500',
  },
  {
    icon: GitBranch,
    title: 'Hierarchical Tasks',
    description:
      'Create subtasks to break down complex work into manageable pieces with parent-child relationships.',
    gradient: 'from-neon-purple to-pink-500',
  },
  {
    icon: Zap,
    title: 'Custom Workflows',
    description:
      'Configure your own statuses and workflow stages to match your team process.',
    gradient: 'from-neon-orange to-yellow-500',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description:
      'Administrators manage the board while contributors focus on tasks. All enforced on-chain.',
    gradient: 'from-neon-green to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    description:
      'Track completion rates and task counts directly from the blockchain state.',
    gradient: 'from-neon-pink to-rose-500',
  },
  {
    icon: CheckCircle2,
    title: 'Immutable History',
    description:
      'Every change is recorded on-chain, providing a permanent audit trail.',
    gradient: 'from-cyan-400 to-neon-cyan',
  },
];

const steps = [
  {
    title: 'Connect Wallet',
    description: 'Use Slush or any Sui wallet to authenticate and sign transactions.',
  },
  {
    title: 'Create a Board',
    description: 'Set up your workspace with custom statuses and invite team members.',
  },
  {
    title: 'Manage Tasks',
    description: 'Create, assign, and track tasks with full on-chain transparency.',
  },
];

interface FeatureCardProps {
  feature: (typeof features)[number];
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="glass-card p-6 group"
    >
      <div
        className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20 flex items-center justify-center`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-display font-semibold text-white mb-2 group-hover:text-neon-cyan transition-colors">
        {feature.title}
      </h3>
      <p className="text-gray-400">{feature.description}</p>
    </motion.div>
  );
}
