import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface UseTabSwitchOptions {
  enabled: boolean;
  maxWarnings?: number;
  onExceed?: () => void;
}

export function useTabSwitch({ enabled, maxWarnings = 3, onExceed }: UseTabSwitchOptions) {
  const warnCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        warnCount.current += 1;
        if (warnCount.current >= maxWarnings) {
          toast.error('Quiz auto‑submitted — exceeded tab switch limit!', { duration: 5000 });
          onExceed?.();
        } else {
          toast.error(
            `Warning ${warnCount.current}/${maxWarnings}: Do not switch tabs during the quiz!`,
            { duration: 3000 },
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled, maxWarnings, onExceed]);
}
