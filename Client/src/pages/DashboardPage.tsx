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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuiz } from '@/context/QuizContext';
import { quizService } from '@/services/quizService';
import { CATEGORIES } from '@/data/categories';
import type { Category, Difficulty, QuizConfig, QuizResult } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatTime, getGrade } from '@/utils/helpers';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTIES: { value: Difficulty; label: string; description: string; emoji: string; color: string; bg: string; ring: string }[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Great for beginners. Covers fundamental concepts and basic syntax.',
    emoji: '🟢',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'from-emerald-500/15 to-emerald-400/5',
    ring: 'ring-emerald-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'For intermediate learners. Tests practical understanding and patterns.',
    emoji: '🟡',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'from-amber-500/15 to-amber-400/5',
    ring: 'ring-amber-400',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Advanced challenges. Deep concepts, edge cases, and complex problems.',
    emoji: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bg: 'from-red-500/15 to-red-400/5',
    ring: 'ring-red-400',
  },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const STEPS = [
  { n: 1, label: 'Category',   icon: '📚', desc: 'Pick a topic' },
  { n: 2, label: 'Difficulty', icon: '🎯', desc: 'Set level'    },
  { n: 3, label: 'Configure',  icon: '⚙️', desc: 'Customize'   },
  { n: 4, label: 'Start',      icon: '🚀', desc: 'Launch quiz'  },
];

