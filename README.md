# ConvoWeave

**The AI companion that remembers your meetings.**

ConvoWeave is a mobile-first meeting memory and decision system. It preserves what changed across conversations, who committed to what, why decisions were made, which assumptions remain unverified, and where current statements conflict with earlier evidence.

It is intentionally not a transcript-summary app. Raw evidence and generated interpretation remain separate, and important memory keeps source proof.

## Current alpha

The `build/mobile-foundation` branch includes:

- real on-device microphone capture with explicit permission and recording notice
- pause, resume, stop, duration tracking and interruption handling
- durable recording drafts checkpointed during capture with restart recovery
- SQLite-backed local persistence behind repository interfaces
- persistent meeting threads
- resumable transcript/proposal review state
- human accept/edit/reject before generated proposals become durable memory
- deterministic per-meeting `What Changed?` change sets
- Decision Ledger with active, disputed, reversed and superseded states
- evidence-backed decision supersede lineage that preserves the prior decision
- Commitment Radar with owner, due date, deterministic risk state and completion/cancellation/reopen
- Assumption Register with supported/disproven/expired transitions
- persisted contradiction review requiring both current and prior evidence
- Private Sidecar notes with an explicit promotion boundary
- reusable Source Proof showing meeting reference, speaker when known, timestamps, segment IDs and quote
- local mock providers for safe development
- remote transcription/extraction provider adapter behind the same provider interfaces
- explicit per-meeting remote upload approval with separate transcript-only and audio-and-transcript scopes
- backend HTTP client that keeps provider credentials server-side and does not forward bearer authorization to presigned upload hosts

## Development

```bash
npm install
npm run typecheck
npm test
npm start
```

For microphone, interruption and restart behavior, validate on a physical device using an Expo development or EAS internal/preview build. Do not treat browser or simulator-only validation as the release gate.

## Validation

GitHub Actions currently provide:

- strict TypeScript validation
- Vitest unit and repository restart-state tests
- high-severity dependency audit
- CodeQL JavaScript/TypeScript analysis
- Gitleaks secret scanning
- CycloneDX SBOM generation
- Dependabot for npm and GitHub Actions

The Dependency Review workflow is present but requires GitHub Dependency Graph to be enabled in repository settings.

Physical-device acceptance criteria are in `docs/DEVICE_TEST_PLAN.md` and tracked in Issue #5.

## Architecture and product docs

Read these before changing core behavior:

- `CODEX.md`
- `docs/PRODUCT_STRATEGY.md`
- `docs/BACKEND_API.md`
- `docs/DEVICE_TEST_PLAN.md`
- `docs/STORE_RELEASE.md`
- `store/PRIVACY_POLICY.md`
- `LICENSE`

Core invariants:

1. Raw evidence is not the same thing as generated memory.
2. Generated proposals require human review before becoming durable memory.
3. Prior decisions are not silently overwritten.
4. A durable contradiction requires evidence from both sides.
5. Unpromoted Private Sidecar notes remain outside shared context.
6. Remote processing is opt-in per meeting.
7. Provider credentials never belong in the mobile bundle.

## Privacy

The current alpha keeps audio, reviews and persisted meeting state on device. The application still uses local mock providers by default and does not automatically upload meeting audio.

A remote provider adapter exists for future backend activation, but it requires explicit meeting-specific approval before audio can leave the device. Any release that enables remote processing must update the store privacy disclosures and privacy policy before distribution.

## Release tracking

- Issue #2: live mobile-alpha engineering checklist
- Issue #3: Apple Developer, App Store Connect, Google Play and EAS account-holder steps
- Issue #5: physical iOS/Android device validation

Do not commit Apple credentials, App Store Connect keys, Google service-account JSON, Android keystores/passwords, Expo access tokens, provider secrets, recordings, transcripts or user meeting data.

## Proprietary software

Copyright © 2026 Andrew Michael Clark. All rights reserved. See `LICENSE`.
