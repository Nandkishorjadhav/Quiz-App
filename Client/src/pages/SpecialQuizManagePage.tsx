import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  Users,
  Clock,
  Layers,
  Trophy,
  Radio,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import type { SpecialQuiz } from '@/types';
import { specialQuizService, categoryService } from '@/services/specialQuizService';
import { specialQuizSchema, type SpecialQuizFormValues } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────

const DIFF_OPTIONS = [
  { value: 'easy', label: '🟢 Easy' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'hard', label: '🔴 Hard' },
];

const STATUS_META = {
  waiting: { label: 'Waiting', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-400' },
  live:    { label: 'LIVE',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-400 animate-pulse' },
  ended:   { label: 'Ended',   color: 'text-[var(--text-muted)]', bg: 'bg-black/5 dark:bg-white/5', dot: 'bg-gray-400' },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpecialQuizManagePage() {
  useDocumentTitle('Special Quizzes');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<SpecialQuiz[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpecialQuiz | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const allCategories = categoryService.getAll().map((c) => ({
    value: c.id,
    label: `${c.icon} ${c.label}`,
  }));

  const refresh = useCallback(() => setQuizzes(specialQuizService.getAll()), []);

  useEffect(() => {
    refresh();
    // Poll every 3 seconds to reflect status changes
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SpecialQuizFormValues, unknown, SpecialQuizFormValues>({
    resolver: zodResolver(specialQuizSchema) as never,
    defaultValues: { questionCount: 10, timePerQuestion: 30, difficulty: 'medium' },
  });

  const onCreateSubmit = async (data: SpecialQuizFormValues) => {
    if (!user) return;
    setIsCreating(true);
    try {
      const quiz = specialQuizService.create(
        {
          title: data.title,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          questionCount: data.questionCount,
          timePerQuestion: data.timePerQuestion,
        },
        user,
      );
      toast.success(`Quiz "${quiz.id}" created! Share the code with students.`);
      setShowCreate(false);
      reset();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create quiz');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStart = (quiz: SpecialQuiz) => {
    if (quiz.participants.length === 0) {
      toast.error('No students have joined yet');
      return;
    }
    specialQuizService.start(quiz.id);
    toast.success('Quiz is now LIVE! Students can start answering.');
    refresh();
  };

  const handleEnd = (quiz: SpecialQuiz) => {
    specialQuizService.end(quiz.id);
    toast.success('Quiz ended. Results are now available.');
    refresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    specialQuizService.delete(deleteTarget.id);
    toast.success('Quiz deleted');
    setDeleteTarget(null);
    refresh();
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/join/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast.success('Join link copied!');
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} className="text-[var(--text-muted)]" />
          </button>
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Radio className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">Special Quizzes</h1>
            <p className="text-xs text-[var(--text-muted)]">Create live exams, share codes, and view real-time rankings</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Create Quiz
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',   value: quizzes.length,                              icon: <Layers size={16} />,  color: 'text-primary-500',  bg: 'from-primary-500/10 to-primary-500/5' },
          { label: 'Live',    value: quizzes.filter((q) => q.status === 'live').length,    icon: <Radio size={16} />,   color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-500/5' },
          { label: 'Ended',   value: quizzes.filter((q) => q.status === 'ended').length,   icon: <Trophy size={16} />,  color: 'text-purple-500',  bg: 'from-purple-500/10 to-purple-500/5' },
        ].map((s) => (
          <Card key={s.label} glass padding="sm">
            <div className={`bg-gradient-to-br ${s.bg} rounded-xl p-3`}>
              <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-semibold">{s.label}</span></div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quiz list */}
      {quizzes.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <Radio size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)] mb-4">No special quizzes yet.</p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            Create Your First Quiz
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {quizzes
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((quiz) => {
                const st = STATUS_META[quiz.status];
                const submitted = quiz.participants.filter((p) => p.submitted).length;
                const catMeta = categoryService.findById(quiz.category);

                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="glass rounded-2xl border border-[var(--border)] overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Status + title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                            {quiz.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-[var(--text)] text-base mb-1">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-xs text-[var(--text-muted)] mb-2">{quiz.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default" className="text-xs">
                            {catMeta?.icon} {catMeta?.label ?? quiz.category}
                          </Badge>
                          <Badge
                            variant={quiz.difficulty === 'easy' ? 'success' : quiz.difficulty === 'medium' ? 'warning' : 'danger'}
                            className="text-xs"
                          >
                            {quiz.difficulty}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Layers size={11} /> {quiz.questions.length} questions
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Clock size={11} /> {quiz.timePerQuestion}s / question
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Users size={11} /> {quiz.participants.length} joined · {submitted} submitted
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {/* Copy join link */}
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={copied === quiz.id ? <Check size={13} /> : <Copy size={13} />}
                          onClick={() => copyLink(quiz.id)}
                          className={copied === quiz.id ? 'border-emerald-400 text-emerald-500' : ''}
                        >
                          {copied === quiz.id ? 'Copied!' : 'Copy Link'}
                        </Button>

                        {/* View results (ended) */}
                        {quiz.status === 'ended' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Trophy size={13} />}
                            onClick={() => navigate(`/live-results/${quiz.id}`)}
                          >
                            Results
                          </Button>
                        )}

                        {/* Start (waiting) */}
                        {quiz.status === 'waiting' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Play size={13} />}
                            onClick={() => handleStart(quiz)}
                          >
                            Start
                          </Button>
                        )}

                        {/* End (live) */}
                        {quiz.status === 'live' && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Square size={13} />}
                            onClick={() => handleEnd(quiz)}
                          >
                            End Quiz
                          </Button>
                        )}

                        {/* Delete */}
                        {quiz.status !== 'live' && (
                          <button
                            onClick={() => setDeleteTarget(quiz)}
                            className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Participant mini-table for live quizzes */}
                    {quiz.status !== 'waiting' && quiz.participants.length > 0 && (
                      <div className="border-t border-[var(--border)] overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-black/3 dark:bg-white/3">
                              <th className="text-left px-4 py-2 text-[var(--text-muted)] font-semibold">Student</th>
                              <th className="text-center px-3 py-2 text-[var(--text-muted)] font-semibold">Score</th>
                              <th className="text-center px-3 py-2 text-[var(--text-muted)] font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quiz.participants.map((p) => (
                              <tr key={p.userId} className="border-t border-[var(--border)]">
                                <td className="px-4 py-2 font-medium text-[var(--text)]">{p.userName}</td>
                                <td className="px-3 py-2 text-center text-[var(--text-muted)]">
                                  {p.submitted ? `${p.percentage}%` : '—'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.submitted ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                                    {p.submitted ? '✓ Done' : '⏳ In progress'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Create Quiz Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="Create Special Quiz"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-5">
          <div>
            <Input
              label="Quiz Title *"
              placeholder="e.g. JavaScript Finals — Batch 2026"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">
              Description <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief info for students about this exam…"
              className="w-full rounded-xl border bg-white/60 dark:bg-black/20 px-4 py-2.5 text-sm text-[var(--text)] border-[var(--border)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all resize-none"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Category *"
              options={allCategories}
              placeholder="Select category"
              error={errors.category?.message}
              {...register('category')}
            />
            <Select
              label="Difficulty *"
              options={DIFF_OPTIONS}
              placeholder="Select difficulty"
              error={errors.difficulty?.message}
              {...register('difficulty')}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Number of Questions *"
                type="number"
                min={2}
                max={30}
                error={errors.questionCount?.message}
                {...register('questionCount')}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Between 2 and 30</p>
            </div>
            <div>
              <Input
                label="Time per Question (seconds) *"
                type="number"
                min={10}
                max={120}
                error={errors.timePerQuestion?.message}
                {...register('timePerQuestion')}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Between 10s and 120s</p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex gap-2 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>After creating, share the <strong>join code</strong> with students. Click <strong>Start</strong> when everyone is ready. Students must be on the join page to receive the live signal.</span>
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--border)]">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); reset(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isCreating} leftIcon={<Play size={14} />}>
              {isCreating ? 'Creating…' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Quiz?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            This will permanently delete the quiz and all participant data.
          </p>
          <p className="text-sm font-semibold text-[var(--text)] bg-black/3 dark:bg-white/5 p-3 rounded-xl">
            "{deleteTarget?.title}"
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
