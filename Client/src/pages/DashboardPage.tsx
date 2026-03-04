import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Clock,
  BarChart3,
  BookOpen,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Check,
  ShieldCheck,
  Layers,
  Shuffle,
  Minus,
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

const DIFFICULTIES: { value: Difficulty; label: string; description: string; emoji: string; color: string; bg: string }[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Great for beginners. Covers fundamental concepts and basic syntax.',
    emoji: '🟢',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'from-emerald-500/10 to-emerald-400/5',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'For intermediate learners. Tests practical understanding and patterns.',
    emoji: '🟡',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'from-amber-500/10 to-amber-400/5',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Advanced challenges. Deep concepts, edge cases, and complex problems.',
    emoji: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bg: 'from-red-500/10 to-red-400/5',
  },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const STEPS = [
  { n: 1, label: 'Category',   icon: '📚' },
  { n: 2, label: 'Difficulty', icon: '🎯' },
  { n: 3, label: 'Configure',  icon: '⚙️' },
  { n: 4, label: 'Start',      icon: '🚀' },
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)]">
            Hey, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            {user?.role === 'admin'
              ? 'Manage your question bank or take a practice quiz.'
              : 'Follow the steps below to start your quiz.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BarChart3 size={15} />}
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Settings2 size={15} />}
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Admin banner ────────────────────────────────────────────────────── */}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT: wizard ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step progress indicator */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-1">
              {STEPS.map((s, idx) => (
                <div key={s.n} className="flex items-center gap-1 flex-1 last:flex-none">
                  {/* Step circle */}
                  <button
                    onClick={() => {
                      // Allow jumping back but not ahead past where we've been
                      if (s.n <= step) setStep(s.n);
                    }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${step > s.n
                        ? 'bg-emerald-500 text-white'
                        : step === s.n
                          ? 'bg-primary-500 text-white ring-4 ring-primary-500/20'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
                      }`}
                  >
                    {step > s.n ? <Check size={13} /> : s.n}
                  </button>
                  {/* Label (hidden on very small screens) */}
                  <span className={`hidden sm:block text-xs font-medium transition-colors ${step === s.n ? 'text-primary-500' : step > s.n ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                    {s.label}
                  </span>
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${step > s.n ? 'bg-emerald-400' : 'bg-[var(--border)]'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Category ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Step 1 — Choose a Category</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">Which topic do you want to be tested on?</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`group glass rounded-2xl p-4 text-left transition-all duration-200 flex flex-col
                        ${selectedCategory === cat.id
                          ? 'ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                          : 'hover:ring-1 hover:ring-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg'
                        }`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform overflow-hidden flex-shrink-0`}>
                        {cat.image
                          ? <img src={cat.image} alt={cat.label} className="w-8 h-8 object-contain" />
                          : <span className="text-xl">{cat.icon}</span>}
                      </div>
                      <p className="font-bold text-sm text-[var(--text)]">{cat.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{cat.description}</p>
                      {selectedCategory === cat.id && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary-500 font-semibold">
                          <Check size={11} /> Selected
                        </div>
                      )}
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
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Step 2 — Select Difficulty</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {catMeta ? `${catMeta.label} · ` : ''}How challenging should the questions be?
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {DIFFICULTIES.map((d, i) => (
                    <motion.button
                      key={d.value}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => setSelectedDifficulty(d.value)}
                      className={`glass rounded-2xl p-5 text-left transition-all duration-200
                        ${selectedDifficulty === d.value
                          ? 'ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                          : 'hover:ring-1 hover:ring-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg'
                        }`}
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${d.bg} mb-3`}>
                        <span className="text-2xl">{d.emoji}</span>
                      </div>
                      <p className={`font-bold text-base ${d.color}`}>{d.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{d.description}</p>
                      {selectedDifficulty === d.value && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary-500 font-semibold">
                          <Check size={11} /> Selected
                        </div>
                      )}
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
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Step 3 — Configure Quiz</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">Adjust question count, timing, and options.</p>
                </div>

                <Card padding="md" className="space-y-6">
                  {/* Question count */}
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                      <Layers size={14} className="text-primary-500" />
                      Number of Questions
                      <span className="ml-auto text-primary-500 font-bold">{questionCount}</span>
                    </p>
                    <div className="flex gap-2">
                      {QUESTION_COUNTS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setQuestionCount(n)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                            ${questionCount === n
                              ? 'border-primary-500 bg-primary-500 text-white shadow-md shadow-primary-500/20'
                              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-400'
                            }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time per question */}
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                      <Clock size={14} className="text-primary-500" />
                      Time per Question
                      <span className="ml-auto text-primary-500 font-bold">{timePerQ}s</span>
                    </p>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={timePerQ}
                      onChange={(e) => setTimePerQ(Number(e.target.value))}
                      className="w-full h-2 rounded-full accent-primary-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                      <span>10s (fast)</span><span>120s (relaxed)</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-1 border-t border-[var(--border)]">
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
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Step 4 — Review &amp; Start</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">Everything looks good? Hit Start Quiz!</p>
                </div>

                {/* Summary card */}
                <Card glass padding="md">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="flex items-center gap-3 p-3 bg-black/3 dark:bg-white/3 rounded-xl">
                      {catMeta && (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catMeta.gradient} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                          {catMeta.image
                            ? <img src={catMeta.image} alt={catMeta.label} className="w-7 h-7 object-contain" />
                            : <span className="text-lg">{catMeta.icon}</span>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Category</p>
                        <p className="font-bold text-[var(--text)]">{catMeta?.label}</p>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="flex items-center gap-3 p-3 bg-black/3 dark:bg-white/3 rounded-xl">
                      <span className="text-2xl">{DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.emoji}</span>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Difficulty</p>
                        <p className={`font-bold ${DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.color}`}>
                          {selectedDifficulty ? selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="flex items-center gap-3 p-3 bg-black/3 dark:bg-white/3 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                        <Layers size={18} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Questions</p>
                        <p className="font-bold text-[var(--text)]">{questionCount}</p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-3 p-3 bg-black/3 dark:bg-white/3 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                        <Clock size={18} className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Time / Question</p>
                        <p className="font-bold text-[var(--text)]">{timePerQ}s · {formatTime(timePerQ * questionCount)} total</p>
                      </div>
                    </div>
                  </div>

                  {/* Toggles summary */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                    {shuffleQ && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-medium">
                        <Shuffle size={11} /> Shuffle Questions
                      </span>
                    )}
                    {shuffleOpts && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-medium">
                        <Shuffle size={11} /> Shuffle Options
                      </span>
                    )}
                    {negativeMarking && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-medium">
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
                    className="shadow-xl shadow-primary-500/30"
                  >
                    {isStarting ? 'Loading Quiz…' : `Start ${catMeta?.label ?? ''} Quiz`}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Back / Next navigation ───────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              leftIcon={<ChevronLeft size={16} />}
              onClick={back}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 4 ? (
              <Button
                variant="primary"
                rightIcon={<ChevronRight size={16} />}
                onClick={advance}
                disabled={!canAdvance()}
              >
                {step === 3 ? 'Review' : 'Next'}
              </Button>
            ) : null}
          </div>
        </div>

        {/* ── RIGHT: history + tips ─────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-primary-500" />
              <h3 className="font-bold text-[var(--text)]">Recent History</h3>
            </div>

            {recentResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm text-[var(--text-muted)]">No quizzes yet. Start your first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentResults.map((r) => {
                  const grade = getGrade(r.percentage);
                  return (
                    <motion.div
                      key={r.id}
                      whileHover={{ x: 3 }}
                      onClick={() => navigate('/result', { state: { result: r } })}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-black/3 dark:hover:bg-white/3 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                          {r.config.category.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text)] capitalize">{r.config.category}</p>
                          <p className="text-xs text-[var(--text-muted)] capitalize">{r.config.difficulty} · {formatTime(r.timeTaken)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${grade.color}`}>{r.percentage}%</span>
                        <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>

          {recentResults.length > 0 && (
            <Card padding="md">
              <h3 className="font-bold text-[var(--text)] mb-3 text-sm">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Quizzes', value: recentResults.length, icon: '📚' },
                  { label: 'Avg Score', value: Math.round(recentResults.reduce((s, r) => s + r.percentage, 0) / recentResults.length) + '%', icon: '🎯' },
                  { label: 'Best Score', value: Math.max(...recentResults.map((r) => r.percentage)) + '%', icon: '🏆' },
                  { label: 'Total Time', value: formatTime(recentResults.reduce((s, r) => s + r.timeTaken, 0)), icon: '⏱️' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-center">
                    <p className="text-lg">{stat.icon}</p>
                    <p className="text-base font-extrabold text-primary-600 dark:text-primary-300">{stat.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card padding="md">
            <h3 className="font-bold text-[var(--text)] mb-2 text-sm flex items-center gap-1.5">
              <Badge variant="primary" dot>Pro Tip</Badge>
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Start with <strong>Easy</strong> to build confidence, then progress to <strong>Hard</strong> to master each topic. Enable <strong>Shuffle</strong> to simulate real exam conditions!
            </p>
          </Card>
        </div>
      </div>

      {/* ── About Section ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        {/* Section header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 text-xs font-semibold mb-3">
            About This Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
            What is QuizMaster Pro?
          </h2>
          <p className="text-[var(--text-muted)] mt-2 max-w-2xl mx-auto text-sm sm:text-base">
            An interactive quiz platform designed to help students and developers sharpen their programming skills through practice exams, instant feedback, and progress tracking.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: '📚',
              title: '8 Categories',
              description: 'JavaScript, Python, Java, C++, SQL, React, TypeScript, and DSA — all in one place.',
              gradient: 'from-blue-500/10 to-cyan-500/5',
              border: 'border-blue-200 dark:border-blue-800',
            },
            {
              icon: '🎯',
              title: 'Adaptive Difficulty',
              description: 'Choose Easy, Medium, or Hard to match your current skill level and grow steadily.',
              gradient: 'from-emerald-500/10 to-teal-500/5',
              border: 'border-emerald-200 dark:border-emerald-800',
            },
            {
              icon: '⏱️',
              title: 'Timed Exams',
              description: 'Set a custom time limit per question to simulate real exam pressure and improve speed.',
              gradient: 'from-amber-500/10 to-orange-500/5',
              border: 'border-amber-200 dark:border-amber-800',
            },
            {
              icon: '🏆',
              title: 'Leaderboard',
              description: 'Compete with other users, track your rank, and see how you stack up globally.',
              gradient: 'from-purple-500/10 to-pink-500/5',
              border: 'border-purple-200 dark:border-purple-800',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`glass rounded-2xl p-5 border ${feature.border} bg-gradient-to-br ${feature.gradient}`}
            >
              <span className="text-3xl mb-3 block">{feature.icon}</span>
              <h3 className="font-bold text-[var(--text)] mb-1">{feature.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--text)] mb-6 text-center">How It Works</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: '1', icon: '📂', title: 'Pick a Category', desc: 'Choose from 8 programming topics that match what you\'re studying.' },
              { step: '2', icon: '🎚️', title: 'Set Difficulty', desc: 'Select Easy, Medium, or Hard to get questions suited to your level.' },
              { step: '3', icon: '⚙️', title: 'Configure Quiz', desc: 'Adjust question count, timer, shuffle, and negative marking options.' },
              { step: '4', icon: '✅', title: 'Review Results', desc: 'See your score, correct answers, explanations, and detailed feedback.' },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex flex-col items-center text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-primary-500/20 mb-3">
                  {item.step}
                </div>
                <span className="text-2xl mb-2">{item.icon}</span>
                <p className="font-semibold text-[var(--text)] text-sm mb-1">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(100%-8px)] w-4 h-0.5 bg-gradient-to-r from-primary-300 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
