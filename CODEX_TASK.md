# Codex Continuation Task

Work from `build/mobile-foundation` and Issue #2.

## Start here

1. Read `LICENSE`, `CODEX.md`, `docs/PRODUCT_STRATEGY.md`, and `README.md`.
2. Run `npm install`, `npm run typecheck`, and `npm test`.
3. Fix CI before adding features.
4. Keep evidence separate from AI interpretation.
5. Never silently overwrite decisions or promote private notes into shared context.

## Next build slice

Implement persistent meeting threads, review-resume state, and the first real `What Changed?` screen using `src/features/decisions/decisionDiff.ts`.

Then continue through the work queue in GitHub Issue #2.

Do not add model-provider API keys to the mobile application. Future model calls must sit behind a backend/provider boundary.
