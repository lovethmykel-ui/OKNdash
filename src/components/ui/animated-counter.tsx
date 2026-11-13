'use client';

import { useEffect, useState } from 'react';
import { computeCounterFrame } from '@/lib/counter';
import { formatPoints } from '@/lib/utils';

interface AnimatedTokenCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

function formatCounterNumber(scaledValue: number, decimals: number): string {
  if (decimals <= 0) {
    return formatPoints(Math.round(scaledValue));
  }
  const factor = Math.pow(10, decimals);
  const actual = scaledValue / factor;
  return actual.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Counts up smoothly from 0 to `target` with a soft blue glow and motion-blur
 * reveal that sharpens into crisp focus as the final number settles.
 * Re-runs automatically on mount, login/session changes, or target updates.
 */
export function AnimatedTokenCounter({
  target,
  prefix = '',
  suffix = '',
  decimals = 0,
  durationMs = 1150,
  className,
}: AnimatedTokenCounterProps) {
  const factor = decimals > 0 ? Math.pow(10, decimals) : 1;
  const scaledTarget = Math.max(0, Math.round((Number.isFinite(target) ? target : 0) * factor));
  const [runKey, setRunKey] = useState(0);
  const [frame, setFrame] = useState(() => computeCounterFrame(0, scaledTarget));

  useEffect(() => {
    const handleAuthOrLogin = () => {
      setRunKey((k) => k + 1);
    };
    window.addEventListener('okn:login', handleAuthOrLogin);
    window.addEventListener('focus', handleAuthOrLogin);
    return () => {
      window.removeEventListener('okn:login', handleAuthOrLogin);
      window.removeEventListener('focus', handleAuthOrLogin);
    };
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (prefersReduced || scaledTarget === 0) {
        setFrame(computeCounterFrame(1, scaledTarget));
        return;
      }
      if (startTime === null) startTime = now;
      const rawProgress = Math.min(1, (now - startTime) / durationMs);
      setFrame(computeCounterFrame(rawProgress, scaledTarget));
      if (rawProgress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [scaledTarget, durationMs, runKey]);

  const isAnimating = frame.easedProgress < 1 && frame.blurPx > 0.05;
  const blueGlowAlpha = Number(((1 - frame.easedProgress) * 0.78).toFixed(3));
  const blueGlowRadius = Math.max(4, Math.round(frame.blurPx * 3.4));

  return (
    <span
      className={className}
      aria-label={`${prefix}${formatCounterNumber(scaledTarget, decimals)}${suffix}`}
      style={{
        display: 'inline-block',
        filter: isAnimating
          ? `blur(${frame.blurPx}px) drop-shadow(0 0 ${blueGlowRadius}px rgba(9, 180, 255, ${blueGlowAlpha}))`
          : 'none',
        textShadow: isAnimating
          ? `0 0 ${blueGlowRadius}px rgba(56, 189, 248, ${blueGlowAlpha}), 0 0 ${Math.round(blueGlowRadius * 1.6)}px rgba(9, 180, 255, ${(blueGlowAlpha * 0.65).toFixed(3)})`
          : 'none',
        transform: frame.scale !== 1 ? `scale(${frame.scale})` : 'none',
        opacity: frame.opacity,
        transformOrigin: 'left center',
        transition: 'text-shadow 180ms ease-out',
        willChange: isAnimating ? 'filter, transform, opacity, text-shadow' : 'auto',
      }}
    >
      {prefix}
      {formatCounterNumber(frame.value, decimals)}
      {suffix}
    </span>
  );
}

export { AnimatedTokenCounter as AnimatedCounter };

