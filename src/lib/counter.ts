export interface CounterFrame {
  value: number;
  easedProgress: number;
  blurPx: number;
  scale: number;
  opacity: number;
}

/**
 * Computes deterministic frame metrics for an ease-out token counter
 * with a soft blur effect that sharpens as the numbers land.
 */
export function computeCounterFrame(rawProgress: number, target: number): CounterFrame {
  const t = Math.min(1, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
  const safeTarget = Math.max(0, Math.round(Number.isFinite(target) ? target : 0));

  if (t >= 1) {
    return {
      value: safeTarget,
      easedProgress: 1,
      blurPx: 0,
      scale: 1,
      opacity: 1,
    };
  }

  // Smooth quartic-like ease-out (1 - (1 - t)^3.5)
  const eased = 1 - Math.pow(1 - t, 3.5);
  const value = Math.min(safeTarget, Math.round(safeTarget * eased));

  // Soft blur starts around 6px and resolves cleanly to 0px before completion
  const blurProgress = Math.min(1, t / 0.88);
  const blurPx = Number(((1 - Math.pow(blurProgress, 0.75)) * 6).toFixed(2));

  // Gentle settle scale from 0.94 -> 1.025 -> 1.0
  const scale =
    t < 0.7
      ? 0.94 + (t / 0.7) * 0.085
      : 1.025 - ((t - 0.7) / 0.3) * 0.025;

  const opacity = Math.min(1, 0.3 + t * 1.4);

  return {
    value,
    easedProgress: eased,
    blurPx,
    scale: Number(scale.toFixed(4)),
    opacity: Number(opacity.toFixed(3)),
  };
}
