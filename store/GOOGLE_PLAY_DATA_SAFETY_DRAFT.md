# Google Play Data Safety Draft

Release candidate: `0.3.0-alpha.1`

This is a Play Console worksheet, not a statement that the Data Safety form has been submitted. Revalidate it against the exact signed Android App Bundle before Play submission.

## Public URLs

- Privacy Policy: `https://convoweave-mcp.onrender.com/privacy`
- Support: `https://convoweave-mcp.onrender.com/support`
- Data & account deletion: `https://convoweave-mcp.onrender.com/account-deletion`

## Current release behavior

- Recording is explicitly user initiated.
- Background recording is disabled.
- Primary meeting memory is local-first.
- Meeting data can include audio, notes, transcripts, decisions, commitments, assumptions, contradiction records, source evidence, and Private Sidecar notes.
- Private Sidecar notes are excluded from cloud-sync payloads.
- Normal alpha review is local/manual.
- Preview-only remote processing is separately gated by explicit approval.
- No advertising SDK or sale of meeting data is part of the current alpha.
- Public MCP preview is stateless with respect to durable production ConvoWeave user accounts.

## Data Safety worksheet

### Audio files / voice or sound recordings
If the shipping configuration remains local-only, microphone access and on-device storage alone should not be represented as server collection. If remote audio processing is enabled, declare the transmitted audio according to the production path and purpose.

Expected purpose if enabled:
- App functionality

Expected handling:
- Not sold
- Not used for advertising
- User-controlled transmission

### Files and docs / other user-generated content
Meeting notes, transcripts, and structured meeting memory remain local in the current alpha unless a user-approved remote feature is enabled. Re-evaluate collection declarations if account sync or remote processing becomes a shipping feature.

### Personal information / identifiers / diagnostics
Do not guess. Inspect the final authentication, analytics, crash reporting, and production hosting configuration before completing Play Console. Declare only data actually collected or shared by the shipping build and its production services.

## Account deletion rule

The current alpha does not create a durable production ConvoWeave cloud account. The public deletion page accurately explains local-data removal and current account behavior.

If production account creation is enabled before Play submission, the release must add and validate:
- an in-app account deletion path
- an external web deletion-request path
- a documented deletion/retention timeline
- corresponding updates to the Privacy Policy and Data Safety answers

Do not ship account creation while leaving the current stateless-alpha deletion language unchanged.

## Pre-submission verification

1. Build the exact signed AAB intended for Play.
2. Inspect dependencies/SDKs and production runtime configuration.
3. Confirm whether remote processing and account sync are enabled.
4. Reconcile collected/shared data with every Data Safety category.
5. Confirm encryption-in-transit behavior for all remote endpoints.
6. Confirm deletion behavior matches the public deletion page.
7. Capture final Android runtime screenshots from the shipping candidate.
