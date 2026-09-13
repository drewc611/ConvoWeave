# ADR 0001: Runtime Environments and Provider Boundary

**Status:** Accepted

**Date:** 2026-09-13

## Context

ConvoWeave is a mobile meeting-memory product with privacy-sensitive audio, transcripts, structured decisions, commitments, assumptions, contradictions, and private notes. The application must support local development, internal testing, and production distribution without embedding privileged provider credentials in the mobile bundle or coupling feature code to a specific AI/transcription vendor.

The initial alpha intentionally used local/manual flows and a deterministic development processor. As remote processing is introduced, configuration and provider selection must become explicit deployment concerns.

## Decision

ConvoWeave will use three explicit runtime environments:

- `development`
- `preview`
- `production`

The mobile application receives client-safe configuration only through `EXPO_PUBLIC_*` values. Remote processing is off unless `EXPO_PUBLIC_PROCESSING_MODE=remote` and an API URL is supplied. Production API URLs must use HTTPS.

The backend owns all privileged credentials and provider integrations. HTTP/session behavior is separated from processing providers through a processor adapter. Development may use the deterministic adapter. Production is prevented from booting with development-token authentication or the deterministic processor.

The processing API remains provider-neutral and versioned under `/v1`. Durable mobile models remain independent from provider-specific payloads.

## Consequences

### Positive

- provider changes do not require feature-screen changes
- secrets stay out of the client bundle
- preview and production can use different endpoints/credentials without source edits
- accidental deterministic/development production deployments fail closed
- CI can validate backend and mobile contracts independently

### Tradeoffs

- additional configuration and adapter code exists before a real production provider is connected
- production remote processing remains unavailable until a production authentication adapter and processing provider are implemented
- developers must manage environment values deliberately rather than relying on implicit defaults

## Non-decisions

This ADR does not select the production transcription/model vendor, cloud platform, authentication provider, database, or object storage service. Those decisions require separate ADRs because they affect cost, privacy, retention, latency, and operational responsibilities.