const FEATURE_CARDS = [
  {
    icon: '📚',
    title: '8 Programming Topics',
    description: 'JavaScript, Python, Java, C++, SQL, React, TypeScript, and DSA — all in one place.',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    iconBg: 'from-blue-500 to-cyan-500',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    icon: '🎯',
    title: 'Adaptive Difficulty',
    description: 'Choose Easy, Medium, or Hard to match your current skill level and grow steadily.',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    iconBg: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    icon: '⏱️',
    title: 'Timed Challenges',
    description: 'Set a custom time limit per question to simulate real exam pressure and improve speed.',
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconBg: 'from-amber-500 to-orange-500',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    icon: '🏆',
    title: 'Global Leaderboard',
    description: 'Compete with other users, track your rank, and see how you stack up globally.',
    gradient: 'from-purple-500/10 to-pink-500/5',
    iconBg: 'from-purple-500 to-pink-500',
    border: 'border-purple-200 dark:border-purple-800',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

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

  // ── Wizard navigation ────────────────────────────────────────────────────────
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

  // ── Start quiz ───────────────────────────────────────────────────────────────
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

      const res = await quizService.getQuestions(selectedCategory, selectedDifficulty, questionCount, shuffleQ);

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

  // ── Quick stats derived from recent results ──────────────────────────────────
  const avgScore = recentResults.length
    ? Math.round(recentResults.reduce((s, r) => s + r.percentage, 0) / recentResults.length)
    : null;
  const bestScore = recentResults.length ? Math.max(...recentResults.map((r) => r.percentage)) : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-16">

      {/* ════════════════════════════════════════════════════════════════════════
          HERO WELCOME BANNER
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.63_0.24_330/0.4)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_oklch(0.57_0.22_265/0.3)_0%,_transparent_60%)]" />

        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 border border-white/10" />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/5 border border-white/10" />

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl flex-shrink-0"
              >
                {user?.name.charAt(0).toUpperCase()}
              </motion.div>

              <div>
                <p className="text-white/70 text-sm font-medium">Welcome back,</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {user?.name.split(' ')[0]} 👋
                </h1>
                <p className="text-white/70 text-sm mt-0.5">
                  {user?.role === 'admin'
                    ? 'Manage your question bank or take a practice quiz.'
                    : 'Ready to challenge yourself today?'}
                </p>
              </div>
            </div>

            {/* Hero quick-stats */}
            <div className="flex gap-3 flex-wrap">
              {avgScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 min-w-[80px] text-center"
                >
                  <p className="text-white font-extrabold text-xl">{avgScore}%</p>
                  <p className="text-white/70 text-xs mt-0.5">Avg Score</p>
                </motion.div>
              )}
              {bestScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 min-w-[80px] text-center"
                >
                  <p className="text-white font-extrabold text-xl">{bestScore}%</p>
                  <p className="text-white/70 text-xs mt-0.5">Best Score</p>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 min-w-[80px] text-center"
              >
                <p className="text-white font-extrabold text-xl">{recentResults.length}</p>
                <p className="text-white/70 text-xs mt-0.5">Quizzes</p>
              </motion.div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById('quiz-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 rounded-xl font-bold text-sm shadow-lg shadow-black/20 hover:bg-primary-50 transition-colors"
            >
              <Zap size={15} />
              Start a Quiz
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-xl font-semibold text-sm border border-white/25 hover:bg-white/25 transition-colors"
            >
              <Trophy size={15} />
              Leaderboard
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white rounded-xl font-semibold text-sm border border-white/25 hover:bg-white/25 transition-colors"
              >
                <ShieldCheck size={15} />
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Admin banner ──────────────────────────────────────────────────────── */}
      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-2xl border border-primary-200 dark:border-primary-800"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md flex-shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[var(--text)]">You're an Admin</p>
            <p className="text-sm text-[var(--text-muted)]">
              Your primary role is to manage quiz questions — add, edit, and organise the question bank.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            onClick={() => navigate('/admin')}
          >
            Manage Questions
          </Button>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN CONTENT GRID: Wizard + Sidebar
      ════════════════════════════════════════════════════════════════════════ */}
      <div id="quiz-wizard" className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT: wizard ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step progress indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-3 sm:p-4"
          >
            <div className="flex items-center">
              {STEPS.map((s, idx) => (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => { if (s.n <= step) setStep(s.n); }}
                    className="flex items-center gap-2 group"
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 shadow-sm
                        ${step > s.n
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : step === s.n
                            ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white ring-4 ring-primary-500/20 shadow-primary-500/30'
                            : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
                        }`}
                    >
                      {step > s.n ? <Check size={13} /> : <span>{s.n}</span>}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold transition-colors leading-none ${step === s.n ? 'text-primary-500' : step > s.n ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                        {s.label}
                      </p>
                      <p className={`text-[10px] transition-colors ${step === s.n ? 'text-primary-400' : 'text-[var(--text-muted)]'}`}>
                        {s.desc}
                      </p>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-300 ${step > s.n ? 'bg-gradient-to-r from-emerald-400 to-emerald-300' : 'bg-[var(--border)]'}`} />
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
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md">1</div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)]">Choose a Category</h2>
                    <p className="text-xs text-[var(--text-muted)]">Which programming topic do you want to be tested on?</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`group relative glass rounded-2xl p-4 text-left transition-all duration-200 flex flex-col
                        ${selectedCategory === cat.id
                          ? 'ring-2 ring-primary-500 bg-gradient-to-br from-primary-50/80 to-primary-100/30 dark:from-primary-900/30 dark:to-primary-800/10 shadow-lg shadow-primary-500/15'
                          : 'hover:ring-1 hover:ring-primary-300 dark:hover:ring-primary-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5'
                        }`}
                    >
                      {selectedCategory === cat.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                        >
                          <Check size={10} className="text-white" />
                        </motion.div>
                      )}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-200 overflow-hidden flex-shrink-0`}>
                        {cat.image
                          ? <img src={cat.image} alt={cat.label} className="w-8 h-8 object-contain" />
                          : <span className="text-xl">{cat.icon}</span>}
                      </div>
                      <p className="font-extrabold text-sm text-[var(--text)]">{cat.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">{cat.description}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Difficulty ───────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md">2</div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)]">Select Difficulty</h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {catMeta ? `${catMeta.label} · ` : ''}How challenging should the questions be?
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {DIFFICULTIES.map((d, i) => (
                    <motion.button
                      key={d.value}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => setSelectedDifficulty(d.value)}
                      className={`relative glass rounded-2xl p-5 sm:p-6 text-left transition-all duration-200
                        ${selectedDifficulty === d.value
                          ? `ring-2 ${d.ring} bg-gradient-to-br ${d.bg} shadow-lg`
                          : 'hover:ring-1 hover:ring-[var(--border)] hover:-translate-y-1 hover:shadow-lg'
                        }`}
                    >
                      {selectedDifficulty === d.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                        >
                          <Check size={10} className="text-white" />
                        </motion.div>
                      )}
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${d.bg} mb-4 shadow-sm`}>
                        <span className="text-3xl">{d.emoji}</span>
                      </div>
                      <p className={`font-extrabold text-base ${d.color}`}>{d.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">{d.description}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Configure ────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md">3</div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)]">Configure Your Quiz</h2>
                    <p className="text-xs text-[var(--text-muted)]">Adjust question count, timing, and options.</p>
                  </div>
                </div>

                <Card padding="md" className="space-y-6">
                  {/* Question count */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                        <Layers size={14} className="text-primary-500" />
                        Number of Questions
                      </p>
                      <span className="text-sm font-extrabold text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 rounded-lg">{questionCount} Qs</span>
                    </div>
                    <div className="flex gap-2">
                      {QUESTION_COUNTS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setQuestionCount(n)}
                          className={`flex-1 py-3 rounded-xl text-sm font-extrabold border-2 transition-all duration-200
                            ${questionCount === n
                              ? 'border-primary-500 bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-400 hover:text-primary-500'
                            }`}
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
                        <Clock size={14} className="text-primary-500" />
                        Time per Question
                      </p>
                      <span className="text-sm font-extrabold text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 rounded-lg">{timePerQ}s</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={timePerQ}
                      onChange={(e) => setTimePerQ(Number(e.target.value))}
                      className="w-full h-2.5 rounded-full accent-primary-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                      <span>10s — Fast</span>
                      <span>120s — Relaxed</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
                    <Toggle checked={shuffleQ}        onChange={setShuffleQ}        label="Shuffle Questions" description="Randomise question order" />
                    <Toggle checked={shuffleOpts}     onChange={setShuffleOpts}     label="Shuffle Options"   description="Randomise answer choices" />
                    <Toggle checked={negativeMarking} onChange={setNegativeMarking} label="Negative Marking"  description="-0.25 per wrong answer" />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── STEP 4: Review & Start ───────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                    <Check size={15} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[var(--text)]">Review &amp; Start</h2>
                    <p className="text-xs text-[var(--text-muted)]">Everything looks good? Hit Start Quiz!</p>
                  </div>
                </div>

                {/* Summary card */}
                <Card glass padding="none" className="overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent-500 to-emerald-500" />
                  <div className="p-5 grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3.5 bg-black/3 dark:bg-white/3 rounded-2xl">
                      {catMeta && (
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${catMeta.gradient} flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md`}>
                          {catMeta.image
                            ? <img src={catMeta.image} alt={catMeta.label} className="w-7 h-7 object-contain" />
                            : <span className="text-lg">{catMeta.icon}</span>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-[var(--text-muted)] font-medium">Category</p>
                        <p className="font-extrabold text-[var(--text)]">{catMeta?.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 bg-black/3 dark:bg-white/3 rounded-2xl">
                      <span className="text-3xl">{DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.emoji}</span>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] font-medium">Difficulty</p>
                        <p className={`font-extrabold ${DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.color}`}>
                          {selectedDifficulty ? selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 bg-black/3 dark:bg-white/3 rounded-2xl">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shadow-sm">
                        <Layers size={18} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] font-medium">Questions</p>
                        <p className="font-extrabold text-[var(--text)]">{questionCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 bg-black/3 dark:bg-white/3 rounded-2xl">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shadow-sm">
                        <Clock size={18} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] font-medium">Time / Question</p>
                        <p className="font-extrabold text-[var(--text)]">{timePerQ}s · {formatTime(timePerQ * questionCount)} total</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 px-5 pb-5">
                    {shuffleQ && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-semibold">
                        <Shuffle size={11} /> Shuffle Questions
                      </span>
                    )}
                    {shuffleOpts && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-semibold">
                        <Shuffle size={11} /> Shuffle Options
                      </span>
                    )}
                    {negativeMarking && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-semibold">
                        <Minus size={11} /> Negative Marking (−0.25)
                      </span>
                    )}
                    {!shuffleQ && !shuffleOpts && !negativeMarking && (
                      <span className="text-xs text-[var(--text-muted)]">Standard settings — no shuffle, no negative marking.</span>
                    )}
                  </div>
                </Card>

                {/* Start button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    fullWidth
                    size="xl"
                    onClick={handleStart}
                    loading={isStarting}
                    leftIcon={<Play size={20} />}
                    className="shadow-2xl shadow-primary-500/30 !rounded-2xl"
                  >
                    {isStarting ? 'Loading Quiz…' : `Start ${catMeta?.label ?? ''} Quiz`}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Back / Next navigation ───────────────────────────────────── */}
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" leftIcon={<ChevronLeft size={16} />} onClick={back} disabled={step === 1}>
              Back
            </Button>
            {step < 4 && (
              <Button variant="primary" rightIcon={<ChevronRight size={16} />} onClick={advance} disabled={!canAdvance()}>
                {step === 3 ? 'Review' : 'Next'}
              </Button>
            )}
          </div>
        </div>

        {/* ── RIGHT: history + tips ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Recent History */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border)]">
                <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <BookOpen size={14} className="text-primary-500" />
                </div>
                <h3 className="font-extrabold text-[var(--text)] text-sm">Recent History</h3>
              </div>

              {recentResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="font-bold text-[var(--text)] text-sm">No quizzes yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Complete your first quiz to see history here.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentResults.map((r) => {
                    const grade = getGrade(r.percentage);
                    return (
                      <motion.div
                        key={r.id}
                        whileHover={{ x: 3 }}
                        onClick={() => navigate('/result', { state: { result: r } })}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                            {r.config.category.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--text)] capitalize">{r.config.category}</p>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{r.config.difficulty} · {formatTime(r.timeTaken)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-extrabold ${grade.color}`}>{r.percentage}%</span>
                          <ChevronRight size={13} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Quick Stats */}
          {recentResults.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card padding="none" className="overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border)]">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <TrendingUp size={14} className="text-amber-500" />
                  </div>
                  <h3 className="font-extrabold text-[var(--text)] text-sm">Quick Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
                  {[
                    { label: 'Quizzes',    value: recentResults.length,                                                                                    icon: <BookOpen size={14} />, color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20'       },
                    { label: 'Avg Score',  value: Math.round(recentResults.reduce((s, r) => s + r.percentage, 0) / recentResults.length) + '%',             icon: <Target size={14} />,   color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20'    },
                    { label: 'Best Score', value: Math.max(...recentResults.map((r) => r.percentage)) + '%',                                               icon: <Star size={14} />,     color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20'         },
                    { label: 'Total Time', value: formatTime(recentResults.reduce((s, r) => s + r.timeTaken, 0)),                                          icon: <Clock size={14} />,    color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20'     },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[var(--bg-card)] p-4 text-center">
                      <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <p className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Pro Tip */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card padding="none" className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <Badge variant="primary" dot>Pro Tip</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Start with <strong className="text-[var(--text)]">Easy</strong> to build confidence, then progress to <strong className="text-[var(--text)]">Hard</strong> to master each topic. Enable <strong className="text-[var(--text)]">Shuffle</strong> to simulate real exam conditions!
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ABOUT / FEATURES SECTION
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-4 space-y-8"
      >
        {/* Section header */}
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 text-xs font-bold mb-4">
            ✨ About This Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
            What is{' '}
            <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              QuizMaster Pro
            </span>
            ?
          </h2>
          <p className="text-[var(--text-muted)] mt-3 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            An interactive quiz platform designed to help students and developers sharpen their programming skills through practice exams, instant feedback, and progress tracking.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_CARDS.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              className={`glass rounded-2xl p-5 border ${feature.border} bg-gradient-to-br ${feature.gradient} hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="font-extrabold text-[var(--text)] mb-1.5 text-sm">{feature.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <div className="glass rounded-3xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 sm:px-8 pt-7">
            <div className="text-center mb-8">
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text)]">How It Works</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Four simple steps to start sharpening your skills</p>
            </div>
            <div className="grid sm:grid-cols-4 gap-6 pb-8">
              {[
                { step: '1', icon: '📂', title: 'Pick a Category', desc: "Choose from 8 programming topics that match what you're studying." },
                { step: '2', icon: '🎚️', title: 'Set Difficulty',  desc: 'Select Easy, Medium, or Hard to get questions suited to your level.' },
                { step: '3', icon: '⚙️', title: 'Configure Quiz',  desc: 'Adjust question count, timer, shuffle, and negative marking options.' },
                { step: '4', icon: '✅', title: 'Review Results',  desc: 'See your score, correct answers, explanations, and detailed feedback.' },
              ].map((item, i, arr) => (
                <div key={item.step} className="flex flex-col items-center text-center relative">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-primary-500/25 mb-3"
                  >
                    {item.step}
                  </motion.div>
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <p className="font-extrabold text-[var(--text)] text-sm mb-1.5">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                  {i < arr.length - 1 && (
                    <div className="hidden sm:flex absolute top-7 left-[calc(100%-4px)] w-8 items-center justify-center">
                      <ArrowRight size={14} className="text-primary-300 dark:text-primary-700" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA strip */}
          <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-t border-[var(--border)] px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text)]">Ready to test your knowledge? Let's go! 🚀</p>
            <button
              onClick={() => document.getElementById('quiz-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-500/25 hover:opacity-90 transition-opacity"
            >
              Start Quiz <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
