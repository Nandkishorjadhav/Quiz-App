import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  ShieldCheck,
  BookOpen,
  Search,
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { value: 'javascript', label: '⚡ JavaScript' },
  { value: 'python', label: '🐍 Python' },
  { value: 'java', label: '☕ Java' },
  { value: 'cpp', label: '⚙️ C++' },
  { value: 'sql', label: '🗄️ SQL' },
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

export default function AdminPage() {
  useDocumentTitle('Admin Panel');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [search, setSearch] = useState('');
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

  const fetchQuestions = async () => {
    setLoading(true);
    const res = await quizService.getAllQuestionsAdmin(
      catFilter === 'all' ? undefined : catFilter,
      diffFilter === 'all' ? undefined : diffFilter,
    );
    setQuestions(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [catFilter, diffFilter]);

  const openCreate = () => {
    reset({ points: 1 });
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
      const questionData = {
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
        await quizService.updateQuestion(editQuestion.id, questionData);
        toast.success('Question updated!');
      } else {
        await quizService.createQuestion(questionData);
        toast.success('Question created!');
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
      toast.error('Cannot delete — this may be a built-in question');
      setDeleteTarget(null);
    }
  };

  const filtered = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase()) ||
    q.category.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: questions.length,
    easy: questions.filter((q) => q.difficulty === 'easy').length,
    medium: questions.filter((q) => q.difficulty === 'medium').length,
    hard: questions.filter((q) => q.difficulty === 'hard').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">Admin Panel</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage quiz questions</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Add Question
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Easy', value: stats.easy, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Medium', value: stats.medium, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Hard', value: stats.hard, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((s) => (
          <Card key={s.label} glass padding="sm">
            <div className={`${s.bg} rounded-xl p-3 text-center`}>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-[var(--text-muted)]" />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${catFilter === 'all' ? 'border-primary-500 bg-primary-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
          >
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${catFilter === c.id ? 'border-primary-500 bg-primary-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize
                ${diffFilter === d ? 'border-primary-500 bg-primary-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="ml-auto w-full sm:w-auto">
          <Input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} glass padding="md">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <BookOpen size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-muted)]">No questions found.</p>
            <Button className="mt-4" variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
              Add First Question
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card glass padding="md" className="flex gap-4 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge variant="primary" dot>{q.category}</Badge>
                      <Badge
                        variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}
                      >
                        {q.difficulty}
                      </Badge>
                      <Badge variant="default">{q.points} pt{q.points !== 1 ? 's' : ''}</Badge>
                    </div>
                    <p className="text-sm font-medium text-[var(--text)] line-clamp-2">{q.text}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Correct: <span className="font-semibold text-emerald-500 uppercase">{q.correctOptionId}</span>
                      {' — '}{q.options.find((o) => o.id === q.correctOptionId)?.text}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Pencil size={13} />}
                      onClick={() => openEdit(q)}
                      aria-label="Edit question"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={13} />}
                      onClick={() => setDeleteTarget(q)}
                      aria-label="Delete question"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editQuestion ? 'Edit Question' : 'Add New Question'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              placeholder="Select category"
              error={errors.category?.message}
              {...register('category')}
            />
            <Select
              label="Difficulty"
              options={DIFFICULTY_OPTIONS}
              placeholder="Select difficulty"
              error={errors.difficulty?.message}
              {...register('difficulty')}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)] mb-1.5 block" htmlFor="q-text">
              Question Text
            </label>
            <textarea
              id="q-text"
              rows={3}
              placeholder="Enter the question..."
              className="w-full rounded-xl border bg-white/50 dark:bg-black/20 px-4 py-2.5 text-sm text-[var(--text)] border-[var(--border)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all resize-none"
              {...register('text')}
            />
            {errors.text && <p className="text-xs text-red-500 mt-1">{errors.text.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
              const key = `option${letter}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
              return (
                <Input
                  key={letter}
                  label={`Option ${letter}`}
                  placeholder={`Enter option ${letter}`}
                  error={errors[key]?.message}
                  {...register(key)}
                />
              );
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Select
              label="Correct Answer"
              options={CORRECT_OPTIONS}
              placeholder="Select correct"
              error={errors.correctOption?.message}
              {...register('correctOption')}
            />
            <Input
              label="Points"
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
            <label className="text-sm font-medium text-[var(--text)] mb-1.5 block" htmlFor="q-explanation">
              Explanation
            </label>
            <textarea
              id="q-explanation"
              rows={3}
              placeholder="Explain why the correct answer is right..."
              className="w-full rounded-xl border bg-white/50 dark:bg-black/20 px-4 py-2.5 text-sm text-[var(--text)] border-[var(--border)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all resize-none"
              {...register('explanation')}
            />
            {errors.explanation && (
              <p className="text-xs text-red-500 mt-1">{errors.explanation.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-card)] py-3">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSaving}>
              {isSaving ? 'Saving…' : editQuestion ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Question?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <p className="text-sm font-medium text-[var(--text)] bg-red-50 dark:bg-red-900/20 rounded-xl p-3 line-clamp-3">
            "{deleteTarget?.text}"
          </p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
