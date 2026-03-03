import type { QuestionState } from '@/types';
import { cn } from '@/utils/helpers';
import { Bookmark, Flag } from 'lucide-react';

interface NavigationGridProps {
  questionStates: QuestionState[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function NavigationGrid({ questionStates, currentIndex, onNavigate }: NavigationGridProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Question Navigator</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary-500" /> Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-600" /> Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-400" /> Marked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-yellow-400" /> Bookmarked
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {questionStates.map((qs, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = qs.selectedOptionId !== null && qs.status !== 'marked' && qs.status !== 'bookmarked';
          const isMarked = qs.status === 'marked';
          const isBookmarked = qs.status === 'bookmarked';

          return (
            <button
              key={qs.questionId}
              onClick={() => onNavigate(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'relative w-full aspect-square rounded-lg text-xs font-bold transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                isCurrent && 'ring-2 ring-primary-500 ring-offset-1',
                isMarked && 'bg-orange-400 text-white',
                isBookmarked && 'bg-yellow-400 text-white',
                isAnswered && !isMarked && !isBookmarked && 'bg-primary-500 text-white',
                !isAnswered && !isMarked && !isBookmarked && 'bg-gray-100 dark:bg-gray-700 text-[var(--text)]',
              )}
            >
              {i + 1}
              {isMarked && (
                <Flag className="absolute top-0 right-0 w-2.5 h-2.5 -translate-y-0.5 translate-x-0.5" />
              )}
              {isBookmarked && (
                <Bookmark className="absolute top-0 right-0 w-2.5 h-2.5 -translate-y-0.5 translate-x-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-base font-bold text-primary-500">
            {questionStates.filter((s) => s.selectedOptionId !== null).length}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Answered</p>
        </div>
        <div>
          <p className="text-base font-bold text-orange-400">
            {questionStates.filter((s) => s.status === 'marked').length}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Marked</p>
        </div>
        <div>
          <p className="text-base font-bold text-[var(--text-muted)]">
            {questionStates.filter((s) => s.selectedOptionId === null).length}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Pending</p>
        </div>
      </div>
    </div>
  );
}
