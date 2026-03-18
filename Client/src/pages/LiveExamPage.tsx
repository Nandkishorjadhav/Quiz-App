/**
 * LiveExamPage — /live/:id (PUBLIC route, no login required)
 *
 * Fully self-contained full-screen exam experience for students:
 *   name_entry → lobby → quiz → submitted → results
 *
 * Guest identity is stored in sessionStorage so the same seat is
 * kept on refresh. No account / login required.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Users,
  Clock,
  ChevronRight,
  CheckCircle,
  Trophy,
  Medal,
  Layers,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import type { SpecialQuiz, SpecialQuizParticipant, Question } from '@/types';
import { specialQuizService, categoryService } from '@/services/specialQuizService';

// ── Tiny helpers ───────────────────────────────────────────────────────────────

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${s}s`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genGuestId() {
  return `guest-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

const MEDAL = ['🥇', '🥈', '🥉'];

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'not_found' | 'ended_gate' | 'name_entry' | 'lobby' | 'quiz' | 'submitted' | 'results';

interface GuestSession {
  guestId: string;
  name: string;
  quizId: string;
}

// ── Full-screen wrapper ────────────────────────────────────────────────────────

function Screen({ children, gradient = 'from-slate-900 via-purple-950 to-indigo-950' }: { children: React.ReactNode; gradient?: string }) {
  return (
    <div className={`fixed inset-0 z-[100] bg-gradient-to-br ${gradient} overflow-y-auto flex flex-col items-center justify-center p-4 md:p-8`}>
      {children}
    </div>
  );
}

// ── Phase: Loading ─────────────────────────────────────────────────────────────

function PhaseLoading() {
  return (
    <Screen>
      <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </Screen>
  );
}

// ── Phase: Not Found ──────────────────────────────────────────────────────────

function PhaseNotFound({ code }: { code: string }) {
  return (
    <Screen>
      <div className="text-center space-y-4 max-w-sm">
        <AlertTriangle size={48} className="mx-auto text-amber-400" />
        <h1 className="text-2xl font-extrabold text-white">Quiz Not Found</h1>
        <p className="text-purple-300 text-sm">
          No quiz with code <span className="font-mono font-bold text-white">{code}</span> was found.<br />
          Check the link and try again.
        </p>
      </div>
    </Screen>
  );
}

// ── Phase: Already Ended ──────────────────────────────────────────────────────

function PhaseEnded({ quiz, ranked }: { quiz: SpecialQuiz; ranked: (SpecialQuizParticipant & { rank: number })[] }) {
  const catMeta = categoryService.findById(quiz.category);
  return (
    <Screen gradient="from-slate-900 via-indigo-950 to-purple-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-3">
            <Trophy className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">{quiz.title}</h1>
          <p className="text-sm text-purple-300">
            {catMeta?.icon} {catMeta?.label ?? quiz.category} — Final Results
          </p>
        </div>
        {ranked.length === 0 ? (
          <p className="text-center text-purple-300 text-sm">No submissions recorded.</p>
        ) : (
          <div className="space-y-2">
            {ranked.slice(0, 10).map((p, i) => (
              <div key={p.userId} className="flex items-center gap-3 bg-white/5 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <span className="text-xl w-8 text-center">{i < 3 ? MEDAL[i] : `#${p.rank}`}</span>
                <span className="flex-1 text-white font-medium truncate">{p.userName}</span>
                <span className="text-purple-300 text-sm font-mono">{p.percentage}%</span>
                <span className="text-purple-400 text-xs flex items-center gap-1"><Clock size={10} />{p.timeTaken}s</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-xs text-purple-400">This exam has ended. Contact your instructor for further details.</p>
      </div>
    </Screen>
  );
}

// ── Phase: Name Entry ─────────────────────────────────────────────────────────

function PhaseNameEntry({
  quiz,
  onJoin,
}: {
  quiz: SpecialQuiz;
  onJoin: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const catMeta = categoryService.findById(quiz.category);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setErr('Please enter your name'); return; }
    if (trimmed.length < 2) { setErr('Name must be at least 2 characters'); return; }
    onJoin(trimmed);
  };

  return (
    <Screen>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Quiz badge */}
        <div className="text-center">
          <span className="inline-block bg-white/10 backdrop-blur border border-white/20 text-purple-200 text-xs font-mono px-3 py-1 rounded-full mb-4">
            {quiz.id}
          </span>
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/40 mx-auto mb-3">
            <Radio className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">{quiz.title}</h1>
          {quiz.description && <p className="text-sm text-purple-300 mb-3">{quiz.description}</p>}
          <div className="flex justify-center flex-wrap gap-3 text-xs text-purple-300">
            <span className="bg-white/10 px-2 py-1 rounded-lg">{catMeta?.icon} {catMeta?.label ?? quiz.category}</span>
            <span className="bg-white/10 px-2 py-1 rounded-lg capitalize">{quiz.difficulty}</span>
            <span className="bg-white/10 px-2 py-1 rounded-lg flex items-center gap-1"><Layers size={10} />{quiz.questions.length} questions</span>
            <span className="bg-white/10 px-2 py-1 rounded-lg flex items-center gap-1"><Clock size={10} />{quiz.timePerQuestion}s / question</span>
          </div>
        </div>

        {/* Name form */}
        <div className="bg-white/5 backdrop-blur border border-white/15 rounded-2xl p-6 space-y-4">
          <h2 className="text-center text-white font-semibold text-sm">Enter your name to join</h2>
          <div>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Your full name"
              autoFocus
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-purple-400 text-center text-lg font-semibold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 transition-all"
            />
            {err && <p className="text-red-400 text-xs text-center mt-1.5">{err}</p>}
          </div>
          <button
            onClick={submit}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-500/30"
          >
            Join Quiz <ArrowRight size={16} />
          </button>
        </div>

        <p className="text-center text-xs text-purple-400">
          No account needed · Your progress is saved in this browser session
        </p>
      </motion.div>
    </Screen>
  );
}

// ── Phase: Lobby ──────────────────────────────────────────────────────────────

function PhaseLobby({ quiz, guestName }: { quiz: SpecialQuiz; guestName: string }) {
  return (
    <Screen>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 text-center">
        <div>
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-3">
            <Radio className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">{quiz.title}</h1>
          <p className="text-purple-300 text-sm">
            Welcome, <span className="font-bold text-white">{guestName}</span> 👋
          </p>
        </div>

        {/* Participant count */}
        <div className="bg-white/5 border border-white/15 backdrop-blur rounded-2xl p-5">
          <div className="flex items-center justify-center gap-2 text-2xl font-extrabold text-white mb-2">
            <Users size={22} className="text-violet-400" />
            {quiz.participants.length}
          </div>
          <p className="text-purple-300 text-sm mb-3">student{quiz.participants.length !== 1 ? 's' : ''} joined so far</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {quiz.participants.slice(0, 20).map((p) => (
              <span key={p.userId} className={`text-xs px-2 py-0.5 rounded-full border ${p.userName === guestName ? 'bg-violet-500/30 border-violet-400 text-violet-200 font-bold' : 'bg-white/5 border-white/10 text-purple-300'}`}>
                {p.userName === guestName ? '★ ' : ''}{p.userName}
              </span>
            ))}
            {quiz.participants.length > 20 && <span className="text-xs text-purple-400">+{quiz.participants.length - 20} more</span>}
          </div>
        </div>

        {/* Waiting animation */}
        <div className="space-y-3">
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-purple-300 text-sm font-medium">Waiting for your instructor to start…</p>
          <p className="text-purple-500 text-xs">You'll be taken straight in when the quiz goes live.</p>
        </div>
      </motion.div>
    </Screen>
  );
}

// ── Phase: Quiz ────────────────────────────────────────────────────────────────

