import { createHash } from 'node:crypto';

export function createFixedWindowLimiter({ limit, windowMs, now = () => Date.now() }) {
  const buckets = new Map();
  return {
    check(key) {
      const current = now();
      const existing = buckets.get(key);
      if (!existing || current >= existing.resetAt) {
        const next = { count: 1, resetAt: current + windowMs };
        buckets.set(key, next);
        return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: next.resetAt };
      }
      existing.count += 1;
      return {
        allowed: existing.count <= limit,
        remaining: Math.max(0, limit - existing.count),
        resetAt: existing.resetAt,
      };
    },
    sweep() {
      const current = now();
      for (const [key, bucket] of buckets) if (current >= bucket.resetAt) buckets.delete(key);
    },
  };
}

export function normalizeIdempotencyKey(value) {
  if (typeof value !== 'string') return undefined;
  const key = value.trim();
  if (!key || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) return undefined;
  return key;
}

export function idempotencyHash(subject, key) {
  return createHash('sha256').update(`${subject}\0${key}`).digest('hex');
}

export function isExpired(isoTime, ttlMs, now = Date.now()) {
  const timestamp = Date.parse(isoTime ?? '');
  return Number.isFinite(timestamp) && now - timestamp >= ttlMs;
}

export async function cleanupExpiredSessions({ sessionStore, audioStore, sessionTtlMs, now = Date.now() }) {
  const sessions = await sessionStore.list();
  let removed = 0;
  for (const session of sessions) {
    if (!isExpired(session.createdAt, sessionTtlMs, now)) continue;
    if (session.audioRef) await audioStore.remove(session.audioRef);
    await sessionStore.remove(session.id);
    removed += 1;
  }
  return removed;
}
