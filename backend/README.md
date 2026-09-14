# ConvoWeave Processing Backend

This directory contains the versioned processing-service boundary used by ConvoWeave mobile clients.

The backend supports two processor modes:

- `deterministic`: development/reference processing with no external provider
- `openai`: preview-only real transcription and structured-memory extraction

The stable mobile product remains local-first. Remote processing must be enabled explicitly and still requires meeting-specific upload approval.

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

See `../docs/BACKEND_API.md` for the provider-neutral API contract.

## Environments

`CONVOWEAVE_ENV` must be one of:

- `development`
- `preview`
- `production`

Development may use the deterministic processor. Preview may use either the deterministic processor or the OpenAI adapter for real integration testing.

Production remains blocked while authentication is still `development-token`. Do not weaken that guard merely to deploy the preview provider publicly.

## Local deterministic run

```bash
export CONVOWEAVE_ENV=development
export CONVOWEAVE_AUTH_MODE=development-token
export CONVOWEAVE_DEV_TOKEN=replace-with-local-development-token
export CONVOWEAVE_PROCESSING_PROVIDER=deterministic
npm --prefix backend start
```

Default listener: `127.0.0.1:8787`.

For physical-device testing on a trusted local network, set `HOST=0.0.0.0` and use the computer's reachable LAN address as the mobile API URL. Do not expose development-token mode to the public internet.

## Preview OpenAI provider

The OpenAI adapter exists only behind the backend provider boundary. It never runs from the mobile application directly.

Configure it at runtime:

```bash
export CONVOWEAVE_ENV=preview
export CONVOWEAVE_AUTH_MODE=development-token
export CONVOWEAVE_DEV_TOKEN=replace-with-preview-test-token
export CONVOWEAVE_PROCESSING_PROVIDER=openai
export OPENAI_API_KEY=replace-at-runtime-only
export OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
export OPENAI_EXTRACTION_MODEL=gpt-5.6-luna
export OPENAI_TIMEOUT_MS=60000
npm --prefix backend start
```

`OPENAI_API_KEY` is a backend secret. Never put it in `.env.example`, an `EXPO_PUBLIC_*` variable, the mobile bundle, screenshots, issue bodies, CI output, or git history.

The preview adapter currently:

1. transcribes the approved audio upload
2. asks for strict schema-constrained meeting-memory proposals
3. validates the returned proposal kind, confidence, optional dates, and exact evidence quote locally
4. returns proposals in `proposed` state for human review

It does not generate contradictions because prior evidence is not included in the provider request.

## Tests

Normal automated tests require no external API credential:

```bash
npm --prefix backend test
```

The backend test suite covers configuration safety, health/readiness, authentication, request IDs, one-time uploads, provider results, provider failures, mocked OpenAI transcription/extraction, source-evidence validation, and safe upstream-error handling.

## Operator-only live provider smoke test

A developer with a runtime API key may perform a live preview smoke test against non-sensitive test audio:

```bash
export OPENAI_API_KEY=replace-at-runtime-only
npm --prefix backend run smoke:openai -- /path/to/non-sensitive-test-audio.m4a
```

The smoke command prints metadata only: provider name, transcript character count, proposal count, and proposal kinds. It does not print transcript text or extracted meeting content.

Live provider smoke testing is intentionally not part of normal CI because CI should not depend on an external provider credential or create uncontrolled provider cost.

## Container

Build from the repository root:

```bash
docker build -f backend/Dockerfile -t convoweave-backend:dev .
```

Run the deterministic development container:

```bash
docker run --rm -p 8787:8787 \
  -e CONVOWEAVE_ENV=development \
  -e CONVOWEAVE_AUTH_MODE=development-token \
  -e CONVOWEAVE_DEV_TOKEN=replace-with-local-development-token \
  -e CONVOWEAVE_PROCESSING_PROVIDER=deterministic \
  convoweave-backend:dev
```

The container exposes `/healthz` and `/readyz` and includes a liveness healthcheck.

Preview provider secrets should be injected through the deployment platform's secret manager, not baked into the image or passed in a checked-in compose file.

## Provider adapters

Provider selection happens in `providers/index.mjs`. HTTP/session behavior must not contain provider-specific API calls.

A provider adapter must:

- accept only the minimum approved meeting data
- return stable ConvoWeave transcript segment IDs
- preserve source evidence needed by proposed memory objects
- never auto-accept durable decisions, commitments, assumptions, or contradictions
- avoid logging raw audio/transcript content
- surface provider failure without leaking credentials or sensitive upstream response bodies
- remain replaceable without changing mobile feature code or the `/v1` contract

See ADR 0002 for the preview OpenAI provider decision and its tradeoffs.

## Production blockers

Before an internet-facing production deployment, implement and validate:

- real user/session authentication and authorization
- durable database/session persistence
- private object storage with short-lived restricted upload URLs
- retention/deletion workflows
- rate limiting and abuse controls
- audit-event persistence
- observability/alerting appropriate to the hosting platform
- provider data-control and retention review
- current App Store and Google Play privacy disclosures for the actual shipping data flow
- physical-device/network validation against the exact release build

Do not weaken production startup guards to bypass these requirements.
