import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCounterFrame } from './counter';

test('computeCounterFrame starts at 0 with soft blur and low opacity', () => {
  const start = computeCounterFrame(0, 416667);
  assert.equal(start.value, 0);
  assert.ok(start.blurPx >= 5, `expected initial blurPx >= 5, got ${start.blurPx}`);
  assert.ok(start.opacity < 0.5);
});

test('computeCounterFrame eases upward and reduces blur over time', () => {
  const early = computeCounterFrame(0.25, 100000);
  const mid = computeCounterFrame(0.6, 100000);
  assert.ok(mid.value > early.value);
  assert.ok(mid.blurPx < early.blurPx);
  assert.ok(mid.blurPx > 0);
});

test('computeCounterFrame lands exactly on target with zero blur at t=1', () => {
  const end = computeCounterFrame(1, 166667);
  assert.equal(end.value, 166667);
  assert.equal(end.blurPx, 0);
  assert.equal(end.scale, 1);
  assert.equal(end.opacity, 1);
});

test('computeCounterFrame clamps out-of-range inputs safely', () => {
  const neg = computeCounterFrame(-0.5, 500);
  assert.equal(neg.value, 0);
  const over = computeCounterFrame(1.4, 500);
  assert.equal(over.value, 500);
  assert.equal(over.blurPx, 0);
});
