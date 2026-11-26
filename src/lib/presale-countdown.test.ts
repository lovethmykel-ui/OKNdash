import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_1_DURATION_DAYS,
  STAGE_1_START_MS,
  STAGE_1_END_MS,
  INITIAL_COUNTDOWN_SNAPSHOT,
  computePresaleCountdown,
  formatCountdownUnit,
} from './presale-countdown';

test('Stage 1 duration equals exactly 1 month (30d) + 2 weeks (14d) = 44 days', () => {
  assert.equal(STAGE_1_DURATION_DAYS, 44);
  assert.equal(STAGE_1_END_MS - STAGE_1_START_MS, 44 * 24 * 60 * 60 * 1000);
  assert.deepEqual(INITIAL_COUNTDOWN_SNAPSHOT, {
    days: 44,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });
});

test('computePresaleCountdown breaks down exact remaining days, hours, minutes, seconds', () => {
  const snapshot = computePresaleCountdown(STAGE_1_START_MS, STAGE_1_END_MS);
  assert.deepEqual(snapshot, {
    days: 44,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  // 12 days, 5 hours, 33 minutes, 9 seconds before end
  const offsetMs = ((12 * 24 + 5) * 3600 + 33 * 60 + 9) * 1000;
  const partial = computePresaleCountdown(STAGE_1_END_MS - offsetMs, STAGE_1_END_MS);
  assert.deepEqual(partial, {
    days: 12,
    hours: 5,
    minutes: 33,
    seconds: 9,
    expired: false,
  });
});

test('computePresaleCountdown clamps cleanly to zero once expired', () => {
  assert.deepEqual(computePresaleCountdown(STAGE_1_END_MS, STAGE_1_END_MS), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: true,
  });

  assert.deepEqual(computePresaleCountdown(STAGE_1_END_MS + 99_999, STAGE_1_END_MS), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: true,
  });
});

test('formatCountdownUnit zero-pads single digits and preserves multi-digit values', () => {
  assert.equal(formatCountdownUnit(0), '00');
  assert.equal(formatCountdownUnit(7), '07');
  assert.equal(formatCountdownUnit(44), '44');
  assert.equal(formatCountdownUnit(-5), '00');
});
