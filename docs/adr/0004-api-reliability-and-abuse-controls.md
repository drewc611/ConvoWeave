# ADR 0004: API reliability and abuse controls

Status: Accepted for preview

## Decision

The processing API enforces bounded session and upload lifetimes, per-subject fixed-window throttling, optional subject-scoped idempotency keys, stale-session cleanup, and graceful shutdown readiness behavior.

Defaults:
- upload capability TTL: 15 minutes
- processing-session TTL: 24 hours
- authenticated requests: 60 per minute per subject
- stale cleanup: at least every 15 minutes

All limits are runtime-configurable. Production edge throttling/WAF remains a deployment concern; application throttling is a second line of defense, not a replacement.

## Security properties

Upload capabilities remain one-time and hashed at rest. Expired capabilities are invalidated. Idempotency keys are hashed with the authenticated subject before persistence. Cleanup deletes retained audio before deleting expired session metadata. Shutdown makes readiness fail before the process stops accepting work.

## Tradeoffs

The preview limiter is process-local, so horizontally scaled production deployments must add a shared/edge rate limiter. Preview idempotency lookup scans the session store and should be replaced by an indexed persistence implementation when a production database is selected.
