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

    // Note: Leaderboard is now fetched from backend API
    // Do not add to localStorage leaderboard anymore

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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
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

      // Format backend response to match frontend format
      const formatted: LeaderboardEntry[] = data.data.map((entry: any) => ({
        id: entry.userId.toString(),
        userId: entry.userId,
        userName: entry.userName,
        category: entry.category,
        difficulty: entry.difficulty,
        score: entry.score,
        percentage: entry.percentage,
        timeTaken: entry.totalTimeSpent || 0,
        completedAt: entry.lastAttemptedAt || new Date().toISOString(),
      }));

      return { data: formatted, message: 'OK', success: true };
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Fallback to empty leaderboard on error
      return { data: [], message: 'Failed to fetch leaderboard', success: false };
    }
  },
};
