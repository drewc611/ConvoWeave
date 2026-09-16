---
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  security-events: read
  vulnerability-alerts: read

network: defaults

tools:
  github:
    toolsets: [default]

safe-outputs:
  submit-pull-request-review:
    max: 1

---

# ConvoWeave Security and Privacy Review

Review the pull request against `AGENTS.md`, `.github/copilot-instructions.md`, and `docs/AGENT_GUARDRAILS.md`.

Focus on real issues only: secret exposure, excessive permissions, auth/data-ownership regressions, unsafe remote-processing behavior, Private Sidecar leakage, automatic uploads, background recording, sensitive logging, workflow/supply-chain risk, insecure storage/retention, or a release claim unsupported by evidence.

If there is a Critical or High security/privacy issue, request changes with exact evidence and remediation. If no material issue exists, leave a concise non-blocking review. Never weaken a finding merely to make CI green.