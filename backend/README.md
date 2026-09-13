# ConvoWeave Reference Backend

This directory contains a dependency-free development implementation of the processing contract in `../docs/BACKEND_API.md`.

It exists to validate the mobile-to-backend trust boundary before a production transcription/model/storage provider is selected. It is **not** a production backend.

## What it implements

- authenticated `POST /v1/processing-sessions`
- one-time opaque audio upload URLs
- unauthenticated upload PUTs that do not need the ConvoWeave bearer token
- authenticated `GET /v1/processing-sessions/{id}`
- HTTP 202 while a session is waiting for audio
- deterministic evidence-backed mock transcript/review output after upload
- request-size limits
- metadata-only audit logging with SHA-256 of received test payloads

## What it intentionally does not implement

- user accounts or real authentication
- persistent database/storage
- production object storage or cloud presigning
- real transcription
- real LLM extraction
- transcript-only processing
- provider API keys
- multi-tenant authorization
- production retention/deletion jobs
- production rate limiting

Do not deploy this reference process as an internet-facing production service.

## Run locally

Use a development-only bearer token supplied through the environment:

```bash
CONVOWEAVE_DEV_TOKEN="replace-with-a-local-dev-token" npm --prefix backend start
```

The default listener is `127.0.0.1:8787`. Override `HOST` or `PORT` through the environment when needed for local device testing.

Never commit the token.

## Test

From the repository root:

```bash
npm test
```

Or run only the backend tests:

```bash
npm --prefix backend test
```

## Mobile integration

The mobile app should continue using `mockProviders` by default.

For controlled development integration:

1. create an `HttpProcessingClient` using the reference backend URL
2. provide a normal short-lived application/session token through `accessTokenProvider`
3. create `createRemoteProviderBundle(client, approvalProvider)`
4. ensure `approvalProvider` returns an explicit, meeting-specific `audio-and-transcript` approval only after a user action
5. switch the app provider bundle deliberately in a development-only configuration

Do not make the remote adapter an implicit fallback.

## Production replacement

A production backend must independently authenticate and authorize every user/meeting operation, persist approval/audit events, issue genuinely short-lived restricted upload URLs, store data encrypted and private by default, enforce retention/deletion, and keep all model/transcription/storage credentials server-side.
