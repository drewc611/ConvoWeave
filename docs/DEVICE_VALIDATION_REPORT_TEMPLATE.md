# ConvoWeave Mobile Alpha Device Validation Report Template

Use one copy of this template per validated build/commit for Issue #5 or equivalent internal release tracking. Do not include real meeting audio, transcripts, private notes, credentials, or personal data.

## Validated engineering baseline

- Date:
- Git commit SHA:
- EAS project linked:
- Preview/internal iOS build ID:
- Preview/internal Android build ID:

- [ ] Mobile CI green for this commit
- [ ] CodeQL green for this commit
- [ ] Security CI green for this commit
- [ ] Dependency audit green for this commit
- [ ] EAS preview/internal builds available

## iOS run

- Device model:
- OS version:
- Build profile / build ID:
- Executed Critical case IDs:
- Executed High core-flow case IDs:
- Failed case IDs:
- Release waiver required:

- [ ] Force-kill during recording recovered unfinished capture
- [ ] Force-kill during review recovered exact review state
- [ ] Microphone denial behavior verified
- [ ] Microphone interruption behavior verified
- [ ] Decision Ledger verified on device
- [ ] What Changed verified on device
- [ ] Commitment Radar verified on device
- [ ] Assumption Register verified on device
- [ ] Contradiction Review verified on device
- [ ] Private Sidecar verified on device

## Android run

- Device model:
- OS version:
- Build profile / build ID:
- Executed Critical case IDs:
- Executed High core-flow case IDs:
- Failed case IDs:
- Release waiver required:

- [ ] Force-kill during recording recovered unfinished capture
- [ ] Force-kill during review recovered exact review state
- [ ] Microphone denial behavior verified
- [ ] Microphone interruption behavior verified
- [ ] Decision Ledger verified on device
- [ ] What Changed verified on device
- [ ] Commitment Radar verified on device
- [ ] Assumption Register verified on device
- [ ] Contradiction Review verified on device
- [ ] Private Sidecar verified on device

## Privacy / network confirmation

- [ ] No provider secrets present in the mobile build
- [ ] Background recording disabled in the built app
- [ ] Unpromoted Sidecar notes do not enter shared context
- [ ] Audio upload blocked without matching `audio-and-transcript` approval
- [ ] Backend bearer token never sent to presigned upload hosts

## Notes

- Screenshots or traces captured for failures:
- Reproduction steps for failures:
- Stored-data or privacy-boundary impact:

## Release gate decision

- [ ] All Critical cases passed on iOS
- [ ] All Critical cases passed on Android
- [ ] All High core-flow cases passed on iOS or have explicit waiver
- [ ] All High core-flow cases passed on Android or have explicit waiver
- [ ] Issue #3 store-account steps complete
- [ ] Ready to proceed to internal distribution
