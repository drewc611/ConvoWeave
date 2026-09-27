# Security audit — ConvoWeave — 2026-09-27

Part of a 22-repository audit of this account. The cross-repository report (method, pain points, business impact, solution analysis, roadmap) is published at https://claude.ai/artifact/KgdrC9eNyCwdqjvSfwMNuB.

## Summary for this repository

| Severity | Count |
|---|---|
| Low | 4 |

**AI-generated placeholder / default credential findings (★):** CW-1 (open)

Automated passes run against this repository: gitleaks 8.24.2 (full history and tree), the placeholder-credential checker now shipped in `scripts/`, semgrep 1.178.0 (`p/security-audit`, `p/secrets`, `p/owasp-top-ten`, `p/github-actions`), bandit, pip-audit and npm audit where applicable, plus a manual review of auth, input handling, workflows and deployment files.

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Fix | Status |
|---|---|---|---|---|---|---|---|
| CW-1 ★ | Low | Smoke script falls back to a fixed dev token | `backend/openai-live-smoke.mjs:16` | `CONVOWEAVE_DEV_TOKEN: process.env.CONVOWEAVE_DEV_TOKEN \|\| 'operator-local-smoke-token'` | Operator-only script; production config refuses non-OIDC auth, so the token cannot reach production. Still the exact pattern the guardrails ban. | Require the variable; fail with a usage message when unset. | open |
| CW-2 | Low | MCP dev token compared without constant time | `integrations/mcp/auth.mjs:87` | `token !== config.devToken` | Dev mode only; timing noise makes it impractical remotely. | Reuse `safeTokenEqual` from the backend. | open |
| CW-3 | Low | Origin derived from the Host header | `backend/server.mjs:132,140` | `origin = config.publicBaseUrl ?? \`http://${host}\`` | Behind TLS termination the mobile client can receive a plaintext upload URL. | Require `PUBLIC_BASE_URL` in preview/production. | open |
| CW-4 | Low | No lockfiles; unverified binary in publish | `backend/Dockerfile:11; integrations/mcp/package.json; .github/workflows/publish-mcp-registry.yml:51` | `npm install --omit=dev`; caret ranges; `curl -L .../latest/download/... \| tar xz` with `id-token: write` | Silent minor-version supply-chain drift; unpinned publisher binary. | Commit lockfiles, use `npm ci`, pin and checksum the publisher. | open |

## Guardrails added in this change

- `scripts/check-placeholder-secrets.sh` — fails the build on placeholder credentials, secret defaults, disabled-auth defaults, `debug=True`, literal secret assignments, private keys and committed `.env` files.
- `.gitleaks.toml` — gitleaks defaults plus custom placeholder rules and a fixture allowlist.
- `.github/workflows/secret-scan.yml` — runs both on every push and pull request and weekly over full history (SHA-pinned actions).
- `.pre-commit-config.yaml` — the same checks locally; run `pre-commit install` once.
- `docs/security/AI-CODING-GUARDRAILS.md` — the binding rules for any AI-assisted change, with references.
- A "Security rules for AI-assisted changes" section in `CLAUDE.md` (and `AGENTS.md` / Copilot instructions where present).
- `.gitignore` rules for `.env`, keys and Terraform state where they were missing.

See the cross-repository report for the fail-closed pattern by language and the prioritised fix list.
