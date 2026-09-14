# ConvoWeave

[![Main Stable](https://img.shields.io/badge/main-stable-success?style=for-the-badge)](https://github.com/drewc611/ConvoWeave/tree/main)
[![Mobile CI](https://github.com/drewc611/ConvoWeave/actions/workflows/mobile-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/mobile-ci.yml)
[![Backend CI](https://github.com/drewc611/ConvoWeave/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/backend-ci.yml)
[![Security CI](https://github.com/drewc611/ConvoWeave/actions/workflows/security-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/security-ci.yml)
[![CodeQL](https://github.com/drewc611/ConvoWeave/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/codeql.yml)

**The AI companion that remembers your meetings.**

ConvoWeave is a mobile-first meeting memory and decision system. It preserves what changed across conversations, who committed to what, why decisions were made, which assumptions remain unverified, and where current statements conflict with earlier evidence.

## Stable product

The stable mobile product remains local-first and works without cloud AI:

- on-device microphone capture and restart-safe recording drafts
- SQLite-backed meeting threads and review state
- manual review of real notes, decisions, commitments and assumptions
- What Changed, Decision Ledger, Commitment Radar and Assumption Register
- evidence-backed contradiction review
- Private Sidecar notes with an explicit promotion boundary
- Source Proof for important meeting memory

Remote processing is optional per meeting and does not replace human review.

## Backend platform

`main` now includes production-shaped backend boundaries for:

- development / preview / production configuration
- preview OpenAI transcription and structured extraction behind a replaceable provider adapter
- durable preview session/audio storage and delete-after-processing retention
- provider-neutral OIDC/JWT authentication and per-user processing-session ownership
- request IDs, stable API errors, liveness/readiness and container execution
- backend-specific tests, dependency audit and container smoke validation

Provider credentials and identity-provider secrets never belong in the mobile bundle.

## Preview deployment

The backend is distributed as a container. After Backend CI succeeds on `main`, GitHub Actions can publish validated images to:

- `ghcr.io/drewc611/convoweave-backend:main`
- `ghcr.io/drewc611/convoweave-backend:sha-<commit>`

The immutable SHA tag is the deployment/rollback reference. `deploy/docker-compose.preview.yml` is the portable preview runtime with durable storage and runtime-only configuration.

See `docs/PREVIEW_DEPLOYMENT.md`.

## Development

```bash
npm install
npm run typecheck
npm test
npm start
```

Backend validation is separate:

```bash
npm --prefix backend install
npm run test:backend
```

Physical-device acceptance criteria are in `docs/DEVICE_TEST_PLAN.md`.

## Architecture and operations docs

- `CODEX.md`
- `docs/PRODUCT_STRATEGY.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/BACKEND_API.md`
- `docs/AUTHENTICATION.md`
- `docs/PREVIEW_BACKEND_STORAGE.md`
- `docs/PREVIEW_DEPLOYMENT.md`
- `docs/DEVICE_TEST_PLAN.md`
- `docs/STORE_RELEASE.md`
- `docs/adr/0001-runtime-environments-and-provider-boundary.md`
- `docs/adr/0002-openai-preview-processing-provider.md`
- `docs/adr/0003-preview-persistence-and-audio-retention.md`
- `docs/adr/0004-oidc-authentication-boundary.md`
- `docs/adr/0005-preview-container-distribution.md`
- `store/PRIVACY_POLICY.md`
- `LICENSE`

## Core invariants

1. Raw evidence and generated interpretation remain separate.
2. Generated proposals require human review before becoming durable memory.
3. Prior decisions are never silently overwritten.
4. Durable contradictions require evidence from both sides.
5. Unpromoted Private Sidecar notes remain outside shared context.
6. Remote processing is opt-in per meeting.
7. Provider credentials never belong in the mobile bundle.
8. Bearer tokens are never persisted in processing-session records.
9. `main` remains the stable/releasable source of truth.

## Remaining external release gates

Repository engineering can package the product, but a real internet preview still requires runtime account configuration for hosting, OIDC identity, provider credentials and HTTPS. App-store distribution additionally requires the Apple/Google/EAS account-holder steps already tracked in the repository.

Do not commit store credentials, signing material, Expo tokens, provider secrets, recordings, transcripts, or user meeting data.

## Proprietary software

Copyright © 2026 Andrew Michael Clark. All rights reserved. See `LICENSE`.
