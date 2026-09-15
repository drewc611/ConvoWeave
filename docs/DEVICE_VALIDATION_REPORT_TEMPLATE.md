# ConvoWeave Mobile Device Validation Report

Use one copy of this report per release candidate and validated commit. Do not attach real meeting audio, transcripts, private notes, credentials, tokens, or personal data.

## Validated engineering baseline

- Date:
- Git commit SHA:
- Release version:
- EAS project linked: Yes / No
- iOS internal build ID:
- Android internal build ID:
- Android emulator QA run ID:

- [ ] Mobile CI green for this commit
- [ ] CodeQL green for this commit
- [ ] Security CI green for this commit
- [ ] Dependency audit/release preflight green for this commit
- [ ] Android emulator install/launch QA green for this commit
- [ ] Signed/internal builds available for every platform being validated

## iOS physical-device run

- Device model:
- OS version:
- Build profile / build ID:
- Executed Critical case IDs:
- Executed High core-flow case IDs:
- Failed case IDs:

- [ ] Force-kill during recording recovered unfinished capture and typed notes
- [ ] Force-kill during review recovered exact review state
- [ ] Microphone denial behavior verified
- [ ] Microphone interruption behavior verified
- [ ] Decision Ledger verified
- [ ] What Changed verified
- [ ] Commitment Radar verified
- [ ] Assumption Register verified
- [ ] Contradiction Review verified
- [ ] Private Sidecar verified
- [ ] Responsive layout and keyboard behavior verified

## Android physical-device run

- Device model:
- OS version:
- Build profile / build ID:
- Executed Critical case IDs:
- Executed High core-flow case IDs:
- Failed case IDs:

- [ ] Force-kill during recording recovered unfinished capture and typed notes
- [ ] Force-kill during review recovered exact review state
- [ ] Microphone denial behavior verified
- [ ] Microphone interruption behavior verified
- [ ] Decision Ledger verified
- [ ] What Changed verified
- [ ] Commitment Radar verified
- [ ] Assumption Register verified
- [ ] Contradiction Review verified
- [ ] Private Sidecar verified
- [ ] Responsive layout and keyboard behavior verified

## Privacy and network boundary verification

- [ ] Production/mobile bundle inspected for provider secrets, private keys, service-account JSON, access tokens, sample transcripts, recordings, or user data
- [ ] Background recording remains disabled
- [ ] Unpromoted Private Sidecar notes remain excluded from shared/provider context
- [ ] Audio upload is blocked unless an unexpired `audio-and-transcript` approval exists for the exact meeting
- [ ] Transcript-only approval never permits audio upload
- [ ] Expired or mismatched upload approval is rejected
- [ ] ConvoWeave bearer token is sent only to the ConvoWeave backend, never to a presigned upload host
- [ ] Proposed remote-processing items require human review before becoming durable memory
- [ ] Remote-preview errors expose a stable request ID suitable for support/debugging
- [ ] Manual/local fallback remains usable when remote preview fails or is unavailable
- [ ] Preview access token is not persisted after leaving/restarting the app
- [ ] Microphone permission text and store privacy disclosures match actual behavior

## Remote-preview evidence

- Backend/environment tested:
- Upload approval scope tested:
- Proposed-item review result:
- Error/fallback scenario tested:
- Request ID captured for any failure:
- Token non-persistence verification method:

## Defects and evidence

For each failure, record only non-sensitive evidence.

- Failed test ID:
- Severity:
- Reproduction steps:
- Screenshot/trace reference:
- Request ID, when applicable:
- Stored-data impact:
- Privacy-boundary impact:
- Tracking issue:

## Release waivers

A High-severity case may be waived only with an explicit, auditable disposition. Critical failures cannot be waived for beta promotion.

For each waiver:

- Test ID / defect:
- Scope of waiver:
- Rationale:
- Risk accepted:
- Approver:
- Approval date:
- Tracking issue/link:
- Expiration or follow-up milestone:

## Store and distribution prerequisites

- [ ] Apple/Google/EAS account-holder tasks required for this candidate are complete
- [ ] Public Privacy Policy URL is live and matches current behavior
- [ ] Public Support URL is live
- [ ] Public account/data deletion information is live where required
- [ ] App Privacy / Data Safety answers were revalidated against the exact signed build
- [ ] Real store screenshots were captured from the validated release candidate
- [ ] Signed internal iOS build can be produced and installed
- [ ] Signed internal Android build can be produced and installed

## Release gate decision

- [ ] All Critical cases passed on iOS
- [ ] All Critical cases passed on Android
- [ ] All High core-flow cases passed on iOS or have an explicit approved waiver above
- [ ] All High core-flow cases passed on Android or have an explicit approved waiver above
- [ ] No unresolved Critical/High security or privacy defect remains
- [ ] Remote-preview gate passed if remote processing will be enabled for this release
- [ ] Store/distribution prerequisites above are complete

Decision: GO / NO-GO

Decision owner:

Decision date:

Notes:
