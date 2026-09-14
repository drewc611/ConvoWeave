# ADR 0003: Preview persistence and audio-retention boundary

Status: Accepted

Date: 2026-09-14

## Context

The processing backend originally kept processing sessions and uploaded audio in process memory. That is appropriate for isolated development tests, but it cannot survive a backend restart and creates an unnecessary raw-audio lifetime inside the server process.

ConvoWeave also needs to preserve provider neutrality. Choosing a production database or object-storage vendor at this stage would couple the API and provider work to infrastructure decisions that are not yet necessary for preview validation.

## Decision

Introduce two backend storage boundaries:

- `SessionStore` owns processing-session state and final processing results.
- `AudioStore` owns raw uploaded audio objects.

Development may use in-memory implementations. Preview defaults to filesystem implementations rooted at `CONVOWEAVE_DATA_DIR`.

Filesystem session records are versioned with `storeVersion`. Upload capabilities are never persisted in plaintext. Only a SHA-256 digest of the capability is stored in the session record.

Filesystem audio objects use randomized names and owner-only file permissions. The default retention mode is `delete-after-processing`, which removes raw audio after either a successful provider result or a terminal provider failure. `retain-preview` exists only for controlled preview debugging and is not permitted as a production retention policy.

A session left in `processing` with a retained audio reference can be recovered after backend restart when the client polls the session again. Completed results remain queryable after restart.

## Consequences

Positive:

- Preview processing state survives backend restart.
- Raw audio no longer needs to remain in application memory after upload.
- Raw audio has an explicit deletion policy.
- Session and audio persistence can later move to PostgreSQL and private object storage without changing the `/v1` API or provider adapters.
- Readiness checks can fail when the configured persistence layer is unavailable.

Tradeoffs:

- The preview filesystem store is single-node storage and is not appropriate for multi-instance production deployment.
- `findByUploadToken` scans preview session records and is intentionally simple rather than optimized for scale.
- Filesystem persistence requires a durable mounted volume in containers.
- Schema migrations beyond `storeVersion: 1` still need an explicit migration implementation before incompatible persisted formats are introduced.

## Production boundary

Do not treat the preview filesystem implementation as the final production storage design. Before public production deployment, select durable database and private object-storage adapters with encryption, access controls, lifecycle policies, backups, and deletion/audit behavior appropriate to the deployment environment.

The mobile client and processing-provider adapters must remain unaware of the storage implementation.
