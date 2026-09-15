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
  create-pull-request:
    title-prefix: '[agent-maintenance] '
    labels: [agent-maintenance]
    draft: true
    max: 1
    base-branch: main
    max-patch-files: 20
    max-patch-size: 1024
    protected-files: fallback-to-issue
    allowed-files:
      - 'src/**'
      - 'tests/**'
      - 'backend/**'
      - 'integrations/mcp/**'
      - 'docs/**'
      - 'App.tsx'
      - 'package.json'
      - 'package-lock.json'

---

# ConvoWeave Daily Maintenance Engineer

Read `AGENTS.md`, `.github/copilot-instructions.md`, `CODEX.md`, the governance docs, Executive Program Board issue #57, current open issues, open PRs, recent failures, and recent merged work.

Only act when there is one clear, low-risk, repository-side improvement that directly advances an existing issue or fixes a demonstrated regression. Prefer tests, reliability, recovery, documentation tied to code, and small correctness fixes. Do not invent scope.

Before proposing a PR:

1. Confirm no active PR already addresses the same work.
2. State the issue/evidence that justifies the change.
3. Keep the change to one objective.
4. Add or update tests when behavior changes.
5. Run relevant typecheck/tests/release checks.
6. Do not touch protected/governance/workflow/license/store/signing files.
7. Do not alter the privacy model, product thesis, auth ownership model, or data migration semantics.
8. If the work is not clearly safe and bounded, do not create a PR. Create no output instead.

All PRs must remain draft and require human review.