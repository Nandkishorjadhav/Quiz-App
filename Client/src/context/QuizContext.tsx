import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  Question,
  QuestionState,
  QuestionStatus,
  QuizConfig,
  QuizResult,
  QuizSession,
} from '@/types';
import { shuffle, generateId } from '@/utils/helpers';
import { useAuth } from './AuthContext';

// ─── Actions ─────────────────────────────────────────────────────────────────

type QuizAction =
  | { type: 'START_QUIZ'; payload: { config: QuizConfig; questions: Question[] } }
  | { type: 'SELECT_OPTION'; payload: { questionId: string; optionId: string } }
  | { type: 'NAVIGATE'; payload: number }
  | { type: 'TOGGLE_MARK'; payload: string }
  | { type: 'TOGGLE_BOOKMARK'; payload: string }
  | { type: 'TICK_TIME'; payload: string }    // questionId — increment timeSpent
  | { type: 'SUBMIT_QUIZ' }
  | { type: 'RESET_QUIZ' };

// ─── State ────────────────────────────────────────────────────────────────────

interface QuizContextState {
  session: QuizSession | null;
  result: QuizResult | null;
}

const initial: QuizContextState = { session: null, result: null };

function buildQuestionStates(questions: Question[]): QuestionState[] {
  return questions.map((q) => ({
    questionId: q.id,
    selectedOptionId: null,
    status: 'unanswered' as QuestionStatus,
    timeSpent: 0,
  }));
}

function quizReducer(state: QuizContextState, action: QuizAction): QuizContextState {
  switch (action.type) {
    case 'START_QUIZ': {
      const { config, questions } = action.payload;
      const qs = config.shuffleQuestions ? shuffle(questions) : questions;
      const withShuffledOpts = config.shuffleOptions
        ? qs.map((q) => ({ ...q, options: shuffle(q.options) }))
        : qs;

      return {
        session: {
          config,
          questions: withShuffledOpts,
          questionStates: buildQuestionStates(withShuffledOpts),
          currentIndex: 0,
          startTime: Date.now(),
          endTime: null,
          isSubmitted: false,
        },
        result: null,
      };
    }

    case 'SELECT_OPTION': {
      if (!state.session) return state;
      const { questionId, optionId } = action.payload;

      return {
        ...state,
        session: {
          ...state.session,
          questionStates: state.session.questionStates.map((qs) =>
            qs.questionId === questionId
              ? { ...qs, selectedOptionId: optionId, status: 'answered' as QuestionStatus }
              : qs,
          ),
        },
      };
    }

    case 'NAVIGATE': {
      if (!state.session) return state;
      return {
        ...state,
        session: { ...state.session, currentIndex: action.payload },
      };
    }

    case 'TOGGLE_MARK': {
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          questionStates: state.session.questionStates.map((qs) =>
            qs.questionId === action.payload
              ? {
                  ...qs,
                  status:
                    qs.status === 'marked'
                      ? qs.selectedOptionId
                        ? ('answered' as QuestionStatus)
                        : ('unanswered' as QuestionStatus)
                      : ('marked' as QuestionStatus),
                }
              : qs,
          ),
        },
      };
    }

    case 'TOGGLE_BOOKMARK': {
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          questionStates: state.session.questionStates.map((qs) =>
            qs.questionId === action.payload
              ? {
                  ...qs,
                  status:
                    qs.status === 'bookmarked'
                      ? qs.selectedOptionId
                        ? ('answered' as QuestionStatus)
                        : ('unanswered' as QuestionStatus)
                      : ('bookmarked' as QuestionStatus),
                }
              : qs,
          ),
        },
      };
    }

    case 'TICK_TIME': {
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          questionStates: state.session.questionStates.map((qs) =>
            qs.questionId === action.payload
              ? { ...qs, timeSpent: qs.timeSpent + 1 }
              : qs,
          ),
        },
      };
    }

    case 'SUBMIT_QUIZ': {
      if (!state.session) return state;
      return {
        ...state,
        session: { ...state.session, endTime: Date.now(), isSubmitted: true },
      };
    }

    case 'RESET_QUIZ':
      return initial;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface QuizContextValue extends QuizContextState {
  startQuiz: (config: QuizConfig, questions: Question[]) => void;
  selectOption: (questionId: string, optionId: string) => void;
  navigate: (index: number) => void;
  toggleMark: (questionId: string) => void;
  toggleBookmark: (questionId: string) => void;
  tickTime: (questionId: string) => void;
  submitQuiz: () => QuizResult | null;
  resetQuiz: () => void;
  currentQuestion: Question | null;
  currentState: QuestionState | null;
  progress: number;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initial);
  const { user } = useAuth();

  const startQuiz = useCallback(
    (config: QuizConfig, questions: Question[]) => {
      dispatch({ type: 'START_QUIZ', payload: { config, questions } });
    },
    [],
  );

  const selectOption = useCallback((questionId: string, optionId: string) => {
    dispatch({ type: 'SELECT_OPTION', payload: { questionId, optionId } });
  }, []);

  const navigate = useCallback((index: number) => {
    dispatch({ type: 'NAVIGATE', payload: index });
  }, []);

  const toggleMark = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_MARK', payload: questionId });
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: questionId });
  }, []);

  const tickTime = useCallback((questionId: string) => {
    dispatch({ type: 'TICK_TIME', payload: questionId });
  }, []);

  const submitQuiz = useCallback((): QuizResult | null => {
    if (!state.session) return null;
    dispatch({ type: 'SUBMIT_QUIZ' });

    const { session } = state;
    const { config, questions, questionStates, startTime } = session;
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);

    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    const questionResults = questions.map((q) => {
      const qs = questionStates.find((s) => s.questionId === q.id)!;
      const isCorrect = qs.selectedOptionId === q.correctOptionId;
      if (!qs.selectedOptionId) skipped++;
      else if (isCorrect) correct++;
      else incorrect++;

      return {
        question: q,
        selectedOptionId: qs.selectedOptionId,
        isCorrect,
        // Fixed scoring rule: each question carries 1 mark.
        pointsEarned: isCorrect ? 1 : 0,
        timeSpent: qs.timeSpent,
      };
    });

    // Max marks = number of questions (5 questions => 5 marks, 10 => 10, etc.)
    const maxScore = questions.length;
    const totalScore = correct;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const result: QuizResult = {
      id: generateId(),
      userId: user?.id ?? 'guest',
      config,
      questionResults,
      totalScore,
      maxScore,
      percentage,
      correctCount: correct,
      incorrectCount: incorrect,
      skippedCount: skipped,
      timeTaken,
      completedAt: new Date().toISOString(),
    };

    return result;
  }, [state, user]);

  const resetQuiz = useCallback(() => {
    dispatch({ type: 'RESET_QUIZ' });
  }, []);

  const currentQuestion = state.session
    ? state.session.questions[state.session.currentIndex] ?? null
    : null;

  const currentState = state.session && currentQuestion
    ? state.session.questionStates.find((s) => s.questionId === currentQuestion.id) ?? null
    : null;

  const progress = state.session
    ? Math.round(
        (state.session.questionStates.filter((s) => s.selectedOptionId !== null).length /
          state.session.questions.length) *
          100,
      )
    : 0;

  return (
    <QuizContext.Provider
      value={{
        ...state,
        startQuiz,
        selectOption,
        navigate,
        toggleMark,
        toggleBookmark,
        tickTime,
        submitQuiz,
        resetQuiz,
        currentQuestion,
        currentState,
        progress,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}
