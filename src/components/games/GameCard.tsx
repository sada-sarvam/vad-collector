'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { GameConfig } from '@/types';

interface GameCardProps {
  game: GameConfig;
  stats?: {
    total: number;
    target: number;
  };
  index: number;
  isLoading?: boolean;
}

export default function GameCard({ game, stats, index, isLoading = false }: GameCardProps) {
  const focusLabels = {
    complete: 'Complete Focus',
    incomplete: 'Incomplete Focus',
    both: 'Both Labels',
  };

  const percentage = stats ? Math.min((stats.total / stats.target) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/games/${game.id}`}>
        <Card
          variant="interactive"
          padding="lg"
          accentColor={game.color}
          className="game-card h-full"
        >
          <div className="space-y-4">
            {/* Icon & Title */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-4xl mb-3 block">{game.icon}</span>
                <h3 className="text-xl font-display font-semibold text-white">
                  {game.name}
                </h3>
                <p className="text-sm text-white/50 mt-1">{game.nameHindi}</p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${game.color}20`,
                  color: game.color,
                }}
              >
                {focusLabels[game.focusLabel]}
              </span>
            </div>

            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed">
              {game.description}
            </p>

            {/* Progress */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/50">Progress</span>
                <span className="text-xs font-mono text-white/50">
                  {isLoading ? '...' : `${stats?.total || 0}/${stats?.target || 1500}`}
                </span>
              </div>
              <div className="progress-bar">
                {isLoading ? (
                  <div className="h-full bg-white/10 animate-pulse rounded-full" />
                ) : (
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    style={{
                      background: `linear-gradient(90deg, ${game.color} 0%, ${game.color}99 100%)`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Play Button Hint */}
            <div className="flex items-center justify-end pt-2">
              <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                Play →
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
