import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun, LogOut, LayoutDashboard, ShieldCheck, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-primary-500/30"
          >
            Q
          </motion.div>
          <span className="font-extrabold text-lg tracking-tight text-[var(--text)] group-hover:text-primary-500 transition-colors">
            QuizMaster <span className="text-primary-500">Pro</span>
          </span>
        </Link>

        {/* Nav links */}
        {isAuthenticated && (
          <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" />
            <NavLink to="/leaderboard" icon={<Trophy size={15} />} label="Leaderboard" />
            {user?.role === 'admin' && (
              <NavLink to="/admin" icon={<ShieldCheck size={15} />} label="Admin" />
            )}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              'hover:bg-black/5 dark:hover:bg-white/5',
              'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
          </button>

          {isAuthenticated && user ? (
            <>
              {/* User chip */}
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[var(--text)] leading-none">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] capitalize">{user.role}</p>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut size={15} />}
                aria-label="Sign out"
              >
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
    >
      {icon}
      {label}
    </Link>
  );
}
