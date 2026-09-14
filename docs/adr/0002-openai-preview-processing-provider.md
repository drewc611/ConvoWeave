# ADR 0002: OpenAI as the Preview Processing Provider

**Status:** Accepted for preview only

**Date:** 2026-09-13

## Context

ConvoWeave has a stable local-first product and a provider-neutral backend processing boundary. The next development requirement is to exercise that boundary with real transcription and structured-memory extraction without making a vendor a permanent dependency or putting provider credentials in the mobile application.

The preview integration needs:

- file-based meeting transcription
- reliable schema-constrained extraction
- low operational complexity for an initial preview
- a backend-only credential model
- the ability to disable provider response storage where supported
- a clean replacement boundary

Current OpenAI documentation lists `gpt-transcribe` as a high-accuracy file transcription model and GPT-5.6 Luna as a cost-sensitive model with Structured Outputs support. The Responses API supports JSON Schema structured output, and the transcription API accepts common meeting-audio formats.

## Decision

For the preview environment, ConvoWeave will implement an OpenAI backend adapter with:

- transcription model default: `gpt-transcribe`
- extraction model default: `gpt-5.6-luna`
- extraction through the Responses API with strict JSON Schema
- `store: false` on extraction responses
- backend-only `OPENAI_API_KEY`
- configurable model IDs, API base URL and timeout through backend environment variables

The mobile application does not call OpenAI directly and never contains the provider key.

The provider returns only proposed memory. Human review remains authoritative before decisions, commitments or assumptions become durable ConvoWeave state.

Contradictions are intentionally excluded from this provider slice because the provider request does not contain the prior evidence required by ConvoWeave's contradiction invariant.

## Evidence mapping

The first preview implementation creates one stable ConvoWeave transcript segment for the completed transcript. Every extracted proposal must include an exact transcript quote. ConvoWeave validates that the quote actually exists in the returned transcript before accepting the provider output into the review contract.

This is less precise than word- or speaker-level evidence. Improving diarization and timestamp precision is a separate slice and must not change the durable evidence model.

## Security and privacy consequences

- The API key remains backend-only and is never an `EXPO_PUBLIC_*` value.
- Normal CI uses mocked HTTP responses and requires no external credential.
- Provider upstream error bodies are not returned to the mobile client.
- Raw transcript/audio content is not written to ConvoWeave application logs by this adapter.
- `store: false` disables stored Responses retrieval behavior but must not be interpreted as a guarantee of zero provider-side retention. Provider data controls, contractual terms and applicable retention settings must be reviewed before public production use.
- Remote processing remains opt-in per meeting through the existing upload-approval boundary.

## Cost and operational consequences

The selected defaults are intended to keep preview costs lower than using a flagship reasoning model for a well-defined extraction task. Model IDs remain environment-configurable so cost, latency or accuracy can be tuned without modifying feature code.

No automatic fallback sends meeting content to a different external provider. If this adapter fails, the request fails safely and the existing local/manual workflow remains available.

## Alternatives considered

### Keep deterministic processing only

Rejected for the next slice because it cannot validate the real external-provider boundary or transcription quality.

### Call a provider directly from the mobile app

Rejected because it would expose privileged credentials or require a materially different client security architecture.

### Make OpenAI the permanent production provider

Not decided. Preview success does not establish permanent vendor selection. Production selection must consider privacy requirements, retention controls, regional processing, cost, reliability, transcription quality and operational ownership.

## Follow-up

Before production remote processing:

1. implement production authentication/authorization
2. implement durable backend session/object storage and retention deletion
3. run preview device/network QA
4. review provider data controls and update store privacy disclosures
5. decide whether to retain, replace or multi-source the preview provider through a separate ADR
