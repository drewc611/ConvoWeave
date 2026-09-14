# Preview backend storage runbook

The preview backend persists processing sessions and raw audio through storage adapters. Development may use memory. Preview should use the filesystem adapters with a durable mounted volume.

## Recommended preview configuration

```bash
export CONVOWEAVE_ENV=preview
export CONVOWEAVE_AUTH_MODE=development-token
export CONVOWEAVE_DEV_TOKEN='runtime-only-preview-token'
export CONVOWEAVE_PROCESSING_PROVIDER=deterministic
export CONVOWEAVE_STORAGE_MODE=filesystem
export CONVOWEAVE_DATA_DIR=/data/convoweave
export CONVOWEAVE_AUDIO_RETENTION=delete-after-processing
```

When using the OpenAI preview provider, configure the provider key at runtime as documented in `backend/README.md`. Never place provider secrets in `EXPO_PUBLIC_*` variables or source control.

## Container volume

The backend image declares `/data/convoweave` as its persistence volume. Mount a durable host or platform volume there:

```bash
docker run --rm -p 8787:8787 \
  -v convoweave-preview-data:/data/convoweave \
  -e CONVOWEAVE_ENV=preview \
  -e CONVOWEAVE_AUTH_MODE=development-token \
  -e CONVOWEAVE_DEV_TOKEN='runtime-only-preview-token' \
  -e CONVOWEAVE_PROCESSING_PROVIDER=deterministic \
  -e CONVOWEAVE_STORAGE_MODE=filesystem \
  -e CONVOWEAVE_AUDIO_RETENTION=delete-after-processing \
  convoweave-backend:preview
```

## Retention

`delete-after-processing` is the safe default. Raw audio is deleted after a terminal processing outcome. Completed session state and the provider result remain available.

`retain-preview` is only for controlled troubleshooting with non-sensitive data. Do not use it for public production deployments.

## Restart behavior

Completed session state survives restart. A session persisted as `processing` with a valid retained audio reference is recovered when the client next polls that processing session.

## Data layout

The filesystem implementation stores:

- `sessions/*.json`: versioned session records and final provider result state
- `audio/*.audio`: temporary raw audio objects

Upload capabilities are hashed before persistence. Raw one-time upload tokens are not written into the session files.

## Readiness

`GET /readyz` checks the processor, session store, and audio store. A preview instance should not be considered ready unless all three are available.

## Production migration

The filesystem adapters are intentionally replaceable. Production storage should move behind the same `SessionStore` and `AudioStore` contracts to a durable database and private object-storage service. That change must not alter the mobile `/v1` processing contract.
