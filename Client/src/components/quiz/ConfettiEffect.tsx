import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  /** Score percentage 0-100 — only fires if >= threshold */
  percentage?: number;
  threshold?: number;
}

export function ConfettiEffect({ trigger, percentage = 100, threshold = 75 }: ConfettiEffectProps) {
  useEffect(() => {
    if (!trigger || percentage < threshold) return;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.7 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [trigger, percentage, threshold]);

  return null;
}
