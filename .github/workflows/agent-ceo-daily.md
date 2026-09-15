---
on:
  schedule: daily
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read

network: defaults

tools:
  github:
    toolsets: [default]

safe-outputs:
  create-issue:
    max: 1
    title-prefix: '[ceo-daily] '
    labels: [agent-report]
    close-older-issues: true

---

# ConvoWeave CEO Daily Review

Read `AGENTS.md`, `.github/copilot-instructions.md`, `docs/AGENT_OPERATING_MODEL.md`, `docs/AGENT_GUARDRAILS.md`, `docs/DAILY_AGENT_CADENCE.md`, `CODEX.md`, and Executive Program Board issue #57.

Review the last 24 hours of repository activity, open PRs/issues, releases, CI/security runs, and visible deployment/release blockers.

Create one concise daily executive issue containing:

- evidence reviewed
- what actually progressed
- at most three priorities for the next cycle
- active risks and blocked work
- owner-only actions needed
- stale or duplicate work that should be closed
- explicit stop conditions

Do not create implementation PRs. Do not declare physical-device, Apple, Google Play, Expo/EAS, or GitHub-admin gates complete without evidence. Prefer completing current work over expanding scope.