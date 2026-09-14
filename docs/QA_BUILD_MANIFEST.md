# ConvoWeave QA Build Manifest

Copy this template for each internal preview build. Do not record credentials or real meeting content.

## Build

- Commit SHA:
- Platform: iOS / Android
- EAS build ID:
- Build profile: preview
- App version:
- App environment: preview
- Processing mode: local / remote
- Preview backend host, if remote: hostname only
- Build date:

## Device

- Device model:
- OS version:
- Tester:
- Test date:

## Validation

- Critical cases passed:
- Critical cases failed:
- High cases passed:
- High cases failed:
- Failed case IDs:
- Backend request IDs associated with failures:
- Notes:

## Release decision

- [ ] Internal build is installable and launches cleanly.
- [ ] Microphone permission/denial behavior passed.
- [ ] Recording interruption/recovery passed.
- [ ] Review restart recovery passed.
- [ ] Local/manual workflow passed.
- [ ] Remote processing consent boundary passed, if remote mode was tested.
- [ ] No secrets were observed in the mobile build/network trace.
- [ ] Approved for next internal QA stage.
