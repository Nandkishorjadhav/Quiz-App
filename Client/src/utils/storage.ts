/** Type-safe localStorage wrapper */

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn('localStorage write failed:', key);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'qm_auth_token',
  AUTH_USER: 'qm_auth_user',
  THEME: 'qm_theme',
  QUIZ_RESULTS: 'qm_results',
  LEADERBOARD: 'qm_leaderboard',
  CUSTOM_QUESTIONS: 'qm_custom_questions',
  SOUND_ENABLED: 'qm_sound',
  CUSTOM_CATEGORIES: 'qm_custom_categories',
  SPECIAL_QUIZZES: 'qm_special_quizzes',
} as const;
