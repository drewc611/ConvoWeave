# ConvoWeave

**The AI companion that remembers your meetings.**

ConvoWeave is a mobile-first meeting memory and decision system. It is designed to preserve what changed across conversations, who committed to what, why decisions were made, and which assumptions or contradictions still need attention.

## Current alpha

The `build/mobile-foundation` branch now includes:

- real on-device microphone capture with explicit permission and recording notice
- pause, resume, stop, duration tracking, and interruption handling
- persistent local audio files for recorded meetings
- SQLite-backed durable local state
- strict domain models for meetings, evidence, decisions, commitments, assumptions, contradictions, and private notes
- human review before AI-generated proposals become durable memory
- source evidence retained with accepted decisions, commitments, and assumptions
- deterministic decision-diff logic for the future `What Changed?` experience
- provider interfaces that keep transcription/extraction logic out of UI components
- mock providers for safe local development
- CI typechecking and unit tests

## Development

```bash
npm install
npm run typecheck
npm test
npm start
```

Then open the app in Expo Go or a compatible development build.

## Architecture

Read these first:

- `CODEX.md`
- `docs/PRODUCT_STRATEGY.md`
- `LICENSE`

The application intentionally separates raw evidence from generated interpretation. Important AI output must retain source references. Decisions are versioned business objects, not mutable summary text.

## Privacy direction

The current alpha keeps audio and persisted state on device. The mock AI provider does not upload audio. A future backend/model integration must use an explicit upload policy and must not put provider credentials in the mobile client.

## Proprietary software

Copyright © 2026 Andrew Michael Clark. All rights reserved. See `LICENSE`.
