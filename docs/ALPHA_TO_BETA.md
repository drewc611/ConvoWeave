# ConvoWeave Alpha to Beta Qualification

Current release candidate: `0.3.0-alpha.1`

Current alpha package source: merged `main` SHA `ac4b0fbc45288da8eb79b8b28ceb2f02a80edca9`.

## Automated gates

These gates can be proven in CI without an account-holder device or store login:

- Mobile typecheck and unit tests
- Release configuration preflight
- Security CI and CodeQL
- Android native project generation
- Android APK build and release package assembly
- APK checksum and build manifest generation
- Android emulator install and launch smoke test
- Package registration and foreground-process verification
- Runtime log capture and fatal-launch check
- Emulator screenshot capture for QA evidence

## Physical-device gates

These remain mandatory before beta promotion because an emulator cannot prove hardware and lifecycle behavior:

- Real microphone permission and recording on Android and iOS
- Recording interruption behavior
- Force-kill and unfinished-capture recovery
- Review-state recovery after termination
- Real-device responsive layout and keyboard behavior
- Decision Ledger, What Changed, Commitment Radar, Assumption Register, Contradiction Review and Private Sidecar flows
- Remote-preview upload consent and token-lifecycle checks when the remote processing backend is enabled

## Account-holder gates

These cannot be completed from repository automation alone:

- Expo/EAS project initialization and production signing
- Apple Developer / App Store Connect enrollment, agreements and TestFlight upload
- Google Play Console enrollment, verification and internal-test upload
- Store privacy, Data Safety, age-rating and listing metadata confirmation
- GitHub owner/admin repository settings tracked in Issue #4

## Beta promotion rule

Do not label the app beta merely because CI passes. Promote from alpha only after:

1. Android emulator QA is green for the release candidate.
2. Critical physical-device cases pass on Android and iOS.
3. High-priority core-flow cases pass or have an explicit release disposition.
4. No unresolved Critical/High security or privacy defect remains.
5. Signed internal distribution builds can be produced for both stores.

Once all five conditions are satisfied, create the next prerelease as `0.3.0-beta.1` and move distribution work to TestFlight and Google Play internal testing.
