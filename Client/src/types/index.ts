// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

// ─── Quiz Domain ──────────────────────────────────────────────────────────────

export type Category = 'java' | 'python' | 'cpp' | 'javascript' | 'sql' | 'react' | 'typescript' | 'dsa';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CategoryMeta {
  id: Category;
  label: string;
  icon: string;
  image?: string;   // path to actual logo asset
  color: string;
  gradient: string;
  description: string;
}

export interface Option {
  id: string;        // 'a' | 'b' | 'c' | 'd'
  text: string;
}

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  text: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
  points: number;
  tags?: string[];
}

// ─── Quiz Config ──────────────────────────────────────────────────────────────

export interface QuizConfig {
  category: Category;
  difficulty: Difficulty;
  totalQuestions: number;
  timePerQuestion: number;  // seconds
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarking: boolean;
  negativeMarkValue: number; // default 0.25
}

// ─── Quiz Session State ───────────────────────────────────────────────────────

export type QuestionStatus = 'unanswered' | 'answered' | 'marked' | 'bookmarked';

export interface QuestionState {
  questionId: string;
  selectedOptionId: string | null;
  status: QuestionStatus;
  timeSpent: number; // seconds
}

export interface QuizSession {
  config: QuizConfig;
  questions: Question[];
  questionStates: QuestionState[];
  currentIndex: number;
  startTime: number;   // Date.now()
  endTime: number | null;
  isSubmitted: boolean;
}

// ─── Result ───────────────────────────────────────────────────────────────────

export interface QuestionResult {
  question: Question;
  selectedOptionId: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
}

export interface QuizResult {
  id: string;
  userId: string;
  config: QuizConfig;
  questionResults: QuestionResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  timeTaken: number; // seconds
  completedAt: string;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  category: Category;
  difficulty: Difficulty;
  score: number;
  percentage: number;
  timeTaken: number;
  completedAt: string;
}

// ─── Custom Category (admin-created) ─────────────────────────────────────────

export interface CustomCategoryMeta {
  id: string;           // e.g. "custom-rust", "custom-go"
  label: string;
  icon: string;         // emoji
  color: string;        // hex for accent
  gradient: string;     // tailwind gradient classes
  description: string;
  createdBy: string;    // admin userId
  createdAt: string;    // ISO timestamp
}

// ─── Special Quiz (live exam created by admin) ────────────────────────────────

export type SpecialQuizStatus = 'waiting' | 'live' | 'ended';

export interface SpecialQuizParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  joinedAt: number;
  completedAt?: number;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  timeTaken: number;         // seconds
  answers: Record<string, string>; // questionId → selectedOptionId
  submitted: boolean;
}

export interface SpecialQuiz {
  id: string;               // also serves as join code (e.g. "QUIZ-A3F9")
  title: string;
  description?: string;
  category: string;         // can be built-in or custom category id
  difficulty: Difficulty;
  questions: Question[];
  timePerQuestion: number;
  status: SpecialQuizStatus;
  createdBy: string;        // admin userId
  createdByName: string;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  participants: SpecialQuizParticipant[];
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface QuestionFormData {
  category: Category;
  difficulty: Difficulty;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  points: number;
  tags: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

// ─── API abstraction (for future backend) ─────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
