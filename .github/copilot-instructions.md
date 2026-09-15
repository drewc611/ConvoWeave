# ConvoWeave Copilot Instructions

Before changing this repository, read `AGENTS.md`, `CODEX.md`, `docs/AGENT_GUARDRAILS.md`, `docs/AGENT_OPERATING_MODEL.md`, and `docs/PRODUCT_STRATEGY.md`.

Non-negotiable rules:

- Never push directly to `main`. Work through a branch and pull request.
- Never force-push, rewrite history, bypass CI, disable security checks, or weaken tests to make a build pass.
- Never commit secrets, credentials, signing material, real recordings, transcripts, private meeting data, `.env` files, or access tokens.
- Never change `LICENSE`, repository visibility, billing, pricing, legal terms, Apple/Google/Expo account state, signing configuration, or GitHub administration settings without explicit owner action.
- Preserve the core product invariants: evidence and generated interpretation remain separate; generated proposals require review; decisions are versioned and never silently overwritten; contradictions retain evidence on both sides; Private Sidecar content stays isolated unless explicitly promoted; remote processing requires explicit consent; bearer/provider credentials never ship in the mobile bundle.
- Do not introduce background recording.
- Do not auto-upload meeting audio or transcript data.
- Do not merge or recommend merging a known Critical or High security/privacy defect.
- Do not perform destructive migrations unless a tested rollback/recovery path is included.
- Keep changes narrowly scoped. Prefer one objective per PR.
- Run the relevant typecheck, tests, security checks, release preflight, and build/runtime validation before declaring work complete.
- If a requested change conflicts with these rules, stop and surface the conflict instead of improvising around it.

Agent-generated PRs must be drafts by default and require human review before merge.