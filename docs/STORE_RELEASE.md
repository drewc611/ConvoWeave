# App Store and Google Play Release Runbook

## Release target

The first external-distribution milestone is:

1. Apple TestFlight
2. Google Play internal testing
3. Google Play closed testing if required for the developer account
4. Public production only after the alpha is functionally complete and privacy/store metadata match actual behavior

## Current technical readiness

The app uses Expo SDK 57, which targets Android API 36. The configured identifiers are:

- iOS bundle identifier: `com.convoweave.mobile`
- Android application ID: `com.convoweave.mobile`

Do not change these after store records are created unless intentionally creating a separate app.

## Expo / EAS setup

The repository contains:

- `eas.json`
- `.eas/workflows/release-ios.yml`
- `.eas/workflows/release-android.yml`

Initial account setup:

```bash
npm install --global eas-cli
eas login
eas init
eas build:configure
```

`eas init` links the repository to an Expo/EAS project and writes the EAS project identifier to app configuration. Do not invent an EAS project ID manually.

## Apple setup

Required before the iOS workflow can submit:

- active paid Apple Developer Program membership
- Apple Developer/App Store Connect access
- App Store Connect app record using bundle ID `com.convoweave.mobile`
- accepted Apple agreements
- App Store Connect connection configured in EAS
- production signing credentials managed through EAS or Apple

Build and submit manually if needed:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

Or run the repository workflow:

```bash
eas workflow:run .eas/workflows/release-ios.yml
```

The first goal is TestFlight. Public App Review requires the build plus required metadata, screenshots, privacy disclosures, category, age rating, support URL, and privacy-policy URL.

## Google Play setup

Required before Android submission:

- verified Google Play Developer account
- app record in Play Console using package `com.convoweave.mobile`
- Google service account authorized for Play submission and connected to EAS
- completed app-content declarations needed for the selected testing track

Build and submit manually if needed:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

Or run:

```bash
eas workflow:run .eas/workflows/release-android.yml
```

The production profile currently submits Android builds to the `internal` track with draft release status.

## Google personal-account testing gate

If the Play developer account is a personal account created after November 13, 2023, production access requires a closed test with at least 12 opted-in testers continuously for at least 14 days, followed by a production-access application.

Organization accounts and older personal accounts are subject to their applicable Play Console requirements rather than this specific new-personal-account gate.

## Store metadata already prepared

See `store/STORE_LISTING.md` for initial App Store and Google Play copy.

Before public submission, provide real public HTTPS URLs for:

- privacy policy
- user support

The repository contains `store/PRIVACY_POLICY.md` as the baseline policy text. It must remain accurate to the exact shipping data flows.

## Privacy disclosures

Current release behavior:

- microphone access is explicit and user initiated
- meeting audio and application state are stored locally
- mock AI providers do not upload recorded meeting audio
- no third-party advertising use is implemented

If cloud transcription, remote AI processing, user accounts, analytics, crash reporting, synchronization, or other remote data collection is added, update all of these together before release:

1. in-app disclosures
2. privacy policy
3. Apple App Privacy answers
4. Google Play Data safety answers
5. reviewer notes

## Required visual assets

Before public store review, create from the real release candidate:

- production app icon
- App Store screenshots
- Google Play phone screenshots
- Google Play feature graphic
- optional App Store preview / Play promo video

Do not use screenshots depicting features that are not available in the submitted build.

## Release checklist

- [ ] Repository private or intentionally public
- [ ] Main branch protected with required checks
- [ ] Mobile CI green
- [ ] CodeQL green or plan limitation documented
- [ ] Dependency review green or plan limitation documented
- [ ] No secrets committed
- [ ] Production app icon finalized
- [ ] Real-device iOS test completed
- [ ] Real-device Android test completed
- [ ] Recording consent flow verified
- [ ] Microphone denial flow verified
- [ ] State survives restart
- [ ] Privacy policy hosted at public HTTPS URL
- [ ] Support page hosted at public HTTPS URL
- [ ] Apple privacy answers match shipping build
- [ ] Google Data safety answers match shipping build
- [ ] Store screenshots captured from shipping build
- [ ] Apple Developer account active
- [ ] Google Play account verified
- [ ] EAS project linked
- [ ] Apple connection added to EAS
- [ ] Google service account added to EAS
- [ ] TestFlight build uploaded
- [ ] Play internal-test build uploaded
- [ ] Closed-test requirement completed if applicable
- [ ] Public production review submitted only after functional alpha definition is met
