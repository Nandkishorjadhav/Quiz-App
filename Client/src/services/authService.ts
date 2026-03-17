

import type { ApiResponse, LoginCredentials, SignupCredentials, User } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';

// Backend API URL
// Priority:
// 1) VITE_API_URL (explicit backend URL)
// 2) local dev fallback (localhost:5000)
// 3) production same-origin (useful when API is reverse-proxied)
const ENV_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE_URL = ENV_API_URL
  ? ENV_API_URL.replace(/\/$/, '')
  : import.meta.env.DEV
    ? 'http://localhost:5000'
    : window.location.origin;

// ─── API Client Helper ────────────────────────────────────────────────────────

/**
 * Make API request with auth token
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Unable to connect to backend API. Start server or set VITE_API_URL correctly.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP Error: ${response.status}`);
  }

  return data;
}

// ─── Auth Service ────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      const response = await apiRequest<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Store token and user
      storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      storage.set(STORAGE_KEYS.AUTH_USER, response.data);

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  },

  /**
   * Register new user
   */
  async signup(credentials: SignupCredentials): Promise<ApiResponse<User>> {
    try {
      const response = await apiRequest<any>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Store token and user
      storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      storage.set(STORAGE_KEYS.AUTH_USER, response.data);

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Signup failed');
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      storage.remove(STORAGE_KEYS.AUTH_USER);
    }
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<ApiResponse<User | null>> {
    try {
      const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        return {
          data: null,
          message: 'Not authenticated',
          success: false,
        };
      }

      const response = await apiRequest<any>('/api/auth/verify', {
        method: 'POST',
      });

      // Update stored user
      storage.set(STORAGE_KEYS.AUTH_USER, response.data);

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      // Token is invalid, clear storage
      storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      storage.remove(STORAGE_KEYS.AUTH_USER);

      return {
        data: null,
        message: 'Not authenticated',
        success: false,
      };
    }
  },

  /**
   * Get user profile with full details
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiRequest<any>('/api/users/profile', {
        method: 'GET',
      });

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch profile');
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: any): Promise<ApiResponse<User>> {
    try {
      const response = await apiRequest<any>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      // Update stored user
      storage.set(STORAGE_KEYS.AUTH_USER, response.data);

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  },

  /**
   * Get user's quiz results (only their own)
   */
  async getQuizResults(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiRequest<any>('/api/users/quiz-results', {
        method: 'GET',
      });

      return {
        data: response.data || [],
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch quiz results');
    }
  },

  /**
   * Save quiz result for current user
   */
  async saveQuizResult(quizData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiRequest<any>('/api/users/quiz-results', {
        method: 'POST',
        body: JSON.stringify(quizData),
      });

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to save quiz result');
    }
  },

  /**
   * Get user's quiz statistics (only their own)
   */
  async getQuizStats(): Promise<ApiResponse<any>> {
    try {
      const response = await apiRequest<any>('/api/users/quiz-stats', {
        method: 'GET',
      });

      return {
        data: response.data,
        message: response.message,
        success: response.success,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch quiz stats');
    }
  },
};
