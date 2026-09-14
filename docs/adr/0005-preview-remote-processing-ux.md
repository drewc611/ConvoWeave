# ADR 0005: Preview remote processing UX

Status: Accepted for preview

## Decision

ConvoWeave keeps local/manual review as the default product behavior. Remote processing is exposed only when the mobile runtime is explicitly configured with `EXPO_PUBLIC_APP_ENV=preview`, `EXPO_PUBLIC_PROCESSING_MODE=remote`, and a preview API URL.

A meeting upload requires an explicit user action in the review screen. The access token is entered for preview QA and held only in component memory. It is not stored in SQLite, included in meeting state, logged, or embedded as an `EXPO_PUBLIC_*` value.

Remote proposals remain `proposed` until the user accepts them. Editing a remote proposal preserves its original source evidence rather than replacing the evidence quote with the edited interpretation. Human-added notes and memory items use a separate `manual-entry` transcript segment.

## Rationale

This keeps the privacy boundary visible, avoids silently changing the shipping product to cloud processing, and preserves ConvoWeave's core rule that source evidence and interpretation are distinct.

## Failure behavior

If remote processing fails, the review screen remains usable as a manual editor. Typed backend errors surface their request ID for support diagnostics. No automatic retry is allowed to bypass the user's original per-meeting approval.

## Production follow-up

The in-memory preview token entry is an internal QA mechanism, not production authentication UX. Production distribution must use the existing OIDC backend boundary with a real mobile identity flow and secure token lifecycle before remote processing can become a normal shipping feature.
