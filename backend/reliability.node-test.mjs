import assert from 'node:assert/strict';
import test from 'node:test';
import { createFixedWindowLimiter, idempotencyHash, isExpired, normalizeIdempotencyKey } from './reliability.mjs';

test('fixed-window limiter rejects traffic above configured limit', () => {
  let now = 1000;
  const limiter = createFixedWindowLimiter({ limit: 2, windowMs: 60000, now: () => now });
  assert.equal(limiter.check('user-1').allowed, true);
  assert.equal(limiter.check('user-1').allowed, true);
  assert.equal(limiter.check('user-1').allowed, false);
  now += 60001;
  assert.equal(limiter.check('user-1').allowed, true);
});

test('idempotency keys are bounded and subject-scoped', () => {
  assert.equal(normalizeIdempotencyKey(' retry-123 '), 'retry-123');
  assert.equal(normalizeIdempotencyKey('bad key'), undefined);
  assert.notEqual(idempotencyHash('alice', 'same'), idempotencyHash('bob', 'same'));
});

test('expiry uses persisted creation time', () => {
  assert.equal(isExpired('2026-09-14T00:00:00.000Z', 60000, Date.parse('2026-09-14T00:01:00.000Z')), true);
  assert.equal(isExpired('2026-09-14T00:00:30.000Z', 60000, Date.parse('2026-09-14T00:01:00.000Z')), false);
});
