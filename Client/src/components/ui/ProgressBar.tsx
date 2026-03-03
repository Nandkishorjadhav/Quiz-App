import { cn } from '@/utils/helpers';

interface ProgressBarProps {
  value: number;        // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  height?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  gradientBar?: boolean;
  className?: string;
}

const heightMap = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

const colorMap = {
  primary: 'from-primary-400 to-primary-600',
  success: 'from-emerald-400 to-emerald-600',
  warning: 'from-yellow-400 to-orange-500',
  danger: 'from-red-400 to-red-600',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  height = 'md',
  color = 'primary',
  gradientBar = true,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-semibold text-[var(--text)]">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
          heightMap[height],
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={cn(
            'h-full rounded-full progress-bar-fill',
            gradientBar ? `bg-gradient-to-r ${colorMap[color]}` : `bg-primary-500`,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
