export interface CounterFrame {
  value: number;
  blurPx: number;
  opacity: number;
  scale: number;
  done: boolean;
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function easeOutQuart(t: number): number {
  const clamped = clamp01(t);
  return 1 - Math.pow(1 - clamped, 4);
}

/**
 * Computes the animated counter value and soft motion-blur / opacity / scale
 * properties for a token reward count-up reveal.
 *
 * - At t = 0: starts at 0 with soft blur (6px) and subtle fade-in
 * - Mid-flight: rapid count-up with gentle motion blur smoothly tapering off
 * - At t >= 1: locks sharply to the exact integer target with 0px blur
 */
export function computeCounterState(
  elapsedMs: number,
  durationMs: number,
  target: number,
): CounterFrame {
  const safeTarget = Number.isFinite(target) ? Math.max(0, Math.round(target)) : 0;
  if (durationMs <= 0 || elapsedMs >= durationMs) {
    return {
      value: safeTarget,
      blurPx: 0,
      opacity: 1,
      scale: 1,
      done: true,
    };
  }

  const rawProgress = clamp01(elapsedMs / durationMs);
  const eased = easeOutQuart(rawProgress);
  const value = Math.round(safeTarget * eased);

  // Soft motion blur peaks during initial rapid digit spin and clears before settling
  const blurProgress = clamp01(rawProgress / 0.85);
  const remainingBlur = Math.pow(1 - blurProgress, 1.8);
  const blurPx = Number((remainingBlur * 6).toFixed(2));

  const opacity = Number((0.25 + 0.75 * clamp01(rawProgress / 0.35)).toFixed(3));
  const scale = Number((1 + (1 - eased) * 0.06).toFixed(4));

  return {
    value,
    blurPx,
    opacity,
    scale,
    done: false,
  };
}
