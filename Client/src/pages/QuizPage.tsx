import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Flag,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useQuiz } from '@/context/QuizContext';
import { quizService } from '@/services/quizService';
import { useTimer } from '@/hooks/useTimer';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useTabSwitch } from '@/hooks/useTabSwitch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { CircularTimer } from '@/components/quiz/CircularTimer';
import { NavigationGrid } from '@/components/quiz/NavigationGrid';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { STORAGE_KEYS } from '@/utils/storage';
import toast from 'react-hot-toast';

export default function QuizPage() {
  useDocumentTitle('Quiz in Progress');
  const navigate = useNavigate();
  const {
    session,
    currentQuestion,
    currentState,
    progress,
    selectOption,
    navigate: navTo,
    toggleMark,
    toggleBookmark,
    tickTime,
    submitQuiz,
  } = useQuiz();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.SOUND_ENABLED, true);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/dashboard', { replace: true });
  }, [session, navigate]);

  // Timer per question
  const timePerQ = session?.config.timePerQuestion ?? 30;
  const { timeLeft, reset: resetTimer } = useTimer({
    initialSeconds: timePerQ,
    onExpire: () => handleAutoAdvance(),
  });

  // Track time spent per question
  useEffect(() => {
    if (!currentQuestion) return;
    tickRef.current = setInterval(() => {
      tickTime(currentQuestion.id);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [currentQuestion, tickTime]);

  // Reset timer on question change
  useEffect(() => {
    resetTimer(timePerQ);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentIndex, timePerQ]);

  // Tab switch warning
  useTabSwitch({
    enabled: !!session && !session.isSubmitted,
    maxWarnings: 3,
    onExceed: handleSubmit,
  });

  // Disable right click
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  function handleAutoAdvance() {
    if (!session) return;
    const nextIndex = session.currentIndex + 1;
    if (nextIndex < session.questions.length) {
      navTo(nextIndex);
      toast(`⏱ Time up! Moving to question ${nextIndex + 1}`, { duration: 2000 });
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    const result = submitQuiz();
    if (!result) { setIsSubmitting(false); return; }

    try {
      await quizService.saveResult(result);
    } catch {
      toast.error('Could not save result, showing local data.');
    }

    navigate('/result', { state: { result } });
  }

  if (!session || !currentQuestion) return null;

  const { questions, currentIndex, questionStates, config } = session;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const isMarked = currentState?.status === 'marked';
  const isBookmarked = currentState?.status === 'bookmarked';

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="glass border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            Q
          </div>
          <span className="hidden sm:block font-bold text-sm text-[var(--text)]">QuizMaster Pro</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <ProgressBar
            value={currentIndex + 1}
            max={questions.length}
            height="sm"
            label={`Q${currentIndex + 1}/${questions.length}`}
            showPercentage
          />
        </div>

        {/* Badges */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="primary" dot>{config.category}</Badge>
          <Badge
            variant={config.difficulty === 'easy' ? 'success' : config.difficulty === 'medium' ? 'warning' : 'danger'}
          >
            {config.difficulty}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled((p) => !p)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] transition-colors"
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Send size={14} />}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit
          </Button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Main question area */}
        <main className="flex-1 p-4 sm:p-6 space-y-4 max-w-3xl mx-auto w-full">
          {/* Timer row */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              <strong className="text-[var(--text)]">{progress}%</strong> completed
            </p>
            <CircularTimer
              timeLeft={timeLeft}
              totalTime={timePerQ}
              size={56}
              strokeWidth={4}
            />
          </div>

          {/* Question card with animation */}
          <AnimatePresence mode="wait">
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              selectedOptionId={currentState?.selectedOptionId ?? null}
              onSelect={(optId) => selectOption(currentQuestion.id, optId)}
            />
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Flag size={14} />}
              onClick={() => toggleMark(currentQuestion.id)}
              className={isMarked ? 'border-orange-400 text-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}
            >
              {isMarked ? 'Unmark' : 'Mark for Review'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Bookmark size={14} />}
              onClick={() => toggleBookmark(currentQuestion.id)}
              className={isBookmarked ? 'border-yellow-400 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : ''}
            >
              {isBookmarked ? 'Unbookmark' : 'Bookmark'}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => navTo(currentIndex - 1)}
              disabled={isFirst}
            >
              Previous
            </Button>

            {isLast ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Send size={16} />}
                onClick={() => setShowSubmitModal(true)}
              >
                Finish Quiz
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                rightIcon={<ChevronRight size={16} />}
                onClick={() => navTo(currentIndex + 1)}
              >
                Next
              </Button>
            )}
          </div>
        </main>

        {/* Sidebar navigator (desktop) */}
        <aside className="hidden lg:block w-72 p-4 border-l border-[var(--border)]">
          <NavigationGrid
            questionStates={questionStates}
            currentIndex={currentIndex}
            onNavigate={navTo}
          />
        </aside>
      </div>

      {/* ── Mobile navigator strip ──────────────────────────── */}
      <div className="lg:hidden border-t border-[var(--border)] px-4 py-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {questionStates.map((qs, i) => (
            <button
              key={qs.questionId}
              onClick={() => navTo(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-colors
                ${i === currentIndex
                  ? 'ring-2 ring-primary-500'
                  : qs.selectedOptionId
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-[var(--text-muted)]'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* ── Submit confirmation modal ─────────────────────────── */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Quiz?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Are you sure you want to submit? Here's a summary:
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
              <p className="text-xl font-extrabold text-emerald-500">
                {questionStates.filter((s) => s.selectedOptionId !== null).length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Answered</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
              <p className="text-xl font-extrabold text-orange-500">
                {questionStates.filter((s) => s.status === 'marked').length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Marked</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xl font-extrabold text-[var(--text-muted)]">
                {questionStates.filter((s) => s.selectedOptionId === null).length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Unanswered</p>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowSubmitModal(false)}
            >
              Continue Quiz
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
