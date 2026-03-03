import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, BarChart3, BookOpen, Settings2, ChevronRight } from 'lucide-react';
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

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: '🟢 Easy', color: 'bg-emerald-400' },
  { value: 'medium', label: '🟡 Medium', color: 'bg-yellow-400' },
  { value: 'hard', label: '🔴 Hard', color: 'bg-red-400' },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { startQuiz } = useQuiz();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
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

  const handleStart = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category first');
      return;
    }
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

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)]">
            Hey, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Ready to challenge yourself? Pick a quiz below.
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: config panel ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category selection */}
          <section aria-labelledby="category-heading">
            <h2 id="category-heading" className="text-lg font-bold text-[var(--text)] mb-3">
              1. Choose a Category
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  variants={itemVariants}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`group glass rounded-2xl p-4 text-left transition-all duration-200
                    ${selectedCategory === cat.id
                      ? 'ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'hover:ring-1 hover:ring-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg'
                    }`}
                  aria-pressed={selectedCategory === cat.id}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform overflow-hidden`}>
                    {cat.image
                      ? <img src={cat.image} alt={cat.label} className="w-8 h-8 object-contain" />
                      : <span className="text-xl">{cat.icon}</span>}
                  </div>
                  <p className="font-bold text-sm text-[var(--text)]">{cat.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{cat.description}</p>
                </motion.button>
              ))}
            </motion.div>
          </section>

          {/* Difficulty */}
          <section aria-labelledby="difficulty-heading">
            <h2 id="difficulty-heading" className="text-lg font-bold text-[var(--text)] mb-3">
              2. Select Difficulty
            </h2>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDifficulty(d.value)}
                  aria-pressed={selectedDifficulty === d.value}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200
                    ${selectedDifficulty === d.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300'
                    }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>

          {/* Question count + Time */}
          <section aria-labelledby="config-heading">
            <h2 id="config-heading" className="text-lg font-bold text-[var(--text)] mb-3">
              3. Configure Quiz
            </h2>
            <Card padding="md" className="space-y-5">
              <div>
                <p className="text-sm font-medium text-[var(--text)] mb-2">
                  Number of Questions: <span className="text-primary-500">{questionCount}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      aria-pressed={questionCount === n}
                      className={`w-12 h-10 rounded-xl text-sm font-bold border-2 transition-all
                        ${questionCount === n
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-400'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-1.5">
                  <Clock size={14} /> Time per Question: <span className="text-primary-500">{timePerQ}s</span>
                </p>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={timePerQ}
                  onChange={(e) => setTimePerQ(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-primary-500 cursor-pointer"
                  aria-label="Time per question in seconds"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                  <span>10s</span><span>120s</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-1">
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
          </section>

          {/* Start button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              fullWidth
              size="xl"
              onClick={handleStart}
              loading={isStarting}
              disabled={!selectedCategory}
              leftIcon={<Play size={20} />}
              className="shadow-xl shadow-primary-500/30"
            >
              {isStarting ? 'Loading Quiz…' : selectedCategory ? `Start ${selectedCategory.toUpperCase()} Quiz` : 'Select a Category to Start'}
            </Button>
          </motion.div>
        </div>

        {/* ── Right: history + stats ── */}
        <div className="space-y-5">
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-primary-500" />
              <h3 className="font-bold text-[var(--text)]">Recent History</h3>
            </div>

            {recentResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm text-[var(--text-muted)]">
                  No quizzes taken yet. Start your first quiz!
                </p>
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
                          <p className="text-xs font-semibold text-[var(--text)] capitalize">
                            {r.config.category}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] capitalize">
                            {r.config.difficulty} · {formatTime(r.timeTaken)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${grade.color}`}>
                          {r.percentage}%
                        </span>
                        <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick stats */}
          {recentResults.length > 0 && (
            <Card padding="md">
              <h3 className="font-bold text-[var(--text)] mb-3 text-sm">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Quizzes',
                    value: recentResults.length,
                    icon: '📚',
                  },
                  {
                    label: 'Avg Score',
                    value:
                      Math.round(
                        recentResults.reduce((s, r) => s + r.percentage, 0) / recentResults.length,
                      ) + '%',
                    icon: '🎯',
                  },
                  {
                    label: 'Best Score',
                    value: Math.max(...recentResults.map((r) => r.percentage)) + '%',
                    icon: '🏆',
                  },
                  {
                    label: 'Total Time',
                    value: formatTime(recentResults.reduce((s, r) => s + r.timeTaken, 0)),
                    icon: '⏱️',
                  },
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

          {/* Category progress hint */}
          <Card padding="md">
            <h3 className="font-bold text-[var(--text)] mb-3 text-sm flex items-center gap-1.5">
              <Badge variant="primary" dot>Pro Tip</Badge>
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Start with <strong>Easy</strong> to build confidence, then progress through <strong>Medium</strong> and <strong>Hard</strong> to master each topic. Enable <strong>Shuffle</strong> to simulate real exam conditions!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
