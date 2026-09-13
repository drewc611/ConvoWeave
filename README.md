# ConvoWeave

**Your conversations. Connected.**

ConvoWeave is a mobile-first AI meeting companion designed to turn conversations into trusted, versioned operational memory.

Instead of treating each meeting as an isolated transcript, ConvoWeave tracks how decisions, commitments, assumptions, and unresolved questions evolve across meetings.

## Current build

The first mobile prototype includes:

- Today view with meeting capture entry point
- What Changed pre-meeting brief
- Decision Ledger concepts
- decision lineage across meetings
- Commitment Radar
- contradiction detection surface
- Assumption Register
- source-proof expansion for AI claims
- persistent meeting thread concept
- private sidecar notes
- interactive mobile navigation and state

## Product thesis

Transcription, summaries, action items, and meeting chat are baseline features.

ConvoWeave is being built around a different question:

> What changed, why did it change, who committed to what, and what still needs resolution?

See [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md) for the product roadmap and differentiation strategy.

## Engineering handoff

If using Codex or another coding agent, read [`CODEX.md`](CODEX.md) before modifying the application.

The handoff defines:

- product invariants
- immediate build sequence
- domain model direction
- evidence requirements
- private/shared data boundaries
- alpha definition of done

## Stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript

## Run locally

Requirements:

- Node.js 22.13 or later for Expo SDK 57
- npm
- Expo-compatible iOS or Android development environment

```bash
npm install
npm start
```

Then choose the iOS, Android, or supported Expo development target.

Type checking:

```bash
npm run typecheck
```

## Build order

1. Mobile shell and product model
2. Real mobile audio capture
3. Local durable/offline state
4. Meeting review and evidence workflow
5. Transcription/extraction provider interfaces
6. Meeting threads and Decision Ledger
7. Decision Diff and contradiction proposals
8. Pre-meeting intelligence
9. Integrations after the core memory loop is proven

## Repository status

Early product development. The UI currently uses representative local data to demonstrate the intended experience before backend and model-provider integration.

## License

**Proprietary. All rights reserved.**

This source code is not open source. See [`LICENSE`](LICENSE). Access to the repository does not grant permission to copy, modify, distribute, sublicense, sell, or commercially exploit the code.
