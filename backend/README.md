# ConvoWeave Processing Backend

This directory contains the versioned processing-service boundary used by ConvoWeave mobile clients.

The current implementation is production-shaped but still uses a deterministic development processor. It is suitable for local and preview integration testing. Production startup is intentionally blocked until real authentication and processing adapters exist.

## Responsibilities

The backend owns:

- authenticated processing-session APIs
- one-time upload capabilities
- provider credentials and provider-specific adapters
- stable error envelopes and request IDs
- health/readiness signaling
- processing audit metadata

The mobile app owns explicit user approval before any remote upload and never receives model/provider credentials.

## Current endpoints

- `GET /healthz`: liveness, no authentication
- `GET /readyz`: provider readiness, no authentication
- `POST /v1/processing-sessions`: create an authenticated processing session
- `PUT /v1/uploads/{capability}`: one-time audio upload capability
- `GET /v1/processing-sessions/{id}`: poll authenticated result state

See `../docs/BACKEND_API.md` for the contract.

## Environments

`CONVOWEAVE_ENV` must be one of:

- `development`
- `preview`
- `production`

Development defaults are intentionally convenient but still require an explicit development bearer token.

Production fails closed if configured with `development-token` authentication or the deterministic processor.

## Local run

Copy the example values into your local shell or an ignored environment file:

```bash
export CONVOWEAVE_ENV=development
export CONVOWEAVE_AUTH_MODE=development-token
export CONVOWEAVE_DEV_TOKEN=replace-with-local-development-token
export CONVOWEAVE_PROCESSING_PROVIDER=deterministic
npm --prefix backend start
```

Default listener: `127.0.0.1:8787`.

For physical-device testing on a trusted local network, set `HOST=0.0.0.0` and use the computer's reachable LAN address as the mobile API URL. Do not expose development-token mode to the public internet.

## Tests

```bash
npm --prefix backend test
```

The backend suite covers configuration safety, health/readiness, authentication, request IDs, one-time uploads, provider results, provider failures, and safe error contracts.

## Container

Build from the repository root:

```bash
docker build -f backend/Dockerfile -t convoweave-backend:dev .
```

Run locally:

```bash
docker run --rm -p 8787:8787 \
  -e CONVOWEAVE_ENV=development \
  -e CONVOWEAVE_AUTH_MODE=development-token \
  -e CONVOWEAVE_DEV_TOKEN=replace-with-local-development-token \
  -e CONVOWEAVE_PROCESSING_PROVIDER=deterministic \
  convoweave-backend:dev
```

The container exposes `/healthz` and `/readyz` and includes a liveness healthcheck.

## Provider adapters

Provider selection happens in `providers/index.mjs`. HTTP/session behavior must not contain provider-specific API calls.

A production adapter must:

- accept only the minimum approved meeting data
- return stable transcript segment IDs
- preserve source evidence needed by proposed memory objects
- never auto-accept durable decisions/commitments/assumptions/contradictions
- avoid logging raw audio/transcript content
- surface provider failure without leaking credentials or sensitive upstream error bodies

## Production blockers

Before an internet-facing production deployment, implement and validate:

- real user/session authentication and authorization
- real transcription/extraction provider adapter(s)
- durable database/session persistence
- private object storage with short-lived restricted upload URLs
- retention/deletion workflows
- rate limiting and abuse controls
- audit-event persistence
- observability/alerting appropriate to the hosting platform

Do not weaken the production startup guards to bypass these requirements.
