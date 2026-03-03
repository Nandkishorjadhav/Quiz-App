import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import type { AuthState, LoginCredentials, SignupCredentials, User } from '@/types';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

// ─── State & Actions ──────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (creds: LoginCredentials) => Promise<void>;
  signup: (creds: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate session from localStorage
  useEffect(() => {
    authService
      .getMe()
      .then((res) => dispatch({ type: 'SET_USER', payload: res.data }))
      .catch(() => dispatch({ type: 'SET_USER', payload: null }));
  }, []);

  const login = async (creds: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authService.login(creds);
      dispatch({ type: 'SET_USER', payload: res.data });
      toast.success(`Welcome back, ${res.data.name}!`);
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw err;
    }
  };

  const signup = async (creds: SignupCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authService.signup(creds);
      dispatch({ type: 'SET_USER', payload: res.data });
      toast.success(`Account created! Welcome, ${res.data.name}!`);
    } catch (err) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw err;
    }
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
