/**
 * quizService.ts
 *
 * Mock Quiz Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirrors REST API contract:
 *   GET  /api/quizzes/questions?category=&difficulty=&limit=
 *   POST /api/quizzes/results
 *   GET  /api/quizzes/results/:userId
 *   GET  /api/quizzes/leaderboard?category=
 *   POST /api/quizzes/questions          (admin — create)
 *   PUT  /api/quizzes/questions/:id      (admin — update)
 *   DELETE /api/quizzes/questions/:id    (admin — delete)
 *
 * To swap in a real backend, replace mock logic with axios/fetch calls.
 */

import type {
  ApiResponse,
  Category,
  Difficulty,
  LeaderboardEntry,
  PaginatedResponse,
  Question,
  QuizResult,
} from '@/types';
import { MOCK_QUESTIONS } from '@/data/questions';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { shuffle, generateId } from '@/utils/helpers';

const FAKE_DELAY = 400;
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const ENV_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE_URL = ENV_API_URL
  ? ENV_API_URL.replace(/\/$/, '')
  : import.meta.env.DEV
  ? 'http://localhost:5000'
  : window.location.origin;

function isGenericName(name?: string): boolean {
  if (!name) return true;
  const v = name.trim().toLowerCase();
  return v === 'user' || v.startsWith('player ');
}

function knownUserNames(): Map<string, string> {
  const map = new Map<string, string>();
  const authUser = storage.get<{ id: string; name: string }>(STORAGE_KEYS.AUTH_USER);
  const results = storage.get<QuizResult[]>(STORAGE_KEYS.QUIZ_RESULTS) ?? [];

  if (authUser?.id && authUser?.name) {
    map.set(String(authUser.id), authUser.name);
  }

  for (const r of results) {
    if (r.userId && r.userName && !isGenericName(r.userName)) {
      map.set(String(r.userId), r.userName);
    }
  }

  return map;
}