function PhaseQuiz({
  quiz,
  onSubmit,
}: {
  quiz: SpecialQuiz;
  onSubmit: (answers: Record<string, string>, timeTaken: number) => void;
}) {
  const [questions] = useState<Question[]>(() => shuffle(quiz.questions));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(quiz.timePerQuestion);
  const startMsRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((forcedAnswers?: Record<string, string>) => {
    const q = questions[currentIdx];
    const updatedAnswers = { ...(forcedAnswers ?? answers) };
    if (selected) updatedAnswers[q.id] = selected;

    if (currentIdx + 1 < questions.length) {
      setAnswers(updatedAnswers);
      setSelected(null);
      setCurrentIdx((i) => i + 1);
      setTimeLeft(quiz.timePerQuestion);
    } else {
      // last question — submit
      const timeTaken = Math.floor((Date.now() - startMsRef.current) / 1000);
      onSubmit(updatedAnswers, timeTaken);
    }
  }, [questions, currentIdx, answers, selected, quiz.timePerQuestion, onSubmit]);

  // Per-question countdown
  useEffect(() => {
    setTimeLeft(quiz.timePerQuestion);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          advance();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  const question = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;
  const timerPct = (timeLeft / quiz.timePerQuestion) * 100;
  const isLast = currentIdx + 1 === questions.length;

  return (
    <Screen gradient="from-slate-900 via-indigo-950 to-purple-950">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-purple-300 text-sm font-semibold">
            {currentIdx + 1} / {questions.length}
          </span>
          <span className={`font-mono font-bold text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${
            timeLeft <= 10
              ? 'bg-red-500/20 text-red-300 animate-pulse border border-red-500/30'
              : 'bg-white/10 text-purple-200 border border-white/15'
          }`}>
            <Clock size={13} />
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Progress bars */}
        <div className="space-y-1.5">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${timerPct > 50 ? 'bg-emerald-400' : timerPct > 25 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${timerPct}%` }}
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="bg-white/5 backdrop-blur border border-white/15 rounded-2xl p-5 md:p-7 space-y-5"
          >
            <p className="text-white font-semibold text-base md:text-lg leading-relaxed">
              {question.text}
            </p>

            <div className="space-y-2.5">
              {question.options.map((opt, i) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(isSelected ? null : opt.id)}
                    className={`w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-all border flex items-center gap-3 ${
                      isSelected
                        ? 'border-violet-400 bg-violet-500/20 text-white shadow-lg shadow-violet-500/20'
                        : 'border-white/15 bg-white/5 text-purple-200 hover:border-violet-400/50 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected ? 'border-violet-400 bg-violet-400 text-white' : 'border-white/30 text-purple-400'
                    }`}>
                      {isSelected ? '✓' : String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next / Submit */}
        <div className="flex justify-end">
          <button
            onClick={() => advance()}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-500/30"
          >
            {isLast ? 'Submit Exam' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>

        {/* Unanswered note */}
        {!selected && (
          <p className="text-center text-xs text-purple-500">No answer selected — click Next to skip this question</p>
        )}
      </div>
    </Screen>
  );
}

// ── Phase: Submitted (waiting for end) ────────────────────────────────────────

function PhaseSubmitted() {
  return (
    <Screen gradient="from-slate-900 via-emerald-950 to-teal-950">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 max-w-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto">
          <CheckCircle className="text-white" size={36} />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Submitted!</h2>
        <p className="text-emerald-300 text-sm">
          Your answers have been recorded. Hang tight while your instructor wraps up the exam for everyone.
        </p>
        <div className="flex justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </motion.div>
    </Screen>
  );
}

// ── Phase: Results ────────────────────────────────────────────────────────────

function PhaseResults({
  quiz,
  guestId,
  ranked,
}: {
  quiz: SpecialQuiz;
  guestId: string;
  ranked: (SpecialQuizParticipant & { rank: number })[];
}) {
  const catMeta = categoryService.findById(quiz.category);
  const me = ranked.find((p) => p.userId === guestId);
  const total = quiz.questions.reduce((s, q) => s + q.points, 0);

  return (
    <Screen gradient="from-slate-900 via-indigo-950 to-purple-950">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-3">
            <Trophy className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">{quiz.title}</h1>
          <p className="text-sm text-purple-300">{catMeta?.icon} {catMeta?.label} — Final Rankings</p>
        </div>

        {/* My score highlight */}
        {me && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-400/40 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{me.rank <= 3 ? MEDAL[me.rank - 1] : `#${me.rank}`}</span>
              <div>
                <p className="text-white font-bold">{me.userName} <span className="text-xs text-purple-300 font-normal">(you)</span></p>
                <p className="text-xs text-purple-300">Rank #{me.rank} · {me.correctCount} correct</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-white">{me.percentage}%</p>
              <p className="text-xs text-purple-300">{me.score}/{total}</p>
            </div>
          </motion.div>
        )}

        {/* Rankings */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <Medal size={15} className="text-amber-400" />
            <span className="text-sm font-bold text-white">All Rankings</span>
            <span className="ml-auto text-xs text-purple-400">{ranked.length} submitted</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
            {ranked.length === 0 ? (
              <p className="text-center text-purple-400 text-sm py-6">No submissions yet</p>
            ) : ranked.map((p, i) => {
              const isMe = p.userId === guestId;
              return (
                <motion.div
                  key={p.userId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-violet-500/20' : ''}`}
                >
                  <span className="w-8 text-center text-lg">{i < 3 ? MEDAL[i] : <span className="text-xs font-bold text-purple-400">#{p.rank}</span>}</span>
                  <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-violet-200 font-bold' : 'text-purple-100'}`}>
                    {p.userName} {isMe && '★'}
                  </span>
                  <span className="text-sm font-bold text-white">{p.percentage}%</span>
                  <span className="text-xs text-purple-400 flex items-center gap-0.5 w-12 justify-end">
                    <Clock size={10} />{p.timeTaken}s
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-purple-500">
          Results are final. Contact your instructor if you have questions.
        </p>
      </div>
    </Screen>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LiveExamPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const quizId = id?.toUpperCase() ?? '';
  const snapshotParam = new URLSearchParams(location.search).get('snapshot') ?? '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [quiz, setQuiz] = useState<SpecialQuiz | null>(null);
  const [guestId, setGuestId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [ranked, setRanked] = useState<(SpecialQuizParticipant & { rank: number })[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  // Load or restore guest session
  const sessionKey = `qm_guest_${quizId}`;

  const getOrCreateGuestId = (name: string) => {
    const stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      try {
        const parsed: GuestSession = JSON.parse(stored);
        if (parsed.quizId === quizId) return { id: parsed.guestId, name: parsed.name };
      } catch {/* ignore */}
    }
    const newId = genGuestId();
    const session: GuestSession = { guestId: newId, name, quizId };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    return { id: newId, name };
  };

  const refreshQuiz = useCallback(() => {
    const q = specialQuizService.getById(quizId);
    if (!q) return null;
    setQuiz(q);
    setRanked(specialQuizService.getRankedParticipants(q));
    return q;
  }, [quizId]);

  // Initial load
  useEffect(() => {
    if (!quizId) { setPhase('not_found'); return; }

    let q = specialQuizService.getById(quizId);
    if (!q && snapshotParam) {
      q = specialQuizService.hydrateFromSnapshot(quizId, snapshotParam);
    }
    if (!q) { setPhase('not_found'); return; }
    setQuiz(q);
    setRanked(specialQuizService.getRankedParticipants(q));

    // Restore session if exists
    const stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      try {
        const parsed: GuestSession = JSON.parse(stored);
        if (parsed.quizId === quizId) {
          setGuestId(parsed.guestId);
          setGuestName(parsed.name);
          const alreadySubmitted = q.participants.find((p) => p.userId === parsed.guestId)?.submitted;
          if (alreadySubmitted) {
            submittedRef.current = true;
            if (q.status === 'ended') setPhase('results');
            else setPhase('submitted');
            return;
          }
          // Restore to appropriate phase
          if (q.status === 'ended') setPhase('ended_gate');
          else if (q.status === 'live') setPhase('quiz');
          else setPhase('lobby');
          return;
        }
      } catch {/* ignore */}
    }

    // No session — determine entry phase
    if (q.status === 'ended') setPhase('ended_gate');
    else setPhase('name_entry');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, snapshotParam]);

  // Polling
  useEffect(() => {
    if (phase === 'loading' || phase === 'not_found' || phase === 'ended_gate' || phase === 'results') return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      const q = refreshQuiz();
      if (!q) return;

      if (submittedRef.current && q.status === 'ended') {
        clearInterval(pollRef.current!);
        setPhase('results');
        return;
      }
      if (phase === 'lobby' && q.status === 'live') {
        setPhase('quiz');
        return;
      }
      if (phase === 'lobby' && q.status === 'ended') {
        clearInterval(pollRef.current!);
        setPhase('ended_gate');
      }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleJoin = (name: string) => {
    const { id: gId } = getOrCreateGuestId(name);
    setGuestId(gId);
    setGuestName(name);

    const result = specialQuizService.join(quizId, { id: gId, name });
    if (result.status === 'not_found') { setPhase('not_found'); return; }
    if (result.status === 'ended') { setPhase('ended_gate'); setQuiz(result.quiz); return; }

    setQuiz(result.quiz);
    setPhase(result.quiz.status === 'live' ? 'quiz' : 'lobby');
  };

  const handleQuizSubmit = (answers: Record<string, string>, timeTaken: number) => {
    submittedRef.current = true;
    const updated = specialQuizService.submit(quizId, guestId, answers, timeTaken);
    if (updated) {
      setQuiz(updated);
      setRanked(specialQuizService.getRankedParticipants(updated));
    }
    const fresh = specialQuizService.getById(quizId);
    if (fresh?.status === 'ended') setPhase('results');
    else setPhase('submitted');
  };

  // ── Render by phase ────────────────────────────────────────────────────────

  if (phase === 'loading') return <PhaseLoading />;
  if (phase === 'not_found') return <PhaseNotFound code={quizId} />;
  if (phase === 'ended_gate') return <PhaseEnded quiz={quiz!} ranked={ranked} />;
  if (phase === 'name_entry') return <PhaseNameEntry quiz={quiz!} onJoin={handleJoin} />;
  if (phase === 'submitted') return <PhaseSubmitted />;
  if (phase === 'results') return <PhaseResults quiz={quiz!} guestId={guestId} ranked={ranked} />;

  if (phase === 'lobby') {
    return <PhaseLobby quiz={quiz!} guestName={guestName} />;
  }

  if (phase === 'quiz') {
    return <PhaseQuiz quiz={quiz!} onSubmit={handleQuizSubmit} />;
  }

  return <PhaseLoading />;
}
