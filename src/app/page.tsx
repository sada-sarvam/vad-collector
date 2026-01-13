'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BarChart3, Users, Mic2, Trophy } from 'lucide-react';
import GameCard from '@/components/games/GameCard';
import Card from '@/components/ui/Card';
import { GAMES } from '@/lib/constants';
import { GameType } from '@/types';

interface Stats {
  totalRecordings: number;
  totalExperts: number;
  todayRecordings: number;
  byGame: Array<{ gameType: GameType; total: number }>;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats from API on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Get game stats by game type
  const getGameStats = (gameType: GameType) => {
    if (!stats) return { total: 0, target: 1500 }; // 500 per language × 3 languages
    const gameData = stats.byGame.find((g) => g.gameType === gameType);
    return {
      total: gameData?.total || 0,
      target: 1500,
    };
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-5xl">🎙️</span>
            <h1 className="text-5xl font-display font-bold bg-gradient-to-r from-aurora-teal via-aurora-blue to-aurora-purple bg-clip-text text-transparent">
              VAD Benchmark Collector
            </h1>
          </div>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Help Benchmark Semantic VAD (byte) by recording natural speech samples in Hindi, English, and Tamil
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card padding="md" className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-aurora-teal/20">
              <Mic2 className="w-6 h-6 text-aurora-teal" />
            </div>
            <div>
              <div className="stat-value text-2xl">
                {isLoading ? '...' : (stats?.totalRecordings || 0).toLocaleString()}
              </div>
              <div className="text-sm text-white/50">Total Recordings</div>
            </div>
          </Card>

          <Card padding="md" className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-aurora-purple/20">
              <Users className="w-6 h-6 text-aurora-purple" />
            </div>
            <div>
              <div className="stat-value text-2xl">
                {isLoading ? '...' : (stats?.totalExperts || 0)}
              </div>
              <div className="text-sm text-white/50">Contributors</div>
            </div>
          </Card>

          <Card padding="md" className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-aurora-green/20">
              <BarChart3 className="w-6 h-6 text-aurora-green" />
            </div>
            <div>
              <div className="stat-value text-2xl">
                {isLoading ? '...' : (stats?.todayRecordings || 0)}
              </div>
              <div className="text-sm text-white/50">Today's Recordings</div>
            </div>
          </Card>

          <Link href="/dashboard">
            <Card padding="md" variant="interactive" className="flex items-center gap-4 h-full">
              <div className="p-3 rounded-xl bg-aurora-pink/20">
                <Trophy className="w-6 h-6 text-aurora-pink" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">Dashboard</div>
                <div className="text-sm text-white/50">View Progress →</div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Games Section */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-display font-semibold text-white mb-2">
              Collection Games
            </h2>
            <p className="text-white/50">
              Choose a game to start recording. Each game focuses on different speech patterns.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                stats={getGameStats(game.id)}
                index={index}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card padding="lg" className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-white">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-aurora-teal/20 flex items-center justify-center text-aurora-teal font-bold">
                  1
                </div>
                <h3 className="font-semibold text-white">Choose a Game</h3>
                <p className="text-sm text-white/60">
                  Select from 5 different games, each designed to capture specific speech patterns.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-aurora-blue/20 flex items-center justify-center text-aurora-blue font-bold">
                  2
                </div>
                <h3 className="font-semibold text-white">Record Your Voice</h3>
                <p className="text-sm text-white/60">
                  Follow the prompts and record 2-16 second audio samples. You can re-record if needed.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-aurora-purple/20 flex items-center justify-center text-aurora-purple font-bold">
                  3
                </div>
                <h3 className="font-semibold text-white">Label & Submit</h3>
                <p className="text-sm text-white/60">
                  Confirm the category and submit. Your recordings help train AI models!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/30 text-sm"
        >
          <p>Built with ❤️ for Semantic VAD Project (Byte)</p>
          <p>Author: sadakopa@sarvam.ai</p>
        </motion.div>
      </div>
    </div>
  );
}
