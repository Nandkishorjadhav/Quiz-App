import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useTimer({ initialSeconds, onExpire, autoStart = true }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  // resetKey increments on every reset() call so the interval useEffect always
  // re-runs — even when isRunning was already true (React skips same-value setState).
  const [resetKey, setResetKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(
    (newSeconds?: number) => {
      clear();
      setTimeLeft(newSeconds ?? initialSeconds);
      setIsRunning(true);          // always restart
      setResetKey((k) => k + 1);  // force interval useEffect to re-run
    },
    [initialSeconds],
  );

  useEffect(() => {
    if (!isRunning) { clear(); return; }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clear();
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clear;
  // resetKey is intentionally included so the interval is recreated on every reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, resetKey]);

  const percentage = Math.round((timeLeft / initialSeconds) * 100);

  return { timeLeft, isRunning, percentage, start, pause, reset };
}
