import { API_BASE_URL } from './config';
import { storage, STORAGE_KEYS } from '@/utils/storage';

const API_URL = `${API_BASE_URL}/api/quiz`;

export async function generateQuiz(topic: string, difficulty: string, numberOfQuestions: number) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      topic,
      difficulty,
      numberOfQuestions,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to generate quiz');
  }

  return data.data;
}

export async function getQuiz(quizId: string) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${API_URL}/${quizId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch quiz');
  }

  return data.data;
}

export async function submitQuiz(
  quizId: string,
  topic: string,
  difficulty: string,
  answers: Array<{ questionId: number | string; selectedAnswer: string }>,
  timeTaken: number
) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      quizId,
      topic,
      difficulty,
      answers,
      timeTaken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit quiz');
  }

  return data.data;
}

export async function getQuizHistory(userId: number | string, filters: { limit?: number; topic?: string; difficulty?: string } = {}) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const params = new URLSearchParams();
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.topic) params.append('topic', filters.topic);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);

  const response = await fetch(`${API_URL}/history/${userId}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch quiz history');
  }

  return data.data;
}

export async function getLeaderboard(filters: { limit?: number; topic?: string; difficulty?: string } = {}) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const params = new URLSearchParams();
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.topic) params.append('topic', filters.topic);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);

  const response = await fetch(`${API_URL}/leaderboard?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch leaderboard');
  }

  return data.data;
}

export async function getUserStats(userId: number | string) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${API_URL}/stats/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user statistics');
  }

  return data.data;
}

export async function createManualQuiz(topic: string, difficulty: string, questions: any[]) {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }

  const response = await fetch(`${API_URL}/manual/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      topic,
      difficulty,
      questions,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create quiz');
  }

  return data.data;
}

export default {
  generateQuiz,
  getQuiz,
  submitQuiz,
  getQuizHistory,
  getLeaderboard,
  getUserStats,
  createManualQuiz,
};
