/**
 * Pure Stage 1 Presale countdown logic (1 month + 2 weeks = 44 days).
 * Deterministic UTC anchor + initial SSR snapshot prevent React hydration mismatches.
 */

export const STAGE_1_MONTHS_DAYS = 30;
export const STAGE_1_WEEKS_DAYS = 14;
export const STAGE_1_DURATION_DAYS = STAGE_1_MONTHS_DAYS + STAGE_1_WEEKS_DAYS; // 44 days

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Anchor timestamp: 2026-11-26T01:57:28Z (2026-11-25 17:57:28 PST).
 * Stage 1 ends exactly 44 days (1 month + 2 weeks) later: 2027-01-09T01:57:28Z.
 */
export const STAGE_1_START_MS = Date.UTC(2026, 10, 26, 1, 57, 28);
export const STAGE_1_END_MS = STAGE_1_START_MS + STAGE_1_DURATION_DAYS * MS_PER_DAY;

export interface PresaleCountdownSnapshot {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

/**
 * Deterministic SSR & initial client hydration snapshot (exact 1m 2w duration).
 * Client swaps to live remaining time after hydration inside useEffect.
 */
export const INITIAL_COUNTDOWN_SNAPSHOT: PresaleCountdownSnapshot = {
  days: STAGE_1_DURATION_DAYS,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: false,
};

/**
 * Computes remaining Stage 1 presale time from `nowMs` until `endMs`.
 * Clamps to 0 when expired and never produces negative units.
 */
export function computePresaleCountdown(
  nowMs: number,
  endMs: number = STAGE_1_END_MS,
): PresaleCountdownSnapshot {
  if (!Number.isFinite(nowMs) || !Number.isFinite(endMs)) {
    return INITIAL_COUNTDOWN_SNAPSHOT;
  }

  const remainingMs = Math.max(0, endMs - nowMs);
  if (remainingMs === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const days = Math.floor(remainingMs / MS_PER_DAY);
  const hours = Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((remainingMs % MS_PER_MINUTE) / MS_PER_SECOND);

  return { days, hours, minutes, seconds, expired: false };
}

/**
 * Formats a countdown unit as a zero-padded 2-digit string (e.g. 4 -> "04", 44 -> "44").
 */
export function formatCountdownUnit(value: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return safe < 10 ? `0${safe}` : String(safe);
}
