'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Mic2, Users, Calendar, Target } from 'lucide-react';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { GAMES, LANGUAGES, CATEGORIES } from '@/lib/constants';
import { OverallStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Games
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold text-white">
            Collection Dashboard
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card padding="lg" className="text-center">
            <Mic2 className="w-8 h-8 text-aurora-teal mx-auto mb-3" />
            <div className="stat-value">{stats?.totalRecordings.toLocaleString() || 0}</div>
            <div className="text-sm text-white/50 mt-1">Total Recordings</div>
          </Card>

          <Card padding="lg" className="text-center">
            <Users className="w-8 h-8 text-aurora-purple mx-auto mb-3" />
            <div className="stat-value">{stats?.totalExperts || 0}</div>
            <div className="text-sm text-white/50 mt-1">Contributors</div>
          </Card>

          <Card padding="lg" className="text-center">
            <Calendar className="w-8 h-8 text-aurora-green mx-auto mb-3" />
            <div className="stat-value">{stats?.todayRecordings || 0}</div>
            <div className="text-sm text-white/50 mt-1">Today's Recordings</div>
          </Card>

          <Card padding="lg" className="text-center">
            <Target className="w-8 h-8 text-aurora-pink mx-auto mb-3" />
            <div className="stat-value">
              {stats?.completionPercentage.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-white/50 mt-1">Overall Completion</div>
          </Card>
        </motion.div>

        {/* Progress by Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card padding="lg" className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-white">
              Progress by Language
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {LANGUAGES.map((lang) => {
                const langStats = stats?.byLanguage.find(
                  (l) => l.language === lang.id
                );
                return (
                  <div key={lang.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <div className="font-semibold text-white">{lang.name}</div>
                        <div className="text-sm text-white/50">
                          {langStats?.total || 0} recordings
                        </div>
                      </div>
                    </div>

                    {/* Complete vs Incomplete */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="text-green-400 font-mono text-lg">
                          {langStats?.complete || 0}
                        </div>
                        <div className="text-xs text-white/50">Complete</div>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="text-orange-400 font-mono text-lg">
                          {langStats?.incomplete || 0}
                        </div>
                        <div className="text-xs text-white/50">Incomplete</div>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    <div className="space-y-2">
                      {langStats?.byCategory.map((cat) => {
                        const catConfig = CATEGORIES.find((c) => c.id === cat.category);
                        return (
                          <div key={cat.category}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/60">{catConfig?.name}</span>
                              <span className="text-white/40">
                                {cat.count}/{cat.target}
                              </span>
                            </div>
                            <div className="progress-bar h-1.5">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${Math.min(cat.percentage, 100)}%`,
                                  background: catConfig?.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Progress by Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card padding="lg" className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-white">
              Progress by Game
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {GAMES.map((game) => {
                const gameStats = stats?.byGame.find((g) => g.gameType === game.id);
                const target = 500 * 3; // 500 per language × 3 languages
                const percentage = ((gameStats?.total || 0) / target) * 100;

                return (
                  <Link key={game.id} href={`/games/${game.id}`}>
                    <Card
                      variant="interactive"
                      padding="md"
                      accentColor={game.color}
                      className="h-full"
                    >
                      <div className="text-center space-y-3">
                        <span className="text-3xl">{game.icon}</span>
                        <div className="text-sm font-medium text-white">
                          {game.name}
                        </div>
                        <div className="stat-value text-xl" style={{ color: game.color }}>
                          {gameStats?.total || 0}
                        </div>
                        <ProgressBar
                          value={gameStats?.total || 0}
                          max={target}
                          showPercentage={false}
                          color={game.color}
                          size="sm"
                        />
                        <div className="text-xs text-white/40">
                          {percentage.toFixed(0)}% of target
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Collection Targets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card padding="lg" className="space-y-4">
            <h2 className="text-xl font-display font-semibold text-white">
              Collection Targets
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-white/50 mb-1">Per Category</div>
                <div className="text-white font-semibold">500 samples</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-white/50 mb-1">Total Categories</div>
                <div className="text-white font-semibold">4 (per language)</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-white/50 mb-1">Languages</div>
                <div className="text-white font-semibold">3 (hi, en, ta)</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="text-white/50 mb-1">Total Target</div>
                <div className="text-white font-semibold">6,000 samples</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
