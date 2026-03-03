import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, ShieldCheck } from 'lucide-react';
import { signupSchema, type SignupFormValues } from '@/utils/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/helpers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Role } from '@/types';

export default function SignupPage() {
  useDocumentTitle('Create Account');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'student' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormValues) => {
    setServerError('');
    try {
      await signup(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <div className="glass rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/10">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Create your account</h1>
        <p className="text-sm text-[var(--text-muted)]">Join thousands of learners today</p>
      </div>

      {/* Role selection */}
      <div>
        <p className="text-sm font-medium text-[var(--text)] mb-2">I am a…</p>
        <div className="grid grid-cols-2 gap-3">
          {((['student', 'admin'] as Role[])).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setValue('role', role)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                selectedRole === role
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-[var(--border)] hover:border-primary-300',
              )}
            >
              {role === 'student' ? (
                <GraduationCap
                  className={selectedRole === role ? 'text-primary-500' : 'text-[var(--text-muted)]'}
                  size={24}
                />
              ) : (
                <ShieldCheck
                  className={selectedRole === role ? 'text-primary-500' : 'text-[var(--text-muted)]'}
                  size={24}
                />
              )}
              <span
                className={cn(
                  'text-sm font-semibold capitalize',
                  selectedRole === role ? 'text-primary-600 dark:text-primary-300' : 'text-[var(--text-muted)]',
                )}
              >
                {role}
              </span>
            </button>
          ))}
        </div>
        {/* Hidden input for role */}
        <input type="hidden" {...register('role')} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          placeholder="Alex Johnson"
          leftIcon={<User size={15} />}
          error={errors.name?.message}
          autoComplete="name"
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          leftIcon={<Lock size={15} />}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
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

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  );
}
