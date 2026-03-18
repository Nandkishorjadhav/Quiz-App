import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Zap, Radio } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Sign In');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError('');
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const fillDemo = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setValue('email', 'student@demo.com');
      setValue('password', 'Student123');
    } else {
      setValue('email', 'admin@demo.com');
      setValue('password', 'Admin1234');
    }
  };

  return (
    <div className="glass rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/10">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Welcome back</h1>
        <p className="text-sm text-[var(--text-muted)]">Sign in to continue your learning journey</p>
      </div>

      {/* Demo quick-fill */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fillDemo('student')}
          className="flex-1 text-xs py-2 rounded-xl border border-[var(--border)] hover:bg-primary-50 dark:hover:bg-primary-900/20 text-[var(--text-muted)] hover:text-primary-600 transition-all"
        >
          🎓 Demo Student
        </button>
        <button
          type="button"
          onClick={() => fillDemo('admin')}
          className="flex-1 text-xs py-2 rounded-xl border border-[var(--border)] hover:bg-accent-500/10 text-[var(--text-muted)] hover:text-accent-500 transition-all"
        >
          🛡️ Demo Admin
        </button>
      </div>

      {/* Quick access to General Admin Panel */}
      <motion.button
        type="button"
        onClick={() => navigate('/general-admin')}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-2 border-violet-400/50 hover:border-violet-400 rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all"
      >
        <Radio size={16} className="text-violet-500" />
        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Create & Share Quiz (No Login)</span>
      </motion.button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500 text-center"
            role="alert"
          >
            {serverError}
          </motion.p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          leftIcon={<Zap size={16} />}
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
