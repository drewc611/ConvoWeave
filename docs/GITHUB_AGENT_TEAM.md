# GitHub-native ConvoWeave Agent Team

ConvoWeave uses repository-scoped GitHub Copilot custom agents plus GitHub Agentic Workflows. The operating model is intentionally defense-in-depth.

## Custom agents

Profiles live in `.github/agents/`:

- CEO
- Chief Architect
- Product
- Mobile Engineering
- Backend & MCP
- Security & Privacy
- QA & Release
- DevOps & SRE

Each profile has a restricted tool set and must follow the root governance harness.

## Automated GitHub agents

Agentic workflow sources live in `.github/workflows/agent-*.md` and are compiled by `agentic-compile.yml` into hardened `.lock.yml` GitHub Actions workflows.

Initial automation lanes:

1. CEO daily report: read-only analysis, issue output only.
2. Security/privacy PR review: read-only analysis, review output only.
3. QA/release daily gate: read-only analysis, issue output only.
4. Daily maintenance engineer: at most one draft PR, restricted to explicitly allowed source/test/backend/docs files, with protected-file fallback.

## Harness

- agent runtime permissions are read-only
- write operations use GitHub Agentic Workflows safe outputs
- code-writing automation is capped at one draft PR per run
- allowed-file lists block `.github/**`, `LICENSE`, store/signing/account files, and other unlisted paths
- protected-file handling falls back to an issue instead of forcing a patch
- humans retain merge authority
- normal CI/security/release gates still apply
- owner-only account/admin/legal/signing actions are never delegated

## Authentication

GitHub Agentic Workflows require an AI engine. For a personal repository using GitHub Copilot, configure the repository secret expected by GitHub Agentic Workflows (`COPILOT_GITHUB_TOKEN`) according to GitHub's current agentic-workflow authentication documentation. Do not place the token in code, issues, logs, or agent prompts.

If the repository is later moved under an organization with Copilot billing enabled for agentic workflows, the built-in `GITHUB_TOKEN` with `copilot-requests: write` may be used instead when supported by the organization policy.

## Change control

Never hand-edit generated `.lock.yml` agentic workflows. Edit the corresponding `.md` source and let `gh aw compile` regenerate the lock file.
