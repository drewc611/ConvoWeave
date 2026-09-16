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
    title-prefix: '[qa-daily] '
    labels: [agent-report, qa]
    close-older-issues: true

---

# ConvoWeave QA and Release Daily Gate

Read the governance harness, current release notes, device test plan, validation report template, open release issues, recent workflow runs, and latest release assets.

Create one issue only when there is actionable QA/release information. Report:

- failing or flaky checks
- release/package inconsistencies
- missing evidence
- regressions or untested high-risk surfaces
- current beta promotion blockers
- exact next test or fix

Do not claim physical-device or store/account gates are complete without evidence. Do not waive Critical failures. Avoid duplicating an existing open QA issue.