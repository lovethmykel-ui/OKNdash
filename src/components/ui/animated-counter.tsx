'use client';

import { useEffect, useState } from 'react';
import { computeCounterFrame } from '@/lib/counter';
import { formatPoints } from '@/lib/utils';

interface AnimatedTokenCounterProps {
  target: number;
  prefix?: string;
  durationMs?: number;
  className?: string;
}

/**
 * Counts up smoothly from 0 to `target` with a soft motion-blur reveal
 * that sharpens into crisp focus as the final number settles.
 */
export function AnimatedTokenCounter({
  target,
  prefix = '+',
  durationMs = 1050,
  className,
}: AnimatedTokenCounterProps) {
  const safeTarget = Math.max(0, Math.round(target));
  const [frame, setFrame] = useState(() => computeCounterFrame(0, safeTarget));

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (prefersReduced || safeTarget === 0) {
        setFrame(computeCounterFrame(1, safeTarget));
        return;
      }
      if (startTime === null) startTime = now;
      const rawProgress = Math.min(1, (now - startTime) / durationMs);
      setFrame(computeCounterFrame(rawProgress, safeTarget));
      if (rawProgress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [safeTarget, durationMs]);

  return (
    <span
      className={className}
      aria-label={`${prefix}${formatPoints(safeTarget)}`}
      style={{
        display: 'inline-block',
        filter: frame.blurPx > 0.05 ? `blur(${frame.blurPx}px)` : 'none',
        transform: frame.scale !== 1 ? `scale(${frame.scale})` : 'none',
        opacity: frame.opacity,
        transformOrigin: 'center center',
        willChange: frame.blurPx > 0 ? 'filter, transform, opacity' : 'auto',
      }}
    >
      {prefix}
      {formatPoints(frame.value)}
    </span>
  );
}

export { AnimatedTokenCounter as AnimatedCounter };

