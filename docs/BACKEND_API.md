# ConvoWeave Backend Processing Contract

## Purpose

The mobile application must never contain transcription, LLM, storage-provider, or other privileged service credentials.

Remote processing is optional. The default alpha implementation remains local-only. When remote processing is enabled later, every meeting upload requires an explicit per-meeting approval created by a user action.

## Trust boundary

### Mobile client may contain

- public API base URL
- user/session authentication token obtained through an authentication flow
- one-time or short-lived presigned upload URL returned by the ConvoWeave backend
- explicit upload approval for the current meeting

### Mobile client must not contain

- model-provider API keys
- transcription-provider API keys
- cloud storage access keys
- database credentials
- Apple or Google store private keys
- reusable privileged service credentials

## Upload approval

The client uses `UploadApproval` from `src/services/uploadPolicy.ts`.

```ts
type UploadApproval = {
  meetingId: string;
  scope: 'transcript-only' | 'audio-and-transcript';
  approvedAt: string;
  expiresAt?: string;
};
```

Approval is meeting-specific. Approval for one meeting cannot authorize another meeting. An expired approval is invalid. Transcript-only approval cannot be used to upload audio.

The first production implementation should persist the approval event in an audit log on the backend after authentication.

## API shape

### `POST /v1/processing-sessions`

Creates a server-side processing session after the client has locally validated explicit approval.

Request:

```json
{
  "meetingId": "meeting-123",
  "threadId": "thread-456",
  "uploadScope": "audio-and-transcript",
  "approvedAt": "2026-09-13T12:05:00Z",
  "durationMs": 120000
}
```

The authenticated backend must independently authorize the user and meeting. Never trust `approvedAt` or `meetingId` merely because the client sent them.

Response:

```json
{
  "id": "processing-789",
  "meetingId": "meeting-123",
  "status": "created",
  "audioUploadUrl": "https://short-lived-presigned-upload.example/..."
}
```

`audioUploadUrl` should be short-lived, scoped to one object, and use a restricted HTTP method.

### Audio upload

When the approval scope is `audio-and-transcript`, the mobile client uploads the local recording directly to the short-lived URL returned by the backend.

The storage object must be inaccessible by default. The backend should use encryption at rest, minimal retention, and a deletion policy aligned to the user's configured retention setting.

### `GET /v1/processing-sessions/{id}`

Returns HTTP 202 while work is pending.

When complete, return a result containing:

- transcript with stable segment IDs
- proposed structured memory
- source evidence references
- confidence values
- no automatically accepted decisions, commitments, assumptions, or contradictions

The mobile human-review workflow remains authoritative before generated proposals become durable meeting memory.

## Evidence requirements

Every accepted generated object must be traceable to transcript evidence. A contradiction additionally requires both:

1. current evidence
2. prior evidence from the existing thread

If either side is missing, the backend must not emit a durable contradiction candidate.

## Data minimization

The processing endpoint should receive only the data needed for the approved task.

- Do not upload Private Sidecar notes unless the user explicitly promoted them.
- Do not upload unrelated thread history.
- Prefer server-side retrieval of the minimum evidence necessary for comparison.
- Do not keep raw audio indefinitely after processing.

## Authentication

The backend should issue normal user/session tokens. Do not ship a shared app-level bearer secret in the binary.

Recommended production properties:

- short-lived access tokens
- refresh-token rotation or platform-supported session renewal
- device/session revocation
- server-side authorization on every meeting/thread operation
- rate limits
- audit events for upload approval, processing start, result creation, retention deletion, and user corrections

## Provider adapters

Provider-specific calls happen only behind the backend. The mobile `TranscriptionProvider`, `ExtractionProvider`, `ContradictionProvider`, and `BriefingProvider` interfaces should remain provider-neutral.

The backend can change model vendors without changing the durable mobile domain model.
