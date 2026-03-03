import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { motion } from 'framer-motion';

export default function MainLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <Navbar />
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
        >
          {children ?? <Outlet />}
        </motion.div>
      </main>

      <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--text-muted)]">
        QuizMaster Pro &copy; {new Date().getFullYear()} — Built with React + TypeScript
      </footer>
    </div>
  );
}
