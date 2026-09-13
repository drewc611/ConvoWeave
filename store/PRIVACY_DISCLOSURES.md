# Store Privacy Disclosure Baseline

This file describes the current alpha behavior. Re-verify every answer against the shipping binary immediately before submission.

## Apple App Privacy baseline

Current implementation intent:

- Microphone access: yes, only after explicit user action and permission
- Recorded meeting audio: stored locally on device in the current release
- Automatic cloud upload of meeting audio: no
- Third-party advertising: no
- Cross-app tracking: no
- Sale of meeting content: no
- Analytics SDK: none currently configured
- Crash-reporting SDK: none currently configured
- Account/login data: none currently configured
- Precise location: not used
- Contacts: not used
- Photos: not used

If any backend, analytics, authentication, crash reporting, cloud transcription, remote AI processing, sync, or telemetry is added, reassess Apple's data collection categories before release.

## Google Play Data safety baseline

Current implementation intent:

- User-provided audio is handled on device after explicit recording action
- No current automatic transmission of meeting recordings off-device
- No advertising data use
- No current user account collection
- No current location collection
- No current contacts collection

Google requires the Data safety form for apps beyond internal-only testing, including apps that collect no user data. The form and privacy policy must agree with the shipping application.

## Sensitive-permission disclosure

Microphone permission purpose:

"ConvoWeave uses microphone access only when you explicitly start a meeting recording. Recording is used to create meeting content for review and is not started automatically."

## Release blocker

Do not submit to public production review if these statements are no longer true. Update this file, `store/PRIVACY_POLICY.md`, in-app disclosures, and both stores' privacy forms together whenever data flow changes.
