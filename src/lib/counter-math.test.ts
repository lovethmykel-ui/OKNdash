import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCounterState, easeOutQuart } from './counter-math';

test('easeOutQuart stays within [0, 1] and is monotonic', () => {
  assert.equal(easeOutQuart(-0.5), 0);
  assert.equal(easeOutQuart(0), 0);
  assert.equal(easeOutQuart(1), 1);
  assert.equal(easeOutQuart(2), 1);
  assert.ok(easeOutQuart(0.5) > easeOutQuart(0.25));
  assert.ok(easeOutQuart(0.75) > easeOutQuart(0.5));
});

test('computeCounterState starts blurred at 0 and settles sharp at target', () => {
  const start = computeCounterState(0, 1000, 416667);
  assert.equal(start.value, 0);
  assert.equal(start.done, false);
  assert.ok(start.blurPx >= 5);
  assert.ok(start.opacity < 0.5);

  const mid = computeCounterState(350, 1000, 416667);
  assert.ok(mid.value > 0 && mid.value < 416667);
  assert.ok(mid.blurPx > 0 && mid.blurPx < start.blurPx);
  assert.equal(mid.done, false);

  const end = computeCounterState(1000, 1000, 416667);
  assert.equal(end.value, 416667);
  assert.equal(end.blurPx, 0);
  assert.equal(end.opacity, 1);
  assert.equal(end.scale, 1);
  assert.equal(end.done, true);
});
