import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, ArrowRight, Users, Clock, Layers } from 'lucide-react';
import { specialQuizService, categoryService } from '@/services/specialQuizService';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function JoinQuizPage() {
  useDocumentTitle('Join Quiz');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: prefilledCode } = useParams<{ id?: string }>();

  const [code, setCode] = useState(prefilledCode?.toUpperCase() ?? '');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollingQuizId, setPollingQuizId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useDocumentTitle('Join Quiz');

  // If a code was pre-filled via URL, auto-join
  useEffect(() => {
    if (prefilledCode) {
      setCode(prefilledCode.toUpperCase());
    }
  }, [prefilledCode]);

  // Poll for quiz status change when waiting
  useEffect(() => {
    if (!polling || !pollingQuizId) return;

    intervalRef.current = setInterval(() => {
      const quiz = specialQuizService.getById(pollingQuizId);
      if (!quiz) {
        setPolling(false);
        toast.error('Quiz no longer found.');
        return;
      }
      if (quiz.status === 'live') {
        clearInterval(intervalRef.current!);
        setPolling(false);
        navigate(`/live-quiz/${quiz.id}`);
      }
      if (quiz.status === 'ended') {
        clearInterval(intervalRef.current!);
        setPolling(false);
        toast.error('This quiz has already ended.');
      }
    }, 2000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [polling, pollingQuizId, navigate]);

  const handleJoin = async () => {
    if (!user) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { toast.error('Please enter a quiz code'); return; }

    setLoading(true);
    try {
      const result = specialQuizService.join(trimmed, user);

      if (result.status === 'not_found') {
        toast.error('Invalid quiz code. Please check and try again.');
        return;
      }
      if (result.status === 'ended') {
        toast.error('This quiz has already ended. View the results instead.');
        navigate(`/live-results/${trimmed}`);
        return;
      }
      if (result.status === 'live') {
        // Jump straight in
        navigate(`/live-quiz/${result.quiz!.id}`);
        return;
      }
      // status === 'joined' or 'already' — quiz is waiting
      if (!result.already) toast.success(`Joined! Waiting for admin to start…`);
      else toast('You already joined this quiz. Entering lobby…');
      setPollingQuizId(trimmed);
      setPolling(true);
    } finally {
      setLoading(false);
    }
  };

  const previewQuiz = code.trim().toUpperCase() ? specialQuizService.getById(code.trim().toUpperCase()) : null;
  const catMeta = previewQuiz ? categoryService.findById(previewQuiz.category) : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-5">
        {/* Icon + heading */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-violet-500/30 mx-auto mb-4">
            <Radio className="text-white" size={30} />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] mb-1">Join a Live Quiz</h1>
          <p className="text-sm text-[var(--text-muted)]">Enter the code your admin shared with you</p>
        </motion.div>

        {/* Code input card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card glass>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[var(--text)] mb-2 block">Quiz Code</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="QUIZ-XXXXXX"
                  maxLength={11}
                  disabled={polling}
                  className="w-full rounded-xl border border-[var(--border)] bg-white/60 dark:bg-black/20 px-4 py-3 text-xl font-mono font-bold tracking-widest text-[var(--text)] text-center focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all disabled:opacity-50"
                />
              </div>

              {/* Live quiz preview */}
              {previewQuiz && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-violet-200 dark:border-violet-800 space-y-2"
                >
                  <h3 className="font-bold text-[var(--text)] text-sm">{previewQuiz.title}</h3>
                  {previewQuiz.description && (
                    <p className="text-xs text-[var(--text-muted)]">{previewQuiz.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Layers size={11} /> {catMeta?.icon} {catMeta?.label ?? previewQuiz.category}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={11} /> {previewQuiz.timePerQuestion}s / question
                    </span>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Users size={11} /> {previewQuiz.participants.length} joined
                    </span>
                  </div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    previewQuiz.status === 'live' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                    previewQuiz.status === 'waiting' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${previewQuiz.status === 'live' ? 'bg-emerald-400 animate-pulse' : previewQuiz.status === 'waiting' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                    {previewQuiz.status === 'live' ? 'LIVE' : previewQuiz.status === 'waiting' ? 'Waiting for start' : 'Ended'}
                  </div>
                </motion.div>
              )}

              {/* Waiting state */}
              {polling && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-3 space-y-2"
                >
                  <div className="flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[var(--text-muted)]">Waiting for admin to start the quiz…</p>
                  <p className="text-xs text-[var(--text-muted)]">You'll be taken in automatically when it goes live.</p>
                </motion.div>
              )}

              {!polling && (
                <Button
                  variant="primary"
                  fullWidth
                  loading={loading}
                  rightIcon={<ArrowRight size={16} />}
                  onClick={handleJoin}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  Join Quiz
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Only join quizzes shared by your instructor. Do not share the code further.
        </p>
      </div>
    </div>
  );
}
