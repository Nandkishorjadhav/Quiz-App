import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Clock, Filter } from 'lucide-react';
import type { Category, LeaderboardEntry } from '@/types';
import { quizService } from '@/services/quizService';
import { CATEGORIES } from '@/data/categories';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatTime } from '@/utils/helpers';

export default function LeaderboardPage() {
  useDocumentTitle('Leaderboard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | 'all'>('all');

  useEffect(() => {
    setLoading(true);
    quizService
      .getLeaderboard(filter === 'all' ? undefined : filter)
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false));
  }, [filter]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
            <Trophy className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">Leaderboard</h1>
            <p className="text-sm text-[var(--text-muted)]">Top performers across all categories</p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${filter === 'all' ? 'border-primary-500 bg-primary-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300'}`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${filter === c.id ? 'border-primary-500 bg-primary-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300'}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* List */}
      <Card glass padding="none">
        {loading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-12 w-full" count={5} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-3">🏆</p>
            <p className="text-[var(--text-muted)]">No entries yet. Be the first to top the board!</p>
          </div>
        ) : (
          <ol>
            {entries.map((entry, i) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 px-5 py-4 border-b last:border-b-0 border-[var(--border)] transition-colors
                  ${i === 0 ? 'bg-yellow-50/60 dark:bg-yellow-900/10' : i === 1 ? 'bg-gray-50/50 dark:bg-gray-800/20' : i === 2 ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
              >
                {/* Rank */}
                <span className="w-10 text-center text-lg font-extrabold shrink-0">
                  {rankIcon(i + 1)}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {entry.userName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{entry.userName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="primary" dot>{entry.category}</Badge>
                    <Badge
                      variant={entry.difficulty === 'easy' ? 'success' : entry.difficulty === 'medium' ? 'warning' : 'danger'}
                    >
                      {entry.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-primary-500">{entry.percentage}%</p>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 justify-end">
                    <Clock size={11} /> {formatTime(entry.timeTaken)}
                  </p>
                </div>

                {/* Medal for top 3 */}
                {i < 3 && (
                  <Medal
                    size={18}
                    className={i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-orange-400'}
                  />
                )}
              </motion.li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
