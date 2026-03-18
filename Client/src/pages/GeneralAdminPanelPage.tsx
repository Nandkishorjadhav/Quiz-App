import { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  User,
} from 'lucide-react';
import type { SpecialQuiz } from '@/types';
import { specialQuizService, categoryService } from '@/services/specialQuizService';
import { specialQuizSchema, type SpecialQuizFormValues } from '@/utils/validators';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const GENERAL_ADMIN_KEY = 'qm_general_admin_profile';

const DIFF_OPTIONS = [
  { value: 'easy', label: '🟢 Easy' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'hard', label: '🔴 Hard' },
];

const STATUS_META = {
  waiting: { label: 'Waiting', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-400' },
  live: { label: 'LIVE', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-400 animate-pulse' },
  ended: { label: 'Ended', color: 'text-[var(--text-muted)]', bg: 'bg-black/5 dark:bg-white/5', dot: 'bg-gray-400' },
};

interface GeneralAdminProfile {
  name: string;
}

function getStoredProfile(): GeneralAdminProfile {
  try {
    const raw = localStorage.getItem(GENERAL_ADMIN_KEY);
    if (!raw) return { name: '' };
    const parsed = JSON.parse(raw) as GeneralAdminProfile;
    return { name: parsed.name ?? '' };
  } catch {
    return { name: '' };
  }
}

function makeAdminId(name: string) {
  return `general-admin-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'host'}`;
}

export default function GeneralAdminPanelPage() {
  useDocumentTitle('General Admin Panel');

  const [quizzes, setQuizzes] = useState<SpecialQuiz[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpecialQuiz | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [adminName, setAdminName] = useState('');

  const allCategories = categoryService.getAll().map((c) => ({
    value: c.id,
    label: `${c.icon} ${c.label}`,
  }));

  const refresh = useCallback(() => setQuizzes(specialQuizService.getAll()), []);

  useEffect(() => {
    setAdminName(getStoredProfile().name);
    refresh();
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

  const saveAdminName = (name: string) => {
    const normalized = name.trim();
    setAdminName(normalized);
    localStorage.setItem(GENERAL_ADMIN_KEY, JSON.stringify({ name: normalized }));
  };

  const onCreateSubmit = async (data: SpecialQuizFormValues) => {
    const normalizedName = adminName.trim();
    if (!normalizedName) {
      toast.error('Enter host name before creating quiz');
      return;
    }

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
        { id: makeAdminId(normalizedName), name: normalizedName },
      );
      toast.success(`Quiz "${quiz.id}" created. Share live link with participants.`);
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
      toast.error('No participants have joined yet');
      return;
    }
    specialQuizService.start(quiz.id);
    toast.success('Quiz is now LIVE');
    refresh();
  };

  const handleEnd = (quiz: SpecialQuiz) => {
    specialQuizService.end(quiz.id);
    toast.success('Quiz ended');
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
    const link = specialQuizService.buildLiveLink(id, true);
    navigator.clipboard.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast.success('Live link copied');
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Radio className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">General Admin Panel</h1>
            <p className="text-xs text-[var(--text-muted)]">No login required. Quizzes are stored in browser localStorage.</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Create Quiz
        </Button>
      </motion.div>

      <Card glass>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <Input
            label="Host Name"
            placeholder="e.g. Prof. N. Jadhav"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            leftIcon={<User size={14} />}
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!adminName.trim()) {
                toast.error('Please enter host name');
                return;
              }
              saveAdminName(adminName);
              toast.success('Host name saved');
            }}
          >
            Save Name
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: quizzes.length, icon: <Layers size={16} />, color: 'text-primary-500', bg: 'from-primary-500/10 to-primary-500/5' },
          { label: 'Live', value: quizzes.filter((q) => q.status === 'live').length, icon: <Radio size={16} />, color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-500/5' },
          { label: 'Ended', value: quizzes.filter((q) => q.status === 'ended').length, icon: <Trophy size={16} />, color: 'text-purple-500', bg: 'from-purple-500/10 to-purple-500/5' },
        ].map((s) => (
          <Card key={s.label} glass padding="sm">
            <div className={`bg-gradient-to-br ${s.bg} rounded-xl p-3`}>
              <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-semibold">{s.label}</span></div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <Radio size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)] mb-4">No live quizzes created yet.</p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            Create First Quiz
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

                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={copied === quiz.id ? <Check size={13} /> : <Copy size={13} />}
                          onClick={() => copyLink(quiz.id)}
                          className={copied === quiz.id ? 'border-emerald-400 text-emerald-500' : ''}
                        >
                          {copied === quiz.id ? 'Copied' : 'Copy Link'}
                        </Button>

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

                        {quiz.status === 'live' && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Square size={13} />}
                            onClick={() => handleEnd(quiz)}
                          >
                            End
                          </Button>
                        )}

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
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          reset();
        }}
        title="Create Public Live Quiz"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-5">
          <div>
            <Input
              label="Quiz Title"
              placeholder="e.g. JavaScript Mock Test"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)] mb-1.5 block">Description</label>
            <textarea
              rows={2}
              placeholder="Optional details for participants"
              className="w-full rounded-xl border bg-white/60 dark:bg-black/20 px-4 py-2.5 text-sm text-[var(--text)] border-[var(--border)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all resize-none"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              options={allCategories}
              placeholder="Select category"
              error={errors.category?.message}
              {...register('category')}
            />
            <Select
              label="Difficulty"
              options={DIFF_OPTIONS}
              placeholder="Select difficulty"
              error={errors.difficulty?.message}
              {...register('difficulty')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Questions"
              type="number"
              min={2}
              max={30}
              error={errors.questionCount?.message}
              {...register('questionCount')}
            />
            <Input
              label="Time / Question (sec)"
              type="number"
              min={10}
              max={120}
              error={errors.timePerQuestion?.message}
              {...register('timePerQuestion')}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex gap-2 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Share the generated live link. Participants can open it directly, enter their name, and start when you click Start.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isCreating}>
              Create Quiz
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quiz"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Are you sure you want to delete {deleteTarget?.title ?? 'this quiz'}?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
