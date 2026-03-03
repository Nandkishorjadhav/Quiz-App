import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

/** Minimal full-screen layout for the active quiz — no navbar or footer */
export default function QuizLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] no-select">
      {children ?? <Outlet />}
    </div>
  );
}
