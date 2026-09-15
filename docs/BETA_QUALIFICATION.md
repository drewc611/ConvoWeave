# ConvoWeave Beta Qualification

Current candidate: `0.3.0-beta.1`

## Automated gates

The repository must prove all of the following against the candidate commit:

- Mobile typecheck and unit tests pass
- Release configuration preflight passes
- Dependency audit passes
- Security CI passes
- CodeQL passes
- Android native project generation succeeds
- Android APK builds successfully
- Android API 35 emulator boots
- Beta APK installs and registers under `com.convoweave.mobile`
- App process launches and remains running
- App appears in resumed activity state
- No fatal launch error appears in application logcat
- Runtime screenshot, activity state, UI dump, and logcat evidence are retained

## Physical-device gates

Emulator coverage does not replace these checks:

- real microphone permission and recording on Android and iOS
- recording interruption handling
- force-kill and unfinished-capture recovery, including typed notes
- review-state recovery after termination
- responsive layout and keyboard behavior
- Decision Ledger
- What Changed
- Commitment Radar
- Assumption Register
- Contradiction Review
- Private Sidecar isolation and explicit promotion
- remote-processing upload consent, token lifecycle, request-ID errors, proposed-item review, and local/manual fallback when remote processing is enabled

Use `docs/DEVICE_TEST_PLAN.md` for the case matrix and `docs/DEVICE_VALIDATION_REPORT_TEMPLATE.md` for retained evidence.

## Signed distribution gates

The following require account-holder access and are tracked in Issue #3:

- Expo/EAS project initialization and real project ID
- signed Android internal build / AAB
- signed iOS internal build
- Apple Developer and App Store Connect setup
- TestFlight upload
- Google Play Console setup and internal-track upload
- final store privacy, Data Safety, age-rating, and listing confirmation

## Beta status rule

`0.3.0-beta.1` may be distributed as an internal Android beta APK once the automated Android emulator gate is green. It must not be described as App Store/TestFlight or Google Play ready until the signed distribution and physical-device gates are complete.

Public release is blocked by any unresolved Critical privacy, security, data-loss, recording-consent, or core-flow failure.
