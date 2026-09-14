# Internal preview build and QA handoff

## Purpose

Use internal preview builds for physical-device validation before any production store submission. Preview workflows build installable artifacts only. They do not submit a production release.

## EAS workflows

- `.eas/workflows/preview-ios.yml` builds the iOS `preview` profile.
- `.eas/workflows/preview-android.yml` builds the Android `preview` profile.
- Production submission remains isolated in the existing `release-ios.yml` and `release-android.yml` workflows.

## Release preflight

Run before any internal build:

```bash
npm run release:check
```

After the Expo project has been connected with `eas init`, use:

```bash
npm run release:check:connected
```

The connected check intentionally fails until `app.json` contains a real EAS project ID.

## Preview mobile environment

Safe local-first preview baseline:

```text
EXPO_PUBLIC_APP_ENV=preview
EXPO_PUBLIC_PROCESSING_MODE=local
EXPO_PUBLIC_API_URL=
```

Remote-processing preview:

```text
EXPO_PUBLIC_APP_ENV=preview
EXPO_PUBLIC_PROCESSING_MODE=remote
EXPO_PUBLIC_API_URL=https://<preview-backend-host>
```

`EXPO_PUBLIC_*` values are bundled into the application. Never put access tokens, API keys, passwords, private keys, provider credentials, or other secrets in those variables.

The preview backend access token used by the current internal QA flow is typed into the review screen and held in memory only. It must not be stored in source, EAS public environment values, screenshots, QA manifests, or issue attachments.

## Account-holder prerequisites

Before an EAS internal build can actually run:

1. Log in to Expo/EAS.
2. Run `eas init` and allow Expo to write the real project ID.
3. Configure iOS signing through the authorized Apple Developer account.
4. Configure Android signing through the authorized Expo/Google account path.

Those credentials are external to source control.

## QA handoff

For every installed preview build, record:

- commit SHA
- platform
- EAS build ID
- build profile
- app environment
- processing mode
- device model
- OS version
- test date
- tester
- passed/failed case IDs from `docs/DEVICE_TEST_PLAN.md`
- failure notes and request IDs when applicable

Do not attach real recordings, transcripts, private notes, access tokens, provider keys, or personal meeting data.

## Release gate

Do not advance a preview build toward TestFlight or Play internal testing until all Critical physical-device cases pass on both platforms and any High-severity failure has an explicit disposition.
