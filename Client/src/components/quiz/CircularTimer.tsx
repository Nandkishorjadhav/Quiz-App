import { cn } from '@/utils/helpers';
import { formatTime } from '@/utils/helpers';

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularTimer({
  timeLeft,
  totalTime,
  size = 80,
  strokeWidth = 6,
  className,
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = timeLeft / totalTime;
  const dashOffset = circumference * (1 - percentage);

  const isWarning = percentage <= 0.4;
  const isDanger = percentage <= 0.2;

  const trackColor = isDanger
    ? '#ef4444'
    : isWarning
    ? '#f97316'
    : '#6366f1';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        isDanger && 'animate-pulse-ring rounded-full',
        className,
      )}
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
      aria-live="polite"
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        <span
          className={cn(
            'font-bold tabular-nums leading-none',
            size >= 80 ? 'text-base' : 'text-sm',
            isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-[var(--text)]',
          )}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}
