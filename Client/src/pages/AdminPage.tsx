import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  BookOpen,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type { Category, Difficulty, Question } from '@/types';
import { quizService } from '@/services/quizService';
import { questionSchema, type QuestionFormValues } from '@/utils/validators';
import { CATEGORIES } from '@/data/categories';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_CATEGORY_OPTIONS = [
  { value: 'javascript', label: '⚡ JavaScript' },
  { value: 'python', label: '🐍 Python' },
  { value: 'java', label: '☕ Java' },
  { value: 'cpp', label: '⚙️ C++' },
  { value: 'sql', label: '🗄️ SQL' },
  { value: 'react', label: '⚛️ React' },
  { value: 'typescript', label: '📘 TypeScript' },
  { value: 'dsa', label: '🧩 DSA' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '🟢 Easy' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'hard', label: '🔴 Hard' },
];

const CORRECT_OPTIONS = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
  { value: 'd', label: 'Option D' },
];

const DIFF_META: Record<Difficulty, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  icon: <CheckCircle2 size={13} /> },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',      icon: <AlertCircle size={13} /> },
  hard:   { label: 'Hard',   color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20',          icon: <HelpCircle size={13} /> },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  useDocumentTitle('Admin Panel');
  const { user } = useAuth();

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    new Set(['javascript'] as Category[]),
  );
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionFormValues, unknown, QuestionFormValues>({
    resolver: zodResolver(questionSchema) as never,
    defaultValues: { points: 1 },
  });

  // ── Admin guard ──────────────────────────────────────────────────────────────
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldCheck size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text)]">Access Denied</h2>
        <p className="text-[var(--text-muted)] text-sm">Admin privileges required.</p>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  const fetchQuestions = async () => {
    setLoading(true);
    const res = await quizService.getAllQuestionsAdmin();
    setAllQuestions(res.data);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { fetchQuestions(); }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toggleCategory = (id: Category) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visibleQs = (cat: Category) => {
    const term = search.toLowerCase();
    return allQuestions.filter(
      (q) =>
        q.category === cat &&
        (diffFilter === 'all' || q.difficulty === diffFilter) &&
        (q.text.toLowerCase().includes(term) ||
          q.options.some((o) => o.text.toLowerCase().includes(term))),
    );
  };

  const totalStats = {
    total: allQuestions.length,
    easy: allQuestions.filter((q) => q.difficulty === 'easy').length,
    medium: allQuestions.filter((q) => q.difficulty === 'medium').length,
    hard: allQuestions.filter((q) => q.difficulty === 'hard').length,
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const openCreate = (cat?: Category) => {
    reset({ points: 1, ...(cat ? { category: cat } : {}) });
    setEditQuestion(null);
    setShowForm(true);
  };

  const openEdit = (q: Question) => {
    setEditQuestion(q);
    reset({
      category: q.category,
      difficulty: q.difficulty,
      text: q.text,
      optionA: q.options[0]?.text ?? '',
      optionB: q.options[1]?.text ?? '',
      optionC: q.options[2]?.text ?? '',
      optionD: q.options[3]?.text ?? '',
      correctOption: q.correctOptionId as 'a' | 'b' | 'c' | 'd',
      explanation: q.explanation,
      points: q.points,
      tags: q.tags?.join(', ') ?? '',
    });
    setShowForm(true);
  };

  const onSubmit = async (data: QuestionFormValues) => {
    setIsSaving(true);
    try {
      const payload = {
        category: data.category,
        difficulty: data.difficulty,
        text: data.text,
        options: [
          { id: 'a', text: data.optionA },
          { id: 'b', text: data.optionB },
          { id: 'c', text: data.optionC },
          { id: 'd', text: data.optionD },
        ],
        correctOptionId: data.correctOption,
        explanation: data.explanation,
        points: data.points,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (editQuestion) {
        await quizService.updateQuestion(editQuestion.id, payload);
        toast.success('Question updated!');
      } else {
        await quizService.createQuestion(payload);
        toast.success('Question added!');
      }
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await quizService.deleteQuestion(deleteTarget.id);
      toast.success('Question deleted');
      setDeleteTarget(null);
      fetchQuestions();
    } catch {
      toast.error('Built-in questions cannot be deleted');
      setDeleteTarget(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ShieldCheck className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">Admin Panel</h1>
            <p className="text-xs text-[var(--text-muted)]">Manage all quiz questions across categories</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openCreate()}>
          Add Question
        </Button>
      </motion.div>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Questions', value: totalStats.total, color: 'text-primary-600 dark:text-primary-400', bg: 'from-primary-500/10 to-primary-500/5', icon: <Layers size={16} /> },
          { label: 'Easy',   value: totalStats.easy,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5', icon: <CheckCircle2 size={16} /> },
          { label: 'Medium', value: totalStats.medium, color: 'text-amber-600 dark:text-amber-400',    bg: 'from-amber-500/10 to-amber-500/5',    icon: <AlertCircle size={16} /> },
          { label: 'Hard',   value: totalStats.hard,   color: 'text-red-600 dark:text-red-400',        bg: 'from-red-500/10 to-red-500/5',        icon: <HelpCircle size={16} /> },
        ].map((s) => (
          <Card key={s.label} glass padding="sm">
            <div className={`bg-gradient-to-br ${s.bg} rounded-xl p-3`}>
              <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-semibold">{s.label}</span></div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Search + difficulty filter ───────────────────────────────────────── */}
      <div className="glass rounded-2xl p-3 sm:p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search questions or options…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all capitalize
                ${diffFilter === d
                  ? 'border-primary-500 bg-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300'
                }`}
            >
              {d === 'all' ? '🔍 All' : d === 'easy' ? '🟢 Easy' : d === 'medium' ? '🟡 Medium' : '🔴 Hard'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Per-category accordion sections ─────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} glass padding="md">
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const allCatQ = allQuestions.filter((q) => q.category === cat.id);
            const catQuestions = visibleQs(cat.id);
            const isOpen = expandedCategories.has(cat.id);

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl overflow-hidden border border-[var(--border)]"
              >
                {/* ── Category accordion header ── */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-black/3 dark:hover:bg-white/3 transition-colors"
                >
                  {/* Logo */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden`}>
                    {cat.image
                      ? <img src={cat.image} alt={cat.label} className="w-7 h-7 object-contain" />
                      : <span className="text-lg">{cat.icon}</span>}
                  </div>

                  {/* Title + count */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--text)]">{cat.label}</span>
                      <span className="text-xs text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        {allCatQ.length} question{allCatQ.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{cat.description}</p>
                  </div>

                  {/* Difficulty pill counts (desktop) */}
                  <div className="hidden sm:flex gap-1.5 flex-shrink-0">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                      const count = allCatQ.filter((q) => q.difficulty === d).length;
                      const m = DIFF_META[d];
                      return (
                        <span key={d} className={`${m.bg} ${m.color} text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1`}>
                          {m.icon}{count}
                        </span>
                      );
                    })}
                  </div>

                  {/* Quick-add button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openCreate(cat.id); }}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors shadow-md shadow-primary-500/20"
                    title={`Add ${cat.label} question`}
                  >
                    <Plus size={14} />
                  </button>

                  {/* Chevron */}
                  <div className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <ChevronRight size={18} className="text-[var(--text-muted)]" />
                  </div>
                </button>

                {/* ── Question list ── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="border-t border-[var(--border)] overflow-hidden"
                    >
                      {catQuestions.length === 0 ? (
                        <div className="py-10 text-center">
                          <BookOpen size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
                          <p className="text-sm text-[var(--text-muted)]">No questions match your filters.</p>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus size={14} />}
                            className="mt-3"
                            onClick={() => openCreate(cat.id)}
                          >
                            Add first {cat.label} question
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 space-y-4">
                          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                            const qs = catQuestions.filter((q) => q.difficulty === diff);
                            if (qs.length === 0) return null;
                            const m = DIFF_META[diff];
                            return (
                              <div key={diff}>
                                {/* Difficulty sub-header */}
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <div className={`flex items-center gap-1.5 ${m.color} font-semibold text-xs`}>
                                    {m.icon}<span>{m.label}</span>
                                  </div>
                                  <div className="flex-1 h-px bg-[var(--border)]" />
                                  <span className={`text-xs ${m.color}`}>{qs.length} Q{qs.length !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Question cards */}
                                <div className="space-y-2">
                                  {qs.map((q, idx) => (
                                    <motion.div
                                      key={q.id}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.03 }}
                                      className="flex gap-3 items-start bg-white/40 dark:bg-black/20 rounded-xl p-3 border border-[var(--border)] hover:border-primary-300 transition-all group"
                                    >
                                      {/* Number badge */}
                                      <div className={`w-6 h-6 rounded-lg ${m.bg} ${m.color} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                                        {idx + 1}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--text)] mb-1.5 line-clamp-2">
                                          {q.text}
                                        </p>

                                        {/* All 4 options */}
                                        <div className="grid grid-cols-2 gap-1 mb-2">
                                          {q.options.map((opt) => (
                                            <div
                                              key={opt.id}
                                              className={`text-xs px-2 py-1 rounded-lg truncate ${
                                                opt.id === q.correctOptionId
                                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                                                  : 'bg-black/3 dark:bg-white/5 text-[var(--text-muted)]'
                                              }`}
                                            >
                                              <span className="font-bold uppercase mr-1">{opt.id}.</span>{opt.text}
                                            </div>
                                          ))}
                                        </div>

                                        {/* Points + tags */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge variant="default" className="text-xs">{q.points} pt{q.points !== 1 ? 's' : ''}</Badge>
                                          {q.tags?.slice(0, 2).map((t) => (
                                            <span key={t} className="text-xs text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                                              #{t}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Action buttons (appear on hover) */}
                                      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => openEdit(q)}
                                          className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 hover:bg-primary-100 flex items-center justify-center transition-colors"
                                          title="Edit"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          onClick={() => setDeleteTarget(q)}
                                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editQuestion ? 'Edit Question' : 'Add New Question'}
        size="xl"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 max-h-[72vh] overflow-y-auto pr-1 pb-1"
        >
          {/* Step breadcrumb */}
          <div className="flex flex-wrap gap-2 mb-1">
            {[
              { n: 1, label: 'Category & Difficulty' },
              { n: 2, label: 'Question' },
              { n: 3, label: 'Options' },
              { n: 4, label: 'Answer & Explanation' },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[10px]">
                  {s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                {i < arr.length - 1 && <ChevronDown size={10} className="rotate-[-90deg] opacity-40" />}
              </div>
            ))}
          </div>

          {/* Section 1 — Category & Difficulty */}
          <div className="p-4 bg-black/2 dark:bg-white/2 rounded-2xl border border-[var(--border)] space-y-3">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[9px]">1</span>
              Category &amp; Difficulty
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Select
                label="Category *"
                options={ALL_CATEGORY_OPTIONS}
                placeholder="Select category"
                error={errors.category?.message}
                {...register('category')}
              />
              <Select
                label="Difficulty *"
                options={DIFFICULTY_OPTIONS}
                placeholder="Select difficulty"
                error={errors.difficulty?.message}
                {...register('difficulty')}
              />
            </div>
          </div>

          {/* Section 2 — Question text */}
          <div className="p-4 bg-black/2 dark:bg-white/2 rounded-2xl border border-[var(--border)] space-y-2">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[9px]">2</span>
              Question Text
            </p>
            <textarea
              rows={3}
              placeholder="Write the question clearly and precisely…"
              className="w-full rounded-xl border bg-white/60 dark:bg-black/20 px-4 py-2.5 text-sm text-[var(--text)] border-[var(--border)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all resize-none"
              {...register('text')}
            />
            {errors.text && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} />{errors.text.message}
              </p>
            )}
          </div>

          {/* Section 3 — Options A–D */}
          <div className="p-4 bg-black/2 dark:bg-white/2 rounded-2xl border border-[var(--border)] space-y-3">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[9px]">3</span>
              Answer Options
            </p>
            <p className="text-xs text-[var(--text-muted)]">Provide all 4 options. Mark the correct one in step 4.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const key = `option${letter}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                return (
                  <div key={letter} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary-400 z-10 pointer-events-none">
                      {letter}
                    </span>
                    <Input
                      placeholder={`Option ${letter}…`}
                      error={errors[key]?.message}
                      className="pl-7"
                      {...register(key)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4 — Answer, explanation, points, tags */}
          <div className="p-4 bg-black/2 dark:bg-white/2 rounded-2xl border border-[var(--border)] space-y-3">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center text-[9px]">4</span>
              Answer &amp; Explanation
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Select
                label="Correct Answer *"
                options={CORRECT_OPTIONS}
                placeholder="Select correct"
                error={errors.correctOption?.message}
                {...register('correctOption')}
              />
              <Input
                label="Points (1–5)"
                type="number"
                min={1}
                max={5}
                error={errors.points?.message}
                {...register('points')}
              />
              <Input
                label="Tags (comma-separated)"
                placeholder="oop, arrays, loops"
                {...register('tags')}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">
                Explanation{' '}
                <span className="text-[var(--text-muted)] font-normal">(why is this the correct answer?)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explain why the correct answer is right. Helps students learn."
                className="w-full rounded-xl border bg-white/60 dark:bg-black/20 px-4 py-2.5 text-sm text-[var(--text)] border-[var(--border)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all resize-none"
                {...register('explanation')}
              />
              {errors.explanation && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />{errors.explanation.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-card)] py-3">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSaving}
              leftIcon={editQuestion ? <Pencil size={14} /> : <Plus size={14} />}
            >
              {isSaving ? 'Saving…' : editQuestion ? 'Update Question' : 'Add Question'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ───────────────────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Question?" size="sm">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This cannot be undone. Built-in questions cannot be deleted.
            </p>
          </div>
          <p className="text-sm font-medium text-[var(--text)] bg-black/3 dark:bg-white/5 rounded-xl p-3 line-clamp-3 italic">
            "{deleteTarget?.text}"
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

