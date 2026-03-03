import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shuffle an array (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Format seconds into mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Generate a UUID-like id */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Calculate score given correct, incorrect, and config */
export function calculateScore(
  correct: number,
  incorrect: number,
  pointsPerQ: number,
  negativeMarkValue: number,
  negativeMarking: boolean,
): number {
  const positive = correct * pointsPerQ;
  const penalty = negativeMarking ? incorrect * negativeMarkValue * pointsPerQ : 0;
  return Math.max(0, positive - penalty);
}

/** Capitalize a string */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Get a grade label from a percentage */
export function getGrade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'Excellent!', color: 'text-emerald-500' };
  if (pct >= 75) return { label: 'Great Job!', color: 'text-blue-500' };
  if (pct >= 50) return { label: 'Good Effort', color: 'text-yellow-500' };
  return { label: 'Keep Practicing', color: 'text-red-500' };
}

/** Deep clone with JSON (safe for plain objects) */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Truncate text with ellipsis */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
