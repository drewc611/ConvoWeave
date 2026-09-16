# GitHub-native ConvoWeave Agent Team

ConvoWeave uses repository-scoped GitHub Copilot custom agents plus a CEO-led GitHub Agentic Workflow. The operating model is intentionally defense-in-depth and deliberately limits autonomous parallelism.

## Specialist agents

Profiles live in `.github/agents/`:

- CEO
- Chief Architect
- Product
- Mobile Engineering
- Backend & MCP
- Security & Privacy
- QA & Release
- DevOps & SRE

Each profile has a restricted role and must follow the root governance harness. They are explicitly invoked by the team orchestrator or by a human. They do not independently schedule competing repository work.

## Daily GitHub team orchestrator

The single automated source is `.github/workflows/agent-team-daily.md`. `agentic-compile.yml` compiles it into the hardened `.github/workflows/agent-team-daily.lock.yml` GitHub Actions workflow.

The daily parent agent acts as CEO and coordinates the specialist agents in sequence:

1. CEO identifies at most three outcomes and removes duplicate/stale work from consideration.
2. Chief Architect checks architecture, evidence lineage, privacy/data boundaries, recoverability, and rollback safety.
3. Product verifies current-strategy fit and acceptance criteria.
4. Mobile Engineering or Backend & MCP proposes a narrow implementation only when justified.
5. Security & Privacy has stop authority for material security/privacy violations.
6. QA & Release defines required tests and evidence.
7. DevOps & SRE participates only when CI/CD, deployment, runtime health, or observability is involved.

The orchestrator may select no more than one implementation objective in a run.

## Harness

- agent runtime permissions are read-only
- write operations use GitHub Agentic Workflows safe outputs
- automated code work is capped at one draft PR per run
- automated status/escalation is capped at one issue per run
- the draft PR allowlist is limited to application, test, backend, MCP, and product-documentation surfaces
- `.github/**`, `LICENSE`, signing/store/account files, and every unlisted path are outside the maintenance write allowlist
- protected-file handling falls back to an issue instead of forcing a patch
- agents never merge their own work
- humans retain merge authority
- normal Mobile CI, Security CI, CodeQL, release checks, and CODEOWNERS review remain independent gates
- owner-only account/admin/legal/signing/billing/privacy-model actions are never delegated
- product invariants in `AGENTS.md`, `.github/copilot-instructions.md`, and `CODEX.md` remain authoritative

## Authentication

GitHub Agentic Workflows require an AI engine. For this personal repository using GitHub Copilot, configure the repository Actions secret expected by GitHub Agentic Workflows as `COPILOT_GITHUB_TOKEN` according to GitHub's current authentication guidance. Do not place the token in code, issues, logs, or agent prompts.

Issue #60 tracks this owner-only step.

If the repository is later moved under an organization with the applicable centralized Copilot billing and policy enabled, GitHub may support the built-in `GITHUB_TOKEN` with `copilot-requests: write`. Do not switch authentication models without reviewing current GitHub policy first.

## Change control

Never hand-edit the generated `.lock.yml`. Edit `agent-team-daily.md`, compile it with the pinned GitHub Agentic Workflows compiler path, review the generated lockfile, and commit the source and generated lockfile together through a normal pull request.

`agentic-compile.yml` is intentionally read-only. It compiles the workflow, uploads the exact generated lockfile as a short-lived artifact, and fails when the committed lockfile is missing or stale. This prevents the compiler job from receiving workflow-file write authority.
