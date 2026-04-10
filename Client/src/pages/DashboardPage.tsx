import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Clock,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  ShieldCheck,
  Layers,
  Shuffle,
  Minus,
  Zap,
  Trophy,
  Target,
  TrendingUp,
  Star,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuiz } from '@/context/QuizContext';
import { quizService } from '@/services/quizService';
import { CATEGORIES } from '@/data/categories';
import type { Category, Difficulty, QuizConfig, QuizResult } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatTime } from '@/utils/helpers';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────

const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  description: string;
  emoji: string;
  color: string;
  bg: string;
  ring: string;
  glow: string;
}[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Fundamentals and basic syntax. Perfect for getting started.',
    emoji: '🟢',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/10 to-emerald-400/5',
    ring: 'ring-emerald-500',
    glow: 'shadow-emerald-500/20',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Practical patterns for intermediate learners.',
    emoji: '🟡',
    color: 'text-amber-400',
    bg: 'from-amber-500/10 to-amber-400/5',
    ring: 'ring-amber-500',
    glow: 'shadow-amber-500/20',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Edge cases, deep concepts, and advanced challenges.',
    emoji: '🔴',
    color: 'text-rose-400',
    bg: 'from-rose-500/10 to-rose-400/5',
    ring: 'ring-rose-500',
    glow: 'shadow-rose-500/20',
  },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const STEPS = [
  { n: 1, label: 'Category',   desc: 'Pick a topic' },
  { n: 2, label: 'Difficulty', desc: 'Set level'    },
  { n: 3, label: 'Configure',  desc: 'Customize'    },
  { n: 4, label: 'Start',      desc: 'Launch quiz'  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { startQuiz } = useQuiz();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQ, setTimePerQ] = useState(30);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    if (user) {
      quizService.getUserResults(user.id).then((r) => {
        setRecentResults(r.data.slice(-5).reverse());
      });
    }
  }, [user]);

  // ── Wizard navigation ──────────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 1) return selectedCategory !== null;
    if (step === 2) return selectedDifficulty !== null;
    return true;
  };

  const advance = () => {
    if (!canAdvance()) {
      if (step === 1) toast.error('Please select a category first');
      if (step === 2) toast.error('Please select a difficulty first');
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  // ── Start quiz ─────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!selectedCategory || !selectedDifficulty) return;
    setIsStarting(true);
    try {
      const config: QuizConfig = {
        category: selectedCategory,
        difficulty: selectedDifficulty,
        totalQuestions: questionCount,
        timePerQuestion: timePerQ,
        shuffleQuestions: shuffleQ,
        shuffleOptions: shuffleOpts,
        negativeMarking,
        negativeMarkValue: 0.25,
      };
      const res = await quizService.getQuestions(
        selectedCategory,
        selectedDifficulty,
        questionCount,
        shuffleQ,
      );
      if (res.data.length === 0) {
        toast.error('No questions found for this selection. Try another category or difficulty.');
        setIsStarting(false);
        return;
      }
      startQuiz(config, res.data);
      navigate('/quiz');
    } catch {
      toast.error('Failed to load quiz. Please try again.');
      setIsStarting(false);
    }
  };

  const catMeta = CATEGORIES.find((c) => c.id === selectedCategory);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const avgScore = recentResults.length
    ? Math.round(recentResults.reduce((s, r) => s + r.percentage, 0) / recentResults.length)
    : null;
  const bestScore = recentResults.length
    ? Math.max(...recentResults.map((r) => r.percentage))
    : null;

  const scoreColor = (pct: number) =>
    pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1280px] space-y-7 pb-20">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0e0e18]"
      >
        {/* Layered backgrounds */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_20%,rgba(124,111,255,0.18)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_10%_80%,rgba(45,212,191,0.1)_0%,transparent_55%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-violet-500/5 border border-white/5" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 w-52 h-52 rounded-full bg-teal-500/5 border border-white/5" />

        <div className="relative px-7 py-8 sm:px-10 sm:py-10">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, delay: 0.1 }}
                className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl shadow-violet-500/40 flex-shrink-0"
              >
                {user?.name.charAt(0).toUpperCase()}
              </motion.div>

              <div>
                <p className="text-white/50 text-sm font-medium tracking-wide">Welcome back,</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  {user?.name.split(' ')[0]}{' '}
                  <span className="bg-gradient-to-r from-violet-300 to-teal-300 bg-clip-text text-transparent">
                    👋
                  </span>
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {user?.role === 'admin'
                    ? 'Manage your question bank or take a practice quiz.'
                    : 'Ready to crush today\u2019s challenge?'}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 flex-wrap">
              {avgScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-sm px-5 py-3 text-center min-w-[76px]"
                >
                  <p className="text-white font-extrabold text-xl leading-none">{avgScore}%</p>
                  <p className="text-white/40 text-[11px] mt-1 uppercase tracking-wider">Avg Score</p>
                </motion.div>
              )}
              {bestScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-sm px-5 py-3 text-center min-w-[76px]"
                >
                  <p className="text-white font-extrabold text-xl leading-none">{bestScore}%</p>
                  <p className="text-white/40 text-[11px] mt-1 uppercase tracking-wider">Best</p>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur-sm px-5 py-3 text-center min-w-[76px]"
              >
                <p className="text-white font-extrabold text-xl leading-none">{recentResults.length}</p>
                <p className="text-white/40 text-[11px] mt-1 uppercase tracking-wider">Quizzes</p>
              </motion.div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() =>
                document.getElementById('quiz-wizard')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/35 hover:-translate-y-0.5 hover:shadow-violet-600/50 transition-all duration-200"
            >
              <Zap size={14} />
              Start a Quiz
            </button>

            {/* AI Quiz — from your latest version */}
            <button
              onClick={() => navigate('/ai-quiz-generator')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:-translate-y-0.5 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-200"
            >
              <Sparkles size={14} />
              AI Quiz
            </button>

            <button
              onClick={() => navigate('/leaderboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] text-white/80 font-semibold text-sm border border-white/[0.12] hover:bg-white/[0.14] hover:text-white transition-all duration-200"
            >
              <Trophy size={14} />
              Leaderboard
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] text-white/80 font-semibold text-sm border border-white/[0.12] hover:bg-white/[0.14] hover:text-white transition-all duration-200"
              >
                <ShieldCheck size={14} />
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Admin banner ──────────────────────────────────────────────────── */}
      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-violet-500/20 bg-violet-500/5"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-md flex-shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[var(--text)] text-sm">You&apos;re an Admin</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Your primary role is to manage quiz questions — add, edit, and organise the question bank.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ShieldCheck size={13} />}
            onClick={() => navigate('/admin')}
          >
            Manage Questions
          </Button>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN GRID: Wizard + Sidebar
      ══════════════════════════════════════════════════════════════════════ */}
      <div id="quiz-wizard" className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* ── LEFT: Wizard ─────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Step progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4"
          >
            <div className="flex items-center">
              {STEPS.map((s, idx) => (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => { if (s.n <= step) setStep(s.n); }}
                    className="flex items-center gap-2.5 group"
                  >
                    <div
                      className={`
                        flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                        text-xs font-bold transition-all duration-300 shadow-sm
                        ${step > s.n
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : step === s.n
                            ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white ring-4 ring-violet-500/20 shadow-violet-500/30'
                            : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
                        }
                      `}
                    >
                      {step > s.n ? <Check size={13} /> : <span>{s.n}</span>}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-xs font-bold leading-none transition-colors
                          ${step === s.n
                            ? 'text-violet-400'
                            : step > s.n
                              ? 'text-emerald-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                      >
                        {s.label}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 transition-colors
                          ${step === s.n ? 'text-violet-400/60' : 'text-[var(--text-muted)]'}`}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2.5 rounded-full transition-all duration-300
                        ${step > s.n
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : 'bg-[var(--border)]'
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Step content */}
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Category ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md shadow-violet-500/30">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                      Choose a Category
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Which programming topic do you want to be tested on?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.035 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`
                        group relative rounded-2xl p-4 sm:p-5 text-left transition-all duration-200
                        flex flex-col min-h-[158px] border
                        ${selectedCategory === cat.id
                          ? 'border-violet-500 bg-violet-500/[0.08] shadow-lg shadow-violet-500/15 ring-1 ring-violet-500/50'
                          : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-violet-400/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10'
                        }
                      `}
                    >
                      {selectedCategory === cat.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shadow-sm"
                        >
                          <Check size={10} className="text-white" />
                        </motion.div>
                      )}
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-200 overflow-hidden flex-shrink-0`}
                      >
                        {cat.image
                          ? <img src={cat.image} alt={cat.label} className="w-7 h-7 object-contain" />
                          : <span className="text-xl">{cat.icon}</span>}
                      </div>
                      <p className="font-extrabold text-[13px] text-[var(--text)] leading-tight">
                        {cat.label}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-3">
                        {cat.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Difficulty ───────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md shadow-violet-500/30">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                      Select Difficulty
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {catMeta ? `${catMeta.label} · ` : ''}How challenging should the questions be?
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {DIFFICULTIES.map((d, i) => (
                    <motion.button
                      key={d.value}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => setSelectedDifficulty(d.value)}
                      className={`
                        relative rounded-2xl p-5 sm:p-6 text-left border transition-all duration-200
                        bg-gradient-to-br
                        ${selectedDifficulty === d.value
                          ? `${d.bg} ${d.ring} ring-1 border-transparent shadow-xl ${d.glow}`
                          : 'from-transparent to-transparent border-[var(--border)] bg-[var(--bg-card)] hover:-translate-y-1 hover:shadow-lg'
                        }
                      `}
                    >
                      {selectedDifficulty === d.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
                        >
                          <Check size={10} className="text-white" />
                        </motion.div>
                      )}
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${d.bg} mb-4 shadow-sm`}
                      >
                        <span className="text-3xl">{d.emoji}</span>
                      </div>
                      <p className={`font-extrabold text-base ${d.color}`}>{d.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                        {d.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Configure ────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md shadow-violet-500/30">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                      Configure Your Quiz
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Adjust question count, timing, and extra options.
                    </p>
                  </div>
                </div>

                <Card padding="md" className="space-y-7">
                  {/* Question count */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                        <Layers size={14} className="text-violet-400" />
                        Number of Questions
                      </p>
                      <span className="text-xs font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg">
                        {questionCount} Qs
                      </span>
                    </div>
                    <div className="flex gap-2.5">
                      {QUESTION_COUNTS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setQuestionCount(n)}
                          className={`
                            flex-1 py-3 rounded-xl text-sm font-extrabold border-2 transition-all duration-200
                            ${questionCount === n
                              ? 'border-violet-500 bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-violet-400/50 hover:text-violet-400'
                            }
                          `}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time per question */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                        <Clock size={14} className="text-violet-400" />
                        Time per Question
                      </p>
                      <span className="text-xs font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg">
                        {timePerQ}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={timePerQ}
                      onChange={(e) => setTimePerQ(Number(e.target.value))}
                      className="w-full h-2 rounded-full accent-violet-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-2">
                      <span>10s — Fast paced</span>
                      <span>120s — Relaxed</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid sm:grid-cols-3 gap-3 pt-5 border-t border-[var(--border)]">
                    <Toggle
                      checked={shuffleQ}
                      onChange={setShuffleQ}
                      label="Shuffle Questions"
                      description="Randomise question order"
                    />
                    <Toggle
                      checked={shuffleOpts}
                      onChange={setShuffleOpts}
                      label="Shuffle Options"
                      description="Randomise answer choices"
                    />
                    <Toggle
                      checked={negativeMarking}
                      onChange={setNegativeMarking}
                      label="Negative Marking"
                      description="-0.25 per wrong answer"
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── STEP 4: Review & Start ───────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                    <Check size={15} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                      Review &amp; Start
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Everything looks good? Hit Start Quiz!
                    </p>
                  </div>
                </div>

                {/* Summary card */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-violet-500 via-teal-400 to-emerald-400" />

                  <div className="p-5 grid sm:grid-cols-2 gap-3">
                    {/* Category */}
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
                      {catMeta && (
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${catMeta.gradient} flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md`}
                        >
                          {catMeta.image
                            ? <img src={catMeta.image} alt={catMeta.label} className="w-7 h-7 object-contain" />
                            : <span className="text-lg">{catMeta.icon}</span>}
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                          Category
                        </p>
                        <p className="font-extrabold text-sm text-[var(--text)] mt-0.5">
                          {catMeta?.label}
                        </p>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
                      <span className="text-3xl">
                        {DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.emoji}
                      </span>
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                          Difficulty
                        </p>
                        <p
                          className={`font-extrabold text-sm mt-0.5 ${
                            DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.color
                          }`}
                        >
                          {selectedDifficulty
                            ? selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
                      <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shadow-sm">
                        <Layers size={18} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                          Questions
                        </p>
                        <p className="font-extrabold text-sm text-[var(--text)] mt-0.5">
                          {questionCount}
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
                      <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center shadow-sm">
                        <Clock size={18} className="text-teal-400" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                          Time / Question
                        </p>
                        <p className="font-extrabold text-sm text-[var(--text)] mt-0.5">
                          {timePerQ}s{' '}
                          <span className="font-normal text-[var(--text-muted)]">
                            · {formatTime(timePerQ * questionCount)} total
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option badges */}
                  <div className="flex flex-wrap gap-2 px-5 pb-5">
                    {shuffleQ && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        <Shuffle size={11} /> Shuffle Questions
                      </span>
                    )}
                    {shuffleOpts && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        <Shuffle size={11} /> Shuffle Options
                      </span>
                    )}
                    {negativeMarking && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                        <Minus size={11} /> Negative Marking (−0.25)
                      </span>
                    )}
                    {!shuffleQ && !shuffleOpts && !negativeMarking && (
                      <span className="text-xs text-[var(--text-muted)]">
                        Standard settings — no shuffle, no negative marking.
                      </span>
                    )}
                  </div>
                </div>

                {/* Start button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="
                      w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl
                      bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600
                      bg-[length:200%_100%] hover:bg-right
                      text-white font-extrabold text-lg tracking-tight
                      shadow-2xl shadow-violet-500/35 hover:shadow-violet-500/50
                      hover:-translate-y-0.5 active:translate-y-0
                      transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isStarting ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Loading Quiz&hellip;
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start {catMeta?.label ?? ''} Quiz
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back / Next navigation */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={back}
              disabled={step === 1}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-sm font-medium hover:text-[var(--text)] hover:bg-[var(--bg-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            {step < 4 && (
              <button
                onClick={advance}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
              >
                {step === 3 ? 'Review' : 'Next'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

          {/* Recent History */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border)]">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <BookOpen size={13} className="text-violet-400" />
                </div>
                <h3 className="font-extrabold text-[var(--text)] text-sm">Recent History</h3>
              </div>

              {recentResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/[0.08] flex items-center justify-center mb-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="font-bold text-[var(--text)] text-sm">No quizzes yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Complete your first quiz to see history here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentResults.map((r) => (
                    <motion.div
                        key={r.id}
                        whileHover={{ x: 3 }}
                        onClick={() => navigate('/result', { state: { result: r } })}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                            {r.config.category.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--text)] capitalize">
                              {r.config.category}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">
                              {r.config.difficulty} · {formatTime(r.timeTaken)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-extrabold ${scoreColor(r.percentage)}`}>
                            {r.percentage}%
                          </span>
                          <ChevronRight
                            size={13}
                            className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          {recentResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp size={13} className="text-amber-400" />
                  </div>
                  <h3 className="font-extrabold text-[var(--text)] text-sm">Quick Stats</h3>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)]">
                  {[
                    {
                      label: 'Quizzes',
                      value: recentResults.length,
                      icon: <BookOpen size={13} />,
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/10',
                    },
                    {
                      label: 'Avg Score',
                      value:
                        Math.round(
                          recentResults.reduce((s, r) => s + r.percentage, 0) /
                            recentResults.length,
                        ) + '%',
                      icon: <Target size={13} />,
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/10',
                    },
                    {
                      label: 'Best Score',
                      value: Math.max(...recentResults.map((r) => r.percentage)) + '%',
                      icon: <Star size={13} />,
                      color: 'text-amber-400',
                      bg: 'bg-amber-500/10',
                    },
                    {
                      label: 'Total Time',
                      value: formatTime(recentResults.reduce((s, r) => s + r.timeTaken, 0)),
                      icon: <Clock size={13} />,
                      color: 'text-violet-400',
                      bg: 'bg-violet-500/10',
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 text-center">
                      <div
                        className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2 ${stat.color}`}
                      >
                        {stat.icon}
                      </div>
                      <p className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5 uppercase tracking-wider">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Pro Tip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-base">💡</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    Pro Tip
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Start with{' '}
                  <strong className="text-[var(--text)] font-semibold">Easy</strong> to build
                  confidence, then progress to{' '}
                  <strong className="text-[var(--text)] font-semibold">Hard</strong> to master each
                  topic. Enable{' '}
                  <strong className="text-[var(--text)] font-semibold">Shuffle</strong> to simulate
                  real exam conditions!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STUDY MODE SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-violet-500/5 via-transparent to-transparent">
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400">
              Study Mode
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--text)] tracking-tight">
              Build consistency, then speed
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              A proven 3-phase daily routine that actually moves the needle.
            </p>
          </div>

          {/* Phases */}
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
            {[
              {
                phase: 'Phase 1',
                time: '5 min',
                title: 'Warm-up',
                desc: 'Take 5 Easy questions to identify weak spots quickly.',
                accent: 'text-blue-400',
                bar: 'from-blue-500 to-cyan-400',
              },
              {
                phase: 'Phase 2',
                time: '15 min',
                title: 'Core Drill',
                desc: 'Run 10\u201315 Medium questions with shuffled options enabled.',
                accent: 'text-emerald-400',
                bar: 'from-emerald-500 to-teal-400',
              },
              {
                phase: 'Phase 3',
                time: '8 min',
                title: 'Pressure Set',
                desc: 'Finish with Hard mode, low time per question.',
                accent: 'text-amber-400',
                bar: 'from-amber-500 to-orange-400',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="relative p-5 sm:p-6 overflow-hidden hover:bg-black/[0.02] dark:hover:bg-white/[0.01] transition-colors"
              >
                <div
                  className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${item.bar}`}
                />
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest ${item.accent} mb-2`}
                >
                  {item.phase} · {item.time}
                </p>
                <p className="font-extrabold text-sm text-[var(--text)] mb-2 tracking-tight">
                  {item.title}
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--text)]">Ready for your next attempt?</p>
            <button
              onClick={() =>
                document.getElementById('quiz-wizard')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-violet-500/20 hover:-translate-y-0.5 hover:shadow-violet-500/35 transition-all duration-200"
            >
              Continue Quiz Setup
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}