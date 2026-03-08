

import type { ApiResponse, LoginCredentials, SignupCredentials, User } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/helpers';

const FAKE_DELAY = 600; // ms — simulates network latency

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// Seed a demo admin + student account if none exist, and migrate stale names
function seedDemoAccounts(): void {
  const existing = storage.get<User[]>('qm_all_users') ?? [];

  // Migrate: if demo student still has old name, update it
  if (existing.length > 0) {
    const migrated = existing.map((u) =>
      u.id === 'user-demo-student' && (u.name === 'Alex Student' || u.name === 'Alex')
        ? { ...u, name: 'Nandu Student' }
        : u
    );
    storage.set('qm_all_users', migrated);

    // Also update the currently logged-in user if it's the stale demo account
    const loggedIn = storage.get<User>(STORAGE_KEYS.AUTH_USER);
    if (loggedIn?.id === 'user-demo-student' && (loggedIn.name === 'Alex Student' || loggedIn.name === 'Alex')) {
      storage.set(STORAGE_KEYS.AUTH_USER, { ...loggedIn, name: 'Nandu Student' });
    }
    return;
  }

  const demo: User[] = [
    {
      id: 'user-demo-student',
      name: 'Nandu Student',
      email: 'student@demo.com',
      role: 'student',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user-demo-admin',
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];
  storage.set('qm_all_users', demo);
  // Store passwords separately (never do this in production)
  storage.set('qm_user_passwords', {
    'student@demo.com': 'Student123',
    'admin@demo.com': 'Admin1234',
  });
}

seedDemoAccounts();

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    await delay(FAKE_DELAY);

    const users = storage.get<User[]>('qm_all_users') ?? [];
    const passwords = storage.get<Record<string, string>>('qm_user_passwords') ?? {};

    const user = users.find((u) => u.email === credentials.email);
    if (!user || passwords[credentials.email] !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    storage.set(STORAGE_KEYS.AUTH_USER, user);
    return { data: user, message: 'Login successful', success: true };
  },

  async signup(credentials: SignupCredentials): Promise<ApiResponse<User>> {
    await delay(FAKE_DELAY);

    const users = storage.get<User[]>('qm_all_users') ?? [];
    const passwords = storage.get<Record<string, string>>('qm_user_passwords') ?? {};

    if (users.some((u) => u.email === credentials.email)) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: generateId(),
      name: credentials.name,
      email: credentials.email,
      role: credentials.role,
      createdAt: new Date().toISOString(),
    };

    storage.set('qm_all_users', [...users, newUser]);
    storage.set('qm_user_passwords', { ...passwords, [credentials.email]: credentials.password });
    storage.set(STORAGE_KEYS.AUTH_USER, newUser);

    return { data: newUser, message: 'Account created', success: true };
  },

  async logout(): Promise<void> {
    await delay(200);
    storage.remove(STORAGE_KEYS.AUTH_USER);
  },

  async getMe(): Promise<ApiResponse<User | null>> {
    await delay(100);
    const user = storage.get<User>(STORAGE_KEYS.AUTH_USER);
    return { data: user, message: 'OK', success: true };
  },
};
