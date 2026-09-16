# ConvoWeave Agent Guardrails

## Risk classes

### Class A: safe autonomous

Examples:

- tests and test coverage
- documentation/runbooks
- diagnostics and observability
- narrowly scoped defect fixes that preserve behavior
- CI reliability fixes that do not weaken controls
- release evidence improvements

Class A work may be implemented through a PR and merged after required checks pass.

### Class B: controlled engineering

Examples:

- authentication changes
- API contract changes
- persistence/schema changes
- new dependencies
- remote-processing changes
- upload/consent behavior
- release packaging or deployment behavior
- MCP tool behavior

Class B work requires explicit security/privacy impact, tests, and rollback/recovery notes in the PR. It may merge only when all relevant checks are green and no Critical/High issue remains.

### Class C: owner approval required

Examples:

- legal/license changes
- repository visibility/admin/ruleset changes
- Apple/Google/Expo/EAS account or signing actions
- production credentials
- irreversible data deletion
- pricing/payment/contract changes
- material privacy-model changes
- material product-thesis changes

Agents must stop and escalate Class C work.

## Pre-change harness

Before modifying implementation code, an agent must answer:

1. What exact user/product problem is being solved?
2. Which files/subsystems are expected to change?
3. Which product invariants could be affected?
4. What data or privacy boundary is involved?
5. What tests prove the change?
6. How is the change rolled back or recovered if it fails?

If those answers are unclear for Class B work, the agent creates a decision issue instead of coding.

## Merge harness

A merge is permitted only when:

- branch is current enough to merge cleanly
- required CI is successful
- CodeQL/security checks are successful when applicable
- tests cover the changed behavior
- no unresolved Critical/High defect is known
- no secret or private user content was added
- documentation matches behavior when release/privacy behavior changed
- rollback/recovery is understood

## Release harness

Before publishing or promoting a release, verify:

- exact commit SHA
- version/build number
- artifact exists
- checksum/manifest exists when applicable
- release preflight is green
- automated runtime QA is green where available
- physical-device status is stated accurately
- Apple/Google/EAS status is stated accurately
- privacy/support/deletion URLs are live when required

Never infer a passed external gate from prepared metadata.

## Data-protection harness

Agents must treat the following as prohibited repository content:

- real meeting audio
- real transcripts
- real private notes
- production access tokens
- provider API keys
- service-account JSON
- signing certificates or keystores
- Apple/Google/Expo credentials
- private keys
- passwords

Synthetic fixtures must be clearly artificial and contain no copied real-user content.

## Architecture harness

Changes must preserve:

- local-first functionality when cloud AI is unavailable
- provider abstraction instead of model calls from UI components
- evidence/interpretation separation
- human review before generated proposals become durable memory
- Private Sidecar isolation
- explicit remote-processing consent
- auditable corrections and decision history

## Collision harness

When another active PR modifies the same core subsystem:

- do not open a competing refactor
- inspect the existing work first
- either build on it, sequence behind it, or document the conflict on the program board

## Failure behavior

An agent must not respond to failing CI by deleting tests, weakening assertions, disabling checks, reducing privacy controls, or hiding errors. Fix the root cause, revert the change, or escalate.