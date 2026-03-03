import { cn } from '@/utils/helpers';

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id,
}: ToggleProps) {
  const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  const trackSize = size === 'sm' ? 'w-8 h-5' : 'w-11 h-6';
  const thumbSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const thumbTranslate = size === 'sm'
    ? checked ? 'translate-x-3.5' : 'translate-x-0.5'
    : checked ? 'translate-x-5.5' : 'translate-x-0.5';

  return (
    <label
      htmlFor={toggleId}
      className={cn('flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}
    >
      <div className="relative mt-0.5 shrink-0">
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            'rounded-full transition-colors duration-200',
            trackSize,
            checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600',
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200',
            thumbSize,
            thumbTranslate,
          )}
        />
      </div>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-[var(--text)]">{label}</p>}
          {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}
