# Codex Continuation Task

Work from `build/mobile-foundation` and GitHub Issue #2.

## Start here

1. Read `LICENSE`, `CODEX.md`, `README.md`, `docs/PRODUCT_STRATEGY.md`, `docs/BACKEND_API.md`, and `docs/DEVICE_TEST_PLAN.md`.
2. Run `npm install`, `npm run typecheck`, and `npm test`.
3. Inspect the current pull-request checks. Fix CI/security failures before adding code.
4. Preserve evidence separately from generated interpretation.
5. Never silently overwrite prior decisions.
6. Never allow unpromoted Private Sidecar notes into shared context.
7. Never add provider credentials, store credentials, recordings, transcripts, or user meeting data to source control.

## Current product state

The branch already includes:

- real mobile recording with explicit permission and recording notice
- durable recording drafts with restart recovery
- SQLite-backed repositories
- persistent meeting threads
- resumable meeting review state
- deterministic `What Changed?`
- Decision Ledger and evidence-backed supersede lineage
- Commitment Radar
- Assumption Register
- persisted contradiction review with two-sided source evidence
- Private Sidecar boundaries
- Source Proof
- remote-processing backend client and provider adapter
- explicit per-meeting upload approval policy
- repository restart-state tests and privacy/security tests
- CI, CodeQL, secret scanning, SBOM and dependency audit
- store/EAS configuration and physical-device test plan

Do not rebuild these features from scratch.

## Next work slice

Proceed in this order:

1. Confirm the latest branch head is green in Mobile CI, CodeQL and Security CI.
2. Keep `mockProviders` as the default until an actual backend is deployed. Do not enable the remote provider adapter just because it exists.
3. If implementing the backend, follow `docs/BACKEND_API.md`. Provider/model credentials stay server-side and remote processing remains explicit opt-in per meeting.
4. Initialize the real Expo/EAS project only with the account holder. Do not invent or commit project/account credentials.
5. Produce internal/preview builds after EAS setup.
6. Run every Critical case in `docs/DEVICE_TEST_PLAN.md` on physical iOS and Android devices. Track this in Issue #5.
7. Complete Apple/Google/EAS account-holder tasks in Issue #3 before TestFlight or Google Play internal submission.
8. Reconcile store privacy disclosures with the exact shipping binary before any external distribution.

## Scope guard

Do not add CRM integrations, sales coaching, bot-join infrastructure, browser extensions, enterprise analytics dashboards, or custom vector infrastructure during this alpha gate.

The immediate objective is reliability and release validation, not more product breadth.
