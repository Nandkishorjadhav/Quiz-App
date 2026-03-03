import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RotateCcw, Home, Download, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import type { QuizResult } from '@/types';
import { useQuiz } from '@/context/QuizContext';
import { ConfettiEffect } from '@/components/quiz/ConfettiEffect';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatTime, getGrade } from '@/utils/helpers';

const PIE_COLORS = ['#22c55e', '#ef4444', '#94a3b8'];

export default function ResultPage() {
  useDocumentTitle('Quiz Result');
  const location = useLocation();
  const navigate = useNavigate();
  const { resetQuiz } = useQuiz();
  const result: QuizResult | null = (location.state as { result?: QuizResult })?.result ?? null;

  const [displayScore, setDisplayScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [fired, setFired] = useState(false);
  const scoreRef = useRef(false);

  useEffect(() => {
    if (!result) { navigate('/dashboard', { replace: true }); return; }
    if (scoreRef.current) return;
    scoreRef.current = true;

    // Animated counter
    const target = result.totalScore;
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayScore(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
      else { setDisplayScore(target); setFired(true); }
    };
    requestAnimationFrame(tick);
  }, [result, navigate]);

  if (!result) return null;

  const grade = getGrade(result.percentage);
  const pieData = [
    { name: 'Correct', value: result.correctCount },
    { name: 'Wrong', value: result.incorrectCount },
    { name: 'Skipped', value: result.skippedCount },
  ].filter((d) => d.value > 0);

  const handleRetake = () => {
    resetQuiz();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      {/* Confetti */}
      <ConfettiEffect trigger={fired} percentage={result.percentage} threshold={75} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Score hero ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/30"
          >
            <Trophy className="text-white" size={36} />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mb-1">
            Quiz Complete!
          </h1>
          <p className={`text-lg font-semibold ${grade.color} mb-6`}>{grade.label}</p>

          {/* Score ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <svg className="-rotate-90" width={160} height={160} aria-hidden="true">
              <circle cx={80} cy={80} r={68} fill="none" stroke="currentColor" strokeWidth={10} className="text-gray-200 dark:text-gray-700" />
              <circle
                cx={80} cy={80} r={68}
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 68}
                strokeDashoffset={2 * Math.PI * 68 * (1 - result.percentage / 100)}
                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-count-up" aria-live="polite">
              <span className="text-4xl font-extrabold text-[var(--text)]">{displayScore}</span>
              <span className="text-sm text-[var(--text-muted)]">/ {result.maxScore} pts</span>
              <span className="text-lg font-bold text-primary-500">{result.percentage}%</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Correct', value: result.correctCount, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Wrong', value: result.incorrectCount, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Skipped', value: result.skippedCount, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
              { label: 'Time', value: formatTime(result.timeTaken), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Category / difficulty badges */}
          <div className="flex justify-center gap-2 mt-5">
            <Badge variant="primary" dot>{result.config.category}</Badge>
            <Badge
              variant={result.config.difficulty === 'easy' ? 'success' : result.config.difficulty === 'medium' ? 'warning' : 'danger'}
            >
              {result.config.difficulty}
            </Badge>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Button variant="primary" leftIcon={<RotateCcw size={16} />} onClick={handleRetake}>
              Retake Quiz
            </Button>
            <Button variant="outline" leftIcon={<Home size={16} />} onClick={() => { resetQuiz(); navigate('/dashboard'); }}>
              Dashboard
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download size={16} />}
              onClick={() => window.print()}
              aria-label="Export result (print)"
            >
              Export PDF
            </Button>
          </div>
        </motion.div>

        {/* ── Charts ──────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Pie chart */}
          <Card glass padding="md">
            <h3 className="font-bold text-[var(--text)] mb-4">Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [`${v ?? 0} questions`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Accuracy bar */}
          <Card glass padding="md" className="space-y-4">
            <h3 className="font-bold text-[var(--text)]">Performance</h3>
            <ProgressBar value={result.percentage} label="Overall Score" showPercentage height="lg" color={result.percentage >= 75 ? 'success' : result.percentage >= 50 ? 'warning' : 'danger'} />
            <ProgressBar
              value={result.correctCount}
              max={result.questionResults.length}
              label="Accuracy"
              showPercentage
              height="md"
              color="success"
            />
            <ProgressBar
              value={result.timeTaken}
              max={result.config.timePerQuestion * result.questionResults.length}
              label="Time Used"
              showPercentage
              height="md"
              color="primary"
            />

            <div className="pt-2 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-[var(--text-muted)] text-xs">Avg Time/Q</p>
                <p className="font-bold text-[var(--text)]">
                  {Math.round(result.timeTaken / result.questionResults.length)}s
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-[var(--text-muted)] text-xs">Points Earned</p>
                <p className="font-bold text-[var(--text)]">
                  {result.totalScore}/{result.maxScore}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Answer Review ─────────────────────────────────────── */}
        <Card glass padding="md">
          <button
            type="button"
            onClick={() => setShowReview((p) => !p)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={showReview}
          >
            <h3 className="font-bold text-[var(--text)]">Review Answers ({result.questionResults.length} questions)</h3>
            {showReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4"
            >
              {result.questionResults.map((qr, i) => (
                <div key={qr.question.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Q{i + 1}</span>
                    <Badge variant={qr.isCorrect ? 'success' : qr.selectedOptionId ? 'danger' : 'default'}>
                      {qr.isCorrect ? '✓ Correct' : qr.selectedOptionId ? '✗ Wrong' : '— Skipped'}
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)]">+{qr.pointsEarned}pts</span>
                  </div>
                  <QuestionCard
                    question={qr.question}
                    questionNumber={i + 1}
                    totalQuestions={result.questionResults.length}
                    selectedOptionId={qr.selectedOptionId}
                    showResult={true}
                    onSelect={() => {}}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
