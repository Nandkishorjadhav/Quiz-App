import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Clock, Home, BarChart2, Radio } from 'lucide-react';
import type { SpecialQuiz, SpecialQuizParticipant } from '@/types';
import { specialQuizService, categoryService } from '@/services/specialQuizService';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// ── Medal helpers ──────────────────────────────────────────────────────────────

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = [
  'from-yellow-400/20 to-amber-400/10 border-yellow-400/40',
  'from-gray-300/20 to-slate-300/10 border-gray-300/40',
  'from-orange-400/20 to-amber-600/10 border-orange-400/40',
];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="text-xl">{MEDAL_ICONS[rank - 1]}</span>;
  }
  return (
    <span className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
      {rank}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LiveResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useDocumentTitle('Live Quiz Results');

  const [quiz, setQuiz] = useState<SpecialQuiz | null>(null);
  const [ranked, setRanked] = useState<(SpecialQuizParticipant & { rank: number })[]>([]);
  const [polling, setPolling] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    const refresh = () => {
      const q = specialQuizService.getById(id);
      if (!q) return;
      setQuiz(q);
      setRanked(specialQuizService.getRankedParticipants(q));
      if (q.status === 'ended') {
        setPolling(false);
        clearInterval(pollRef.current!);
      }
    };

    refresh();
    pollRef.current = setInterval(refresh, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (!quiz) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myEntry = ranked.find((p) => p.userId === user?.id);
  const catMeta = categoryService.findById(quiz.category);
  const total = quiz.questions.length * 10;
  const submitted = ranked.filter((p) => p.submitted).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/30 mx-auto mb-3">
          <Trophy className="text-white" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--text)] mb-0.5">{quiz.title}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {catMeta?.icon} {catMeta?.label ?? quiz.category} ·{' '}
          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)} ·{' '}
          {quiz.questions.length} questions
        </p>
        {polling && (
          <p className="text-xs mt-2 text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
            <Radio size={11} className="animate-pulse" />
            {quiz.status === 'live' ? 'Quiz in progress — refreshing…' : 'Loading results…'}
          </p>
        )}
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Participants', value: ranked.length, icon: <BarChart2 size={15} />, color: 'text-violet-500' },
          { label: 'Submitted', value: submitted, icon: <Trophy size={15} />, color: 'text-emerald-500' },
          { label: 'Max Score', value: total.toString(), icon: <Medal size={15} />, color: 'text-amber-500' },
        ].map((s) => (
          <Card key={s.label} glass padding="sm">
            <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-semibold">{s.label}</span></div>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* My result highlight */}
      {myEntry && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl p-4 border-2 bg-gradient-to-br ${myEntry.rank <= 3 ? MEDAL_COLORS[myEntry.rank - 1] : 'from-primary-500/10 to-primary-600/5 border-primary-400/40'}`}
        >
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Your Result</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RankBadge rank={myEntry.rank} />
              <div>
                <p className="font-bold text-[var(--text)]">{myEntry.userName}</p>
                <p className="text-xs text-[var(--text-muted)]">Rank #{myEntry.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[var(--text)]">{myEntry.percentage}%</p>
              <p className="text-xs text-[var(--text-muted)]">{myEntry.score}/{total}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rankings table */}
      <Card glass>
        <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          Final Rankings
        </h2>
        {ranked.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">No participants yet</p>
        ) : (
          <div className="space-y-2">
            {ranked.map((p, idx) => {
              const isMe = p.userId === user?.id;
              const medalRow = p.rank <= 3 ? MEDAL_COLORS[p.rank - 1] : '';
              return (
                <motion.div
                  key={p.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isMe
                      ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-900/10'
                      : p.rank <= 3
                      ? `bg-gradient-to-r ${medalRow} border border-transparent`
                      : 'hover:bg-black/3 dark:hover:bg-white/3'
                  }`}
                >
                  <RankBadge rank={p.rank} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary-600 dark:text-primary-400' : 'text-[var(--text)]'}`}>
                      {p.userName} {isMe && <span className="text-xs font-normal">(you)</span>}
                    </p>
                    {!p.submitted && (
                      <p className="text-xs text-[var(--text-muted)]">Did not submit</p>
                    )}
                  </div>
                  {p.submitted ? (
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--text)]">{p.percentage}%</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-0.5 justify-end">
                        <Clock size={10} /> {p.timeTaken}s
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">—</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Back button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          leftIcon={<Home size={15} />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
