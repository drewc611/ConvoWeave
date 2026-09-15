# Apple App Privacy Draft

Release candidate: `0.3.0-alpha.1`

This document is a submission worksheet, not a claim that App Store Connect has been completed. Revalidate every answer against the exact signed build before submission.

## Public URLs

- Privacy Policy: `https://convoweave-mcp.onrender.com/privacy`
- Support: `https://convoweave-mcp.onrender.com/support`
- Data deletion information: `https://convoweave-mcp.onrender.com/account-deletion`

## Current mobile-alpha behavior

- User explicitly initiates microphone recording.
- Background recording is disabled.
- Primary meeting state is local-first and stored on device.
- Meeting data can include audio, notes, transcripts, decisions, commitments, assumptions, contradiction records, source evidence, and Private Sidecar notes.
- Private Sidecar notes are not synchronized by the account-sync contract.
- The normal alpha review path is local/manual.
- Preview-only remote processing is opt-in and requires explicit approval before approved meeting data leaves the device.
- No advertising SDK or behavioral-advertising feature is part of the current alpha.
- Provider API credentials are not embedded in the mobile bundle.
- The public MCP preview does not currently provide durable production user-account storage.

## App Privacy review worksheet

### Audio Data
Potentially collected only if the exact shipping build enables a user-approved remote processing path. If the shipping build remains local/manual only, local on-device recording should not be declared as server collection merely because the app accesses the microphone.

If remote audio processing is enabled before submission:
- Purpose: App Functionality
- Linked to user: re-evaluate based on the production authentication/account design
- Tracking: No

### User Content
Meeting notes/transcripts or structured meeting memory may be transmitted only when the user deliberately enables an approved remote processing or account-sync feature. For the current local-first alpha, ordinary meeting state remains on device.

If remote processing/account sync is enabled before submission:
- Purpose: App Functionality
- Linked to user: re-evaluate against production account identity
- Tracking: No

### Identifiers / Diagnostics
Do not declare speculative categories. Re-check the exact production SDKs, authentication provider, crash/telemetry stack, and hosting logs before completing App Store Connect.

## Required pre-submission verification

1. Inspect the signed build for third-party SDKs and telemetry.
2. Confirm whether remote processing is enabled in the shipping configuration.
3. Confirm whether production account sync is enabled.
4. Reconcile every transmitted field with the App Privacy questionnaire.
5. Confirm the public Privacy Policy accurately describes the shipping behavior.
6. Update this worksheet if the production build changes any data boundary.