function buildLocalLeaderboard(category?: Category): LeaderboardEntry[] {
  const allResults = storage.get<QuizResult[]>(STORAGE_KEYS.QUIZ_RESULTS) ?? [];
  const filtered = category
    ? allResults.filter((r) => r.config.category === category)
    : allResults;

  if (filtered.length === 0) return [];

  const authUser = storage.get<{ id: string; name: string }>(STORAGE_KEYS.AUTH_USER);
  const names = knownUserNames();
  const byUser = new Map<string, LeaderboardEntry>();

  for (const r of filtered) {
    const existing = byUser.get(r.userId);
    const userName =
      (!isGenericName(r.userName) ? r.userName : undefined) ||
      names.get(String(r.userId)) ||
      (authUser?.id && String(authUser.id) === String(r.userId) ? authUser.name : undefined) ||
      'User';

    if (!existing) {
      byUser.set(r.userId, {
        id: r.userId,
        userId: r.userId,
        userName,
        category: r.config.category,
        difficulty: r.config.difficulty,
        score: r.totalScore,
        percentage: r.percentage,
        timeTaken: r.timeTaken,
        completedAt: r.completedAt,
      });
      continue;
    }

    // Keep best attempt as the leaderboard entry.
    const isBetter =
      r.percentage > existing.percentage ||
      (r.percentage === existing.percentage && r.timeTaken < existing.timeTaken);

    if (isBetter) {
      byUser.set(r.userId, {
        ...existing,
        category: r.config.category,
        difficulty: r.config.difficulty,
        score: r.totalScore,
        percentage: r.percentage,
        timeTaken: r.timeTaken,
        completedAt: r.completedAt,
      });
    }
  }

  return Array.from(byUser.values()).sort(
    (a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken,
  );
}

function getAllQuestions(): Question[] {
  const custom = storage.get<Question[]>(STORAGE_KEYS.CUSTOM_QUESTIONS) ?? [];
  return [...MOCK_QUESTIONS, ...custom];
}

export const quizService = {
  // ── Questions ──────────────────────────────────────────────────────────────

  async getQuestions(
    category: Category,
    difficulty: Difficulty,
    limit: number,
    shuffleQ = false,
  ): Promise<ApiResponse<Question[]>> {
    await delay(FAKE_DELAY);

    const all = getAllQuestions();

    // Primary pool: exact category + difficulty match
    let primary = all.filter(
      (q) => q.category === category && q.difficulty === difficulty,
    );

    if (shuffleQ) primary = shuffle(primary);

    let questions = primary.slice(0, limit);

    // Fallback: supplement from same category (other difficulties) when primary is insufficient
    if (questions.length < limit) {
      const usedIds = new Set(questions.map((q) => q.id));
      const supplementOrder: Difficulty[] =
        difficulty === 'easy'
          ? ['medium', 'hard']
          : difficulty === 'medium'
          ? ['easy', 'hard']
          : ['medium', 'easy'];

      for (const d of supplementOrder) {
        if (questions.length >= limit) break;
        let extra = all.filter(
          (q) => q.category === category && q.difficulty === d && !usedIds.has(q.id),
        );
        if (shuffleQ) extra = shuffle(extra);
        const needed = limit - questions.length;
        extra.slice(0, needed).forEach((q) => {
          usedIds.add(q.id);
          questions.push(q);
        });
      }
    }

    return { data: questions, message: 'OK', success: true };
  },

  async getAllQuestionsAdmin(
    category?: Category,
    difficulty?: Difficulty,
  ): Promise<PaginatedResponse<Question>> {
    await delay(FAKE_DELAY);

    let questions = getAllQuestions();
    if (category) questions = questions.filter((q) => q.category === category);
    if (difficulty) questions = questions.filter((q) => q.difficulty === difficulty);

    return {
      data: questions,
      message: 'OK',
      success: true,
      total: questions.length,
      page: 1,
      pageSize: 100,
    };
  },

  async createQuestion(q: Omit<Question, 'id'>): Promise<ApiResponse<Question>> {
    await delay(FAKE_DELAY);

    const newQ: Question = { ...q, id: generateId() };
    const custom = storage.get<Question[]>(STORAGE_KEYS.CUSTOM_QUESTIONS) ?? [];
    storage.set(STORAGE_KEYS.CUSTOM_QUESTIONS, [...custom, newQ]);

    return { data: newQ, message: 'Question created', success: true };
  },

  async updateQuestion(id: string, updated: Partial<Question>): Promise<ApiResponse<Question>> {
    await delay(FAKE_DELAY);

    const custom = storage.get<Question[]>(STORAGE_KEYS.CUSTOM_QUESTIONS) ?? [];
    const idx = custom.findIndex((q) => q.id === id);

    if (idx === -1) throw new Error('Question not found in custom bank');

    custom[idx] = { ...custom[idx], ...updated };
    storage.set(STORAGE_KEYS.CUSTOM_QUESTIONS, custom);

    return { data: custom[idx], message: 'Question updated', success: true };
  },

  async deleteQuestion(id: string): Promise<ApiResponse<null>> {
    await delay(FAKE_DELAY);

    const custom = storage.get<Question[]>(STORAGE_KEYS.CUSTOM_QUESTIONS) ?? [];
    storage.set(
      STORAGE_KEYS.CUSTOM_QUESTIONS,
      custom.filter((q) => q.id !== id),
    );

    return { data: null, message: 'Question deleted', success: true };
  },

  // ── Results ────────────────────────────────────────────────────────────────

  async saveResult(result: QuizResult): Promise<ApiResponse<QuizResult>> {
    await delay(FAKE_DELAY);

    const results = storage.get<QuizResult[]>(STORAGE_KEYS.QUIZ_RESULTS) ?? [];
    storage.set(STORAGE_KEYS.QUIZ_RESULTS, [...results, result]);

    // Sync to backend so global leaderboard can include this attempt.
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    if (token && result.userId !== 'guest') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/quiz-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: result.config.category,
            difficulty: result.config.difficulty,
            score: result.percentage,
            totalQuestions: result.maxScore,
            correctAnswers: result.correctCount,
            timeSpent: result.timeTaken,
          }),
        });

        if (!response.ok) {
          const txt = await response.text();
          console.error('Failed to sync result to backend:', response.status, txt);
        }
      } catch (error) {
        console.error('Failed to sync result to backend:', error);
      }
    }

    return { data: result, message: 'Result saved', success: true };
  },

  async getUserResults(userId: string): Promise<ApiResponse<QuizResult[]>> {
    await delay(FAKE_DELAY);

    const results = (storage.get<QuizResult[]>(STORAGE_KEYS.QUIZ_RESULTS) ?? []).filter(
      (r) => r.userId === userId,
    );

    return { data: results, message: 'OK', success: true };
  },

  async getLeaderboard(category?: Category): Promise<ApiResponse<LeaderboardEntry[]>> {
    try {
      const names = knownUserNames();
      const authUser = storage.get<{ id: string; name: string }>(STORAGE_KEYS.AUTH_USER);

      // Build query string
      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }
      params.append('limit', '50');

      const response = await fetch(
        `${API_BASE_URL}/api/users/leaderboard?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      // Normalize backend rows (which can contain multiple category/difficulty rows per user)
      // into one best row per user so all users are visible globally.
      const byUser = new Map<string, LeaderboardEntry>();

      for (const entry of data.data ?? []) {
        const key = String(entry.userId);
        const resolvedName =
          !isGenericName(entry.userName)
            ? entry.userName
            : names.get(key) || (authUser?.id && String(authUser.id) === key ? authUser.name : 'User');

        const row: LeaderboardEntry = {
          id: key,
          userId: entry.userId,
          userName: resolvedName,
          category: entry.category,
          difficulty: entry.difficulty,
          score: Number(entry.score) || Number(entry.percentage) || 0,
          percentage: Number(entry.percentage) || 0,
          timeTaken: Number(entry.totalTimeSpent) || 0,
          completedAt: entry.lastAttemptedAt || new Date().toISOString(),
        };

        const existing = byUser.get(key);
        if (!existing) {
          byUser.set(key, row);
          continue;
        }

        const better =
          row.percentage > existing.percentage ||
          (row.percentage === existing.percentage && row.timeTaken < existing.timeTaken);

        if (better) {
          byUser.set(key, row);
        }
      }

      const formatted = Array.from(byUser.values()).sort(
        (a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken,
      );

      if (formatted.length === 0) {
        const local = buildLocalLeaderboard(category);
        return { data: local, message: local.length ? 'OK (local fallback)' : 'OK', success: true };
      }

      return { data: formatted, message: 'OK', success: true };
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);

      // Fallback to local attempts so user still sees ranking data.
      const local = buildLocalLeaderboard(category);
      return {
        data: local,
        message: local.length ? 'OK (local fallback)' : 'Failed to fetch leaderboard',
        success: local.length > 0,
      };
    }
  },
};
