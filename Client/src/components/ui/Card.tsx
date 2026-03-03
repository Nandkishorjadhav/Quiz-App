import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const padMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({
  glass = true,
  hover = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        glass && 'glass',
        !glass && 'bg-white dark:bg-gray-900/60 border border-[var(--border)]',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer',
        padMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
