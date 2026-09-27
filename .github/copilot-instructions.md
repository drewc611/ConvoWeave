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
## Security rules for AI-assisted changes (binding)

Added by the 2026-09 security audit. Full text and references in
`docs/security/AI-CODING-GUARDRAILS.md`; findings in `SECURITY-AUDIT-2026-09.md`.

- Never write a literal secret, token, password or API key anywhere in the repo. Read it from the environment and **fail closed** when it is missing (`os.environ["X"]`, `${X:?required}`). No `getenv("X", "dev-secret")`, no `|| "changeme"`, no `${X:-password}`.
- Never emit placeholder credentials (`change-me`, `dev-secret`, `password123`, `admin123`, `letmein`, `supersecret`). If a value is unknown, leave it required and unset, and say so in the PR.
- Authentication defaults on. Debug servers (`debug=True`) are never committed. Containers run as a non-root `USER`.
- Pin every GitHub Action to a full commit SHA; pass `${{ github.event.* }}` through `env:`, never into `run:`.
- Before committing, run `bash scripts/check-placeholder-secrets.sh` and `gitleaks dir . --config .gitleaks.toml`; both must be clean. CI runs the same checks in `.github/workflows/secret-scan.yml`.
