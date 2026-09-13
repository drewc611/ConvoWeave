# ConvoWeave Development Workflow

This repository follows a release-oriented trunk workflow. `main` is the stable integration and release branch. New work is performed in short-lived branches tied to GitHub issues and merged through pull requests after automated validation.

## Branches

- `main`: releasable product state. Do not use as a scratch branch.
- `feat/<name>`: product or platform feature slices.
- `fix/<name>`: defect corrections.
- `chore/<name>`: maintenance, dependency, CI, documentation, or infrastructure work.
- `release/<version>`: use only when a coordinated store release needs stabilization separate from ongoing `main` work.

Avoid long-lived `develop` branches. Preview and production are deployment environments, not separate sources of truth.

## Work item flow

1. Create or update a GitHub issue with goal, scope, exclusions, and exit criteria.
2. Branch from the current `main` head.
3. Keep commits narrowly scoped and descriptive.
4. Add or update tests with behavior changes.
5. Open a pull request to `main` before the work is considered complete.
6. Require green CI, security checks, and applicable device/release gates.
7. Merge only after the PR reflects the actual implementation and known limitations.
8. Promote the merged commit through development, preview/internal testing, then production.

## Environments

ConvoWeave has three runtime environments:

- `development`: local development, deterministic/reference processing allowed, development auth allowed.
- `preview`: internal builds and deployed test systems. Use real deployment boundaries and non-production credentials.
- `production`: public/store builds. Development authentication and deterministic processors are forbidden.

The mobile app receives only client-safe `EXPO_PUBLIC_*` configuration. Provider keys, storage credentials, signing keys, database credentials, and authentication secrets remain server-side.

EAS profiles map directly to the three environments. Expo documents that `EXPO_PUBLIC_*` values are embedded into the client bundle, so secrets must never use that prefix.

## Definition of done for a code slice

A change is not done merely because it runs locally. Applicable items must be complete:

- acceptance behavior implemented
- strict TypeScript passes
- unit/contract tests pass
- backend syntax/contract/container checks pass when backend code changes
- dependency audit passes at the configured severity gate
- secret scan and CodeQL pass
- privacy/security behavior remains consistent with shipping disclosures
- user-facing failure states are handled
- documentation and issue/PR state match the code
- no secrets or machine-specific configuration are committed

## API changes

The processing API is versioned under `/v1`.

For breaking API changes:

1. add a new API version or provide a compatibility period
2. update backend contract tests
3. update mobile client tests
4. update `docs/BACKEND_API.md`
5. do not silently repurpose existing fields with incompatible meaning

Every backend error should use the stable error envelope and include a request ID.

## Provider changes

Transcription/extraction providers live behind backend adapters. Provider-specific response shapes must not leak into the durable mobile domain model.

A provider change requires:

- adapter tests
- evidence mapping verification
- failure-mode handling
- retention/data-flow review
- privacy disclosure review before distribution if data practices change

## Release promotion

### Development

Use local or development backend configuration. Feature work can use the deterministic processor for contract validation.

### Preview / internal

Create internal iOS/Android builds. Use a deployed preview backend. Run Issue #5 physical-device QA against the exact commit/build ID.

### Production

Production release requires real authentication, a production processing provider, secure storage/retention implementation, current store privacy declarations, and all Critical device tests passing.

## Repository administration

Enable branch/ruleset protections on `main` when repository administration access is available. At minimum require pull requests and the green CI/security checks before merge. Enable Dependency Graph so the existing Dependency Review workflow can run.
