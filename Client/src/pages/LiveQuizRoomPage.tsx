import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, CheckCircle, ChevronRight, Radio, Trophy } from 'lucide-react';
import type { SpecialQuiz, Question } from '@/types';
import { specialQuizService } from '@/services/specialQuizService';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function Lobby({ quiz, userName }: { quiz: SpecialQuiz; userName: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full space-y-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/40 mx-auto mb-5">
            <Radio className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] mb-1">{quiz.title}</h1>
          {quiz.description && <p className="text-sm text-[var(--text-muted)] mb-3">{quiz.description}</p>}
          <p className="text-sm text-[var(--text-muted)]">
            You're in — <span className="font-semibold text-[var(--text)]">{userName}</span> ✓
          </p>
        </motion.div>

        {/* Participant count */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 border border-[var(--border)]"
        >
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-[var(--text)] mb-1">
            <Users size={18} className="text-violet-500" />
            {quiz.participants.length} student{quiz.participants.length !== 1 ? 's' : ''} joined
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {quiz.participants.map((p) => (
              <span
                key={p.userId}
                className="text-xs px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium"
              >
                {p.userName}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Waiting animation */}
        <div className="space-y-2">
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-[var(--text-muted)] font-medium">Waiting for admin to start the exam…</p>
        </div>
      </div>
    </div>
  );
}

function SubmittedWaiting() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-5">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto mb-4">
            <CheckCircle className="text-white" size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] mb-2">Submitted!</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Your answers have been recorded. Waiting for all students to finish…
          </p>
        </motion.div>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LiveQuizRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useDocumentTitle('Live Quiz');

  const [quiz, setQuiz] = useState<SpecialQuiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMsRef = useRef<number>(Date.now());

  // ── Polling ──────────────────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (!id) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      const fresh = specialQuizService.getById(id);
      if (!fresh) return;
      setQuiz(fresh);

      if (fresh.status === 'ended' && submitted) {
        clearInterval(pollRef.current!);
        navigate(`/live-results/${id}`);
      }
    }, 2000);
  }, [id, submitted, navigate]);

  useEffect(() => {
    if (!id) return;
    const q = specialQuizService.getById(id);
    if (!q) { toast.error('Quiz not found'); navigate('/dashboard'); return; }
    setQuiz(q);
    const shuffled = shuffle(q.questions);
    setQuestions(shuffled);
    startMsRef.current = Date.now();
    startPolling();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Restart polling when "submitted" changes (to detect ended)
  useEffect(() => { startPolling(); }, [startPolling]);

  // ── Timer per question ────────────────────────────────────────────────────

  useEffect(() => {
    if (!quiz || quiz.status !== 'live' || submitted || !quizStarted) return;
    setTimeLeft(quiz.timePerQuestion);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleNext(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, quizStarted, submitted]);

  // Quiz goes live — start
  useEffect(() => {
    if (quiz?.status === 'live' && !quizStarted && !submitted) {
      setQuizStarted(true);
    }
  }, [quiz?.status, quizStarted, submitted]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = (optionId: string) => {
    if (submitted) return;
    setSelected(optionId);
  };

  const handleNext = useCallback((autoAdvance = false) => {
    if (!quiz) return;
    const q = questions[currentIdx];
    const finalAnswers = { ...answers };
    if (selected) finalAnswers[q.id] = selected;
    setAnswers(finalAnswers);
    setSelected(null);

    if (autoAdvance && !selected) {
      // no answer recorded — still move on
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      // Submit
      if (timerRef.current) clearInterval(timerRef.current);
      const timeTaken = Math.floor((Date.now() - startMsRef.current) / 1000);
      specialQuizService.submit(quiz.id, user!.id, finalAnswers, timeTaken);
      setSubmitted(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, questions, currentIdx, selected, answers, user]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!quiz) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    if (quiz.status === 'ended') navigate(`/live-results/${id}`);
    return <SubmittedWaiting />;
  }

  if (quiz.status === 'waiting' || !quizStarted) {
    return <Lobby quiz={quiz} userName={user?.name ?? 'You'} />;
  }

  if (quiz.status === 'ended' && !submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Trophy size={48} className="mx-auto text-purple-500" />
          <p className="text-lg font-bold text-[var(--text)]">Quiz has ended</p>
          <Button variant="primary" onClick={() => navigate(`/live-results/${id}`)}>View Results</Button>
        </div>
      </div>
    );
  }

  const question = questions[currentIdx];
  if (!question) return null;

  const progress = ((currentIdx) / questions.length) * 100;
  const timerPct = (timeLeft / quiz.timePerQuestion) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text-muted)]">
          Question {currentIdx + 1} / {questions.length}
        </span>
        <span className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-full ${
          timeLeft <= 10 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' :
          'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
        }`}>
          <Clock size={13} />
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
          style={{ width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Timer bar */}
      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1">
        <motion.div
          className={`h-full rounded-full transition-colors ${timerPct > 50 ? 'bg-emerald-500' : timerPct > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${timerPct}%` }}
          animate={{ width: `${timerPct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="glass rounded-2xl border border-[var(--border)] p-5 md:p-6"
        >
          <p className="text-base md:text-lg font-semibold text-[var(--text)] mb-5 leading-relaxed">
          {question.text}
          </p>

          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-[var(--border)] bg-white/60 dark:bg-black/20 text-[var(--text)] hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-[var(--border)]'
                    }`}>
                      {isSelected ? '✓' : String.fromCharCode(65 + question.options.indexOf(opt))}
                    </span>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next / Submit */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          rightIcon={<ChevronRight size={16} />}
          onClick={() => handleNext(false)}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          {currentIdx + 1 < questions.length ? 'Next' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
