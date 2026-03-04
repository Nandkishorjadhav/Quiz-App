/**
 * specialQuizService.ts
 *
 * Manages:
 *   • Custom categories created by admins (stored in localStorage)
 *   • Special / live quiz sessions (created by admin, joined by students)
 *
 * "Live" is simulated via localStorage + polling in the UI.
 * To swap to a real backend, replace storage reads/writes with API calls.
 */

import type {
  CustomCategoryMeta,
  SpecialQuiz,
  SpecialQuizParticipant,
  Difficulty,
  Question,
  User,
} from '@/types';
import { CATEGORIES } from '@/data/categories';
import { MOCK_QUESTIONS } from '@/data/questions';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { shuffle } from '@/utils/helpers';

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `QUIZ-${code}`;
}

function getAllStoredQuestions(): Question[] {
  const custom = storage.get<Question[]>(STORAGE_KEYS.CUSTOM_QUESTIONS) ?? [];
  return [...MOCK_QUESTIONS, ...custom];
}

// ── Custom Categories ──────────────────────────────────────────────────────────

export const categoryService = {
  getCustom(): CustomCategoryMeta[] {
    return storage.get<CustomCategoryMeta[]>(STORAGE_KEYS.CUSTOM_CATEGORIES) ?? [];
  },

  getAll() {
    const builtIn = CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      image: c.image,
      color: c.color,
      gradient: c.gradient,
      description: c.description,
      isCustom: false,
    }));
    const custom = this.getCustom().map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      image: undefined as string | undefined,
      color: c.color,
      gradient: c.gradient,
      description: c.description,
      isCustom: true,
    }));
    return [...builtIn, ...custom];
  },

  create(data: Omit<CustomCategoryMeta, 'id' | 'createdAt'>, adminId: string): CustomCategoryMeta {
    const existing = this.getCustom();
    const id = `custom-${data.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
    const entry: CustomCategoryMeta = {
      ...data,
      id,
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.CUSTOM_CATEGORIES, [...existing, entry]);
    return entry;
  },

  delete(id: string): void {
    const updated = this.getCustom().filter((c) => c.id !== id);
    storage.set(STORAGE_KEYS.CUSTOM_CATEGORIES, updated);
  },

  findById(id: string) {
    return this.getAll().find((c) => c.id === id) ?? null;
  },
};

// ── Special Quiz Service ───────────────────────────────────────────────────────

export const specialQuizService = {
  getAll(): SpecialQuiz[] {
    return storage.get<SpecialQuiz[]>(STORAGE_KEYS.SPECIAL_QUIZZES) ?? [];
  },

  getById(id: string): SpecialQuiz | null {
    return this.getAll().find((q) => q.id === id) ?? null;
  },

  save(quizzes: SpecialQuiz[]): void {
    storage.set(STORAGE_KEYS.SPECIAL_QUIZZES, quizzes);
  },

  update(quiz: SpecialQuiz): void {
    const all = this.getAll().map((q) => (q.id === quiz.id ? quiz : q));
    this.save(all);
  },

  /** Admin: create a new special quiz */
  create(
    data: {
      title: string;
      description?: string;
      category: string;
      difficulty: Difficulty;
      questionCount: number;
      timePerQuestion: number;
    },
    admin: User,
  ): SpecialQuiz {
    // Fetch questions for the category + difficulty
    const allQ = getAllStoredQuestions();
    let pool = allQ.filter(
      (q) => q.category === data.category && q.difficulty === data.difficulty,
    );
    if (pool.length === 0) {
      // Fallback: any difficulty in that category
      pool = allQ.filter((q) => q.category === data.category);
    }
    if (pool.length === 0) {
      // Last resort: any questions
      pool = allQ;
    }
    const questions = shuffle(pool).slice(0, data.questionCount);

    const quiz: SpecialQuiz = {
      id: generateCode(),
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      questions,
      timePerQuestion: data.timePerQuestion,
      status: 'waiting',
      createdBy: admin.id,
      createdByName: admin.name,
      createdAt: Date.now(),
      participants: [],
    };

    this.save([...this.getAll(), quiz]);
    return quiz;
  },

  /** Admin: start the quiz (status waiting → live) */
  start(id: string): SpecialQuiz | null {
    const quiz = this.getById(id);
    if (!quiz || quiz.status !== 'waiting') return null;
    const updated: SpecialQuiz = { ...quiz, status: 'live', startedAt: Date.now() };
    this.update(updated);
    return updated;
  },

  /** Admin: end the quiz (status live → ended) */
  end(id: string): SpecialQuiz | null {
    const quiz = this.getById(id);
    if (!quiz || quiz.status === 'ended') return null;
    const updated: SpecialQuiz = { ...quiz, status: 'ended', endedAt: Date.now() };
    this.update(updated);
    return updated;
  },

  /** Admin: delete */
  delete(id: string): void {
    this.save(this.getAll().filter((q) => q.id !== id));
  },

  /** Student: join a quiz by ID/code.
   *  Returns an enriched result object:
   *    status: 'not_found' | 'ended' | 'live' | 'joined' | 'already'
   *    quiz: the (possibly updated) SpecialQuiz, or undefined when not found
   *    already: true if the user was already a participant
   */
  join(
    id: string,
    user: User,
  ): { status: 'not_found'; quiz?: undefined; already?: undefined }
    | { status: 'ended' | 'live' | 'joined' | 'already'; quiz: SpecialQuiz; already: boolean } {
    const quiz = this.getById(id);
    if (!quiz) return { status: 'not_found' };
    if (quiz.status === 'ended') return { status: 'ended', quiz, already: false };

    const already = quiz.participants.some((p) => p.userId === user.id);
    if (already) {
      return { status: quiz.status === 'live' ? 'live' : 'already', quiz, already: true };
    }

    const participant: SpecialQuizParticipant = {
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      joinedAt: Date.now(),
      score: 0,
      maxScore: quiz.questions.reduce((s, q) => s + q.points, 0),
      percentage: 0,
      correctCount: 0,
      incorrectCount: 0,
      timeTaken: 0,
      answers: {},
      submitted: false,
    };

    const updated: SpecialQuiz = {
      ...quiz,
      participants: [...quiz.participants, participant],
    };
    this.update(updated);
    const statusResult = quiz.status === 'live' ? 'live' : 'joined';
    return { status: statusResult, quiz: updated, already: false };
  },

  /** Student: submit answers */
  submit(
    quizId: string,
    userId: string,
    answers: Record<string, string>,
    timeTaken: number,
  ): SpecialQuiz | null {
    const quiz = this.getById(quizId);
    if (!quiz) return null;

    let score = 0;
    let correct = 0;
    let incorrect = 0;
    for (const q of quiz.questions) {
      const selected = answers[q.id];
      if (!selected) continue;
      if (selected === q.correctOptionId) {
        score += q.points;
        correct++;
      } else {
        incorrect++;
      }
    }
    const maxScore = quiz.questions.reduce((s, q) => s + q.points, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const participants = quiz.participants.map((p) => {
      if (p.userId !== userId) return p;
      return {
        ...p,
        answers,
        score,
        maxScore,
        percentage,
        correctCount: correct,
        incorrectCount: incorrect,
        timeTaken,
        completedAt: Date.now(),
        submitted: true,
      };
    });

    const updated: SpecialQuiz = { ...quiz, participants };
    this.update(updated);
    return updated;
  },

  /** Get ranked participants (sorted by score desc, then timeTaken asc) */
  getRankedParticipants(quiz: SpecialQuiz): (SpecialQuizParticipant & { rank: number })[] {
    const submitted = quiz.participants
      .filter((p) => p.submitted)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTaken - b.timeTaken;
      });
    return submitted.map((p, i) => ({ ...p, rank: i + 1 }));
  },
};
