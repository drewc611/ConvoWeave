# ConvoWeave Mobile Alpha Device Test Plan

## Purpose

Validate the first real mobile alpha on physical iOS and Android devices before TestFlight or Google Play internal testing. This plan focuses on data durability, consent, interruption handling, evidence-backed memory, and privacy boundaries.

## Required devices

Test at least:

- one current iPhone on the latest generally available iOS release
- one older supported iPhone if available
- one current Android phone on the latest generally available Android release
- one additional Android device from a different OEM if available

Use production-like EAS internal builds. Do not use real confidential meeting data.

## Release-blocking acceptance criteria

A build is not release-ready unless all Critical and High cases pass on both iOS and Android.

Severity definitions:

- **Critical**: data loss, privacy boundary failure, app crash during core flow, recording without explicit user action, secret/token exposure
- **High**: broken meeting recovery, broken review persistence, wrong decision lineage, unusable capture/review workflow
- **Medium**: incorrect presentation, recoverable navigation issue, non-core workflow defect

## Test matrix

| ID | Area | Severity | Procedure | Expected result |
| --- | --- | --- | --- | --- |
| CAP-01 | Microphone permission | Critical | Fresh install. Open capture. Do not start recording. | No recording begins and no microphone use occurs. |
| CAP-02 | Permission denial | High | Deny microphone permission, then attempt capture. | App shows denial state and does not crash or create false audio. |
| CAP-03 | Explicit start | Critical | Grant permission and tap Start recording. | Recording begins only after the tap and an unfinished meeting draft is persisted. |
| CAP-04 | Pause/resume | High | Record, pause, wait, resume, then finish. | State and timer behave correctly; completed recording enters review. |
| CAP-05 | OS interruption | Critical | Start recording, trigger a phone call/audio interruption if practical, then return. | App enters interruption-safe state and retains the meeting draft rather than silently discarding it. |
| CAP-06 | Force-kill recovery | Critical | Record for at least 15 seconds, force-kill app, reopen. | Home screen shows Unfinished Capture with checkpointed duration. If a recoverable URI exists, Review recovered draft is offered. |
| CAP-07 | Draft discard | High | Recover an unfinished draft, choose Discard draft. | Draft disappears and a new meeting can be started. |
| CAP-08 | Concurrent draft guard | High | Leave an unfinished draft, attempt to start another meeting. | New capture is blocked until unfinished draft is resolved. |
| REV-01 | Review generation | High | Finish a recording and enter review. | Transcript/proposals render without losing meeting/thread identity. |
| REV-02 | Human acceptance | Critical | Accept one proposal, reject one, edit one. Save memory. | Only accepted proposals become durable memory and edited text is preserved. |
| REV-03 | Review restart | Critical | Modify proposal states, force-kill before Save meeting memory, reopen. | Unfinished Review appears and transcript/proposal states resume exactly. |
| THR-01 | Thread creation | High | Create two meeting threads and record into each. | Meetings remain attached to their selected thread. |
| THR-02 | Thread restart | High | Select/create threads, restart app. | Persisted threads remain available and no cross-thread memory appears. |
| DEC-01 | Decision ledger | High | Accept a decision. Open Decision Ledger. | Decision appears with evidence and active status. |
| DEC-02 | Decision supersede | Critical | In a later meeting, accept a new decision and select an active decision it replaces. | Old decision becomes superseded, new decision remains active, and lineage exists in both directions. |
| DEC-03 | Decision dispute/reverse | High | Mark an existing decision disputed/reversed, then restore if supported by UI. | Status changes persist without deleting historical evidence. |
| CHG-01 | What Changed | High | Complete two meetings in one thread with different accepted memory. | The later meeting shows deterministic changes rather than a rewritten summary. |
| COM-01 | Commitment Radar | High | Accept commitment with owner/due date. | Commitment appears with owner, due state and evidence. |
| COM-02 | Commitment status | High | Complete, cancel and reopen commitments. | State persists after navigation and app restart. |
| ASM-01 | Assumption Register | High | Accept assumption, then mark supported/disproven/expired. | State transition persists with original evidence retained. |
| CON-01 | Contradiction evidence | Critical | Use a test contradiction containing current and prior evidence. | Durable contradiction is created only if both evidence references are present. |
| CON-02 | Contradiction resolution | High | Resolve, dismiss, then reopen a contradiction. | Status changes persist without altering source evidence. |
| SRC-01 | Source proof | Critical | Open source proof for decision/commitment/assumption/conflict. | Meeting reference, speaker when known, timestamp range, segment IDs and quote are shown. |
| PRI-01 | Private Sidecar default | Critical | Create a private note. | Note is stored privately and is excluded from shared context. |
| PRI-02 | Explicit promotion | Critical | Promote a private note. | Only explicit promotion makes the note eligible for shared context. |
| PRI-03 | Return private | Critical | Return promoted note to private. | Shared-context eligibility is removed again. |
| NET-01 | Local-only alpha | Critical | Use app without a configured backend. | App does not attempt remote provider processing and no provider secret is present in client configuration. |
| NET-02 | Upload approval boundary | Critical | Exercise remote adapter with no approval / transcript-only approval. | Audio is never uploaded without matching audio-and-transcript approval for the exact meeting. |
| NET-03 | Presigned upload auth | Critical | Inspect network requests in a test backend build. | ConvoWeave bearer token goes to ConvoWeave backend only, never to presigned upload host. |
| REL-01 | iOS internal build | High | Run EAS preview/internal iOS build after project/account setup. | Install succeeds and core capture/review flow launches. |
| REL-02 | Android internal build | High | Run EAS preview/internal Android build after project/account setup. | Install succeeds and core capture/review flow launches. |

## Restart sequence

For each persistent state type below, create the state, terminate the app from the OS task switcher, relaunch, and verify exact restoration:

1. unfinished recording draft
2. unfinished meeting review
3. meeting thread
4. accepted decision and lineage links
5. commitment and status
6. assumption and status
7. contradiction and status
8. private note and promotion state
9. meeting change set

## Privacy verification

Before external testing:

- inspect the production bundle for provider secrets, private keys, service-account JSON, access tokens, sample transcripts, sample recordings, or user data
- confirm microphone permission text matches actual behavior
- confirm background recording remains disabled
- confirm unpromoted Private Sidecar notes never enter shared provider context
- confirm upload approvals are meeting-specific and expiring approvals are rejected
- confirm app-store privacy disclosures match the actual alpha behavior

## Store-build gate

Proceed to TestFlight and Google Play internal testing only when:

- Mobile CI passes
- CodeQL passes
- Security CI passes
- Dependency audit passes
- all Critical device cases pass on both platforms
- all High core-flow cases pass on both platforms or have an accepted release waiver
- Apple/Google/EAS account-holder tasks in Issue #3 are complete
- public Privacy Policy and Support URLs are live
- real store screenshots are captured from the release candidate

## Evidence to retain

For each device run, record:

- build ID and git commit SHA
- device model and OS version
- test case IDs executed
- pass/fail result
- screenshots for any defect
- reproduction steps
- whether the failure affects stored data or privacy boundaries

Use `docs/DEVICE_VALIDATION_REPORT_TEMPLATE.md` to capture the release-gate baseline, platform runs, privacy checks, failed IDs, and any explicit waivers in a consistent format.

Do not include real meeting audio, transcripts, private notes, credentials, or personal data in GitHub issues.
