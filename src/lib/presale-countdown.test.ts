import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_1_DURATION_DAYS,
  STAGE_1_START_MS,
  STAGE_1_END_MS,
  INITIAL_COUNTDOWN_SNAPSHOT,
  computePresaleCountdown,
  formatCountdownUnit,
  buildOdometerReel,
  planOdometerTransition,
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

test('buildOdometerReel appends duplicate trailing 0 for seamless wrap-around', () => {
  assert.deepEqual(buildOdometerReel(9), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
  assert.deepEqual(buildOdometerReel(5), ['0', '1', '2', '3', '4', '5', '0']);
  assert.deepEqual(buildOdometerReel(2), ['0', '1', '2', '0']);
});

test('planOdometerTransition jumps cleanly on 0 -> maxDigit wrap without backward rewind', () => {
  assert.deepEqual(planOdometerTransition(0, 9, 9), { jumpToIndex: 10, targetIndex: 9 });
  assert.deepEqual(planOdometerTransition(0, 5, 5), { jumpToIndex: 6, targetIndex: 5 });
  assert.deepEqual(planOdometerTransition(0, 2, 2), { jumpToIndex: 3, targetIndex: 2 });
  assert.deepEqual(planOdometerTransition(7, 6, 9), { jumpToIndex: null, targetIndex: 6 });
  assert.deepEqual(planOdometerTransition(1, 0, 9), { jumpToIndex: null, targetIndex: 0 });
});

test('buildOdometerReel appends duplicate zero slot for seamless downward rollover', () => {
  assert.deepEqual(buildOdometerReel(9), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
  assert.deepEqual(buildOdometerReel(5), ['0', '1', '2', '3', '4', '5', '0']);
  assert.deepEqual(buildOdometerReel(2), ['0', '1', '2', '0']);
});

test('planOdometerTransition steps downward by 1 slot on 0 -> maxDigit without rewinding', () => {
  // Normal downward ticks require no jump
  assert.deepEqual(planOdometerTransition(8, 7, 9), { jumpToIndex: null, targetIndex: 7 });
  assert.deepEqual(planOdometerTransition(1, 0, 9), { jumpToIndex: null, targetIndex: 0 });

  // Rollover 0 -> 9 snaps instantaneously to trailing duplicate '0' (index 10), then glides to 9
  assert.deepEqual(planOdometerTransition(0, 9, 9), { jumpToIndex: 10, targetIndex: 9 });

  // Tens rollover 0 -> 5 snaps instantaneously to trailing duplicate '0' (index 6), then glides to 5
  assert.deepEqual(planOdometerTransition(0, 5, 5), { jumpToIndex: 6, targetIndex: 5 });
});
