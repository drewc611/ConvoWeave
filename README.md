# ConvoWeave

### Build & quality

[![Main Stable](https://img.shields.io/badge/main-stable-success?style=for-the-badge)](https://github.com/drewc611/ConvoWeave/tree/main)
[![Mobile CI](https://github.com/drewc611/ConvoWeave/actions/workflows/mobile-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/mobile-ci.yml)
[![Backend CI](https://github.com/drewc611/ConvoWeave/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/backend-ci.yml)
[![MCP Integration CI](https://github.com/drewc611/ConvoWeave/actions/workflows/mcp-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/mcp-ci.yml)
[![Infrastructure CI](https://github.com/drewc611/ConvoWeave/actions/workflows/infra-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/infra-ci.yml)
[![Security CI](https://github.com/drewc611/ConvoWeave/actions/workflows/security-ci.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/security-ci.yml)
[![CodeQL](https://github.com/drewc611/ConvoWeave/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/codeql.yml)
[![Dependency Review](https://github.com/drewc611/ConvoWeave/actions/workflows/dependency-review.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/dependency-review.yml)
[![Android Debug APK](https://github.com/drewc611/ConvoWeave/actions/workflows/build-debug-apk.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/build-debug-apk.yml)
[![Container Publish](https://github.com/drewc611/ConvoWeave/actions/workflows/container-publish.yml/badge.svg?branch=main)](https://github.com/drewc611/ConvoWeave/actions/workflows/container-publish.yml)

### Platform & architecture

![TypeScript Strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![Node 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=nodedotjs&logoColor=white)
![SQLite Local First](https://img.shields.io/badge/SQLite-local--first-003B57?logo=sqlite&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-remote%20server-5C5CFF)
![OAuth](https://img.shields.io/badge/OAuth%202.0%20%2F%20OIDC-scoped-success)
![AWS](https://img.shields.io/badge/AWS-production%20stack%20in%20progress-FF9900?logo=amazonaws&logoColor=white)
![Proprietary](https://img.shields.io/badge/license-proprietary-critical)

### Integrations & distribution

[![ChatGPT](https://img.shields.io/badge/ChatGPT-integration%20ready-10A37F?logo=openai&logoColor=white)](integrations/chatgpt)
[![Claude Connector](https://img.shields.io/badge/Claude%20Connector-submission%20prepared-D97757)](integrations/claude/SUBMISSION.md)
[![Claude Plugin](https://img.shields.io/badge/Claude%20Plugin-package%20ready-D97757)](integrations/claude)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-publish%20ready-5C5CFF)](integrations/mcp/server.registry.template.json)
![Apple App Store](https://img.shields.io/badge/Apple%20App%20Store-pending-lightgrey?logo=apple)
![TestFlight](https://img.shields.io/badge/TestFlight-pending-lightgrey?logo=apple)
![Google Play](https://img.shields.io/badge/Google%20Play-pending-lightgrey?logo=googleplay)
![Play Internal](https://img.shields.io/badge/Play%20Internal-pending-lightgrey?logo=googleplay)

### Repository status

![Last Commit](https://img.shields.io/github/last-commit/drewc611/ConvoWeave)
![Open Issues](https://img.shields.io/github/issues/drewc611/ConvoWeave)
![Open PRs](https://img.shields.io/github/issues-pr/drewc611/ConvoWeave)
![Repo Size](https://img.shields.io/github/repo-size/drewc611/ConvoWeave)
![Top Language](https://img.shields.io/github/languages/top/drewc611/ConvoWeave)

> Workflow badges are authoritative automation results. Marketplace and store badges intentionally use `ready`, `prepared`, `pending`, or `in progress` until the external platform actually approves the listing.

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

## ChatGPT and Claude integrations

ConvoWeave exposes a shared remote MCP service for host integrations. The same source-backed tools are packaged for ChatGPT and Claude, with account-backed read/write tools protected by OAuth/OIDC scopes.

- `integrations/chatgpt/` contains the ChatGPT integration package.
- `integrations/claude/` is a Claude plugin root containing the Agent Skill and remote MCP configuration.
- `integrations/claude/SUBMISSION.md` contains the Anthropic Connector/Plugin Directory reviewer packet.
- `integrations/mcp/server.registry.template.json` contains the official MCP Registry metadata template.
- `.github/workflows/publish-mcp-registry.yml` publishes the live production server to the official MCP Registry using GitHub OIDC after deployment.

Private Sidecar notes are excluded from account sync and connector tools.

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
- `docs/AWS_PRODUCTION_DEPLOYMENT.md`
- `docs/adr/0001-runtime-environments-and-provider-boundary.md`
- `docs/adr/0002-openai-preview-processing-provider.md`
- `docs/adr/0003-preview-persistence-and-audio-retention.md`
- `docs/adr/0004-oidc-authentication-boundary.md`
- `docs/adr/0005-preview-container-distribution.md`
- `docs/adr/0008-suite-ui-and-meeting-workspace.md`
- `docs/adr/0009-live-capture-notes-and-suite-continuity.md`
- `docs/adr/0010-aws-production-mcp-account-platform.md`
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

Repository engineering can package the product, but production distribution still requires account-holder authorization for AWS deployment, public domain/privacy/support endpoints, Apple/Google signing and store agreements, and authenticated marketplace submissions.

Do not commit store credentials, signing material, Expo tokens, provider secrets, recordings, transcripts, or user meeting data.

## Proprietary software

Copyright © 2026 Andrew Michael Clark. All rights reserved. See `LICENSE`.
