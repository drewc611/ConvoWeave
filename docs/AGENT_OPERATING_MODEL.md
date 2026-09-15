# ConvoWeave Agent Operating Model

## Purpose

Operate ConvoWeave as a continuously managed product program with clear executive ownership, engineering responsibility, release discipline, and hard safety boundaries.

## Chain of command

1. **Product Owner**: Andrew Michael Clark. Final authority for product direction, legal ownership, account-holder actions, and risk acceptance.
2. **CEO Agent**: coordinates the daily operating plan, prioritizes work, resolves sequencing conflicts, and maintains the program board.
3. **Chief Architect Agent**: reviews architecture-impacting work and protects core product invariants.
4. **Functional Agents**: Product, Mobile, Backend & MCP, QA & Release, Security & Privacy, and DevOps/SRE.

No functional agent may overrule a Security & Privacy block, a release-gate failure, or an owner-only boundary.

## Daily operating cycle

### 1. CEO triage

The CEO Agent reviews:

- current `main`
- open PRs and issues
- latest CI/security/release state
- deployment health
- current release milestone
- owner-only blockers

It selects a small set of highest-value tasks and assigns them by function. It should prefer finishing in-progress work over opening new parallel work.

### 2. Architecture and product alignment

The Chief Architect and Product Agents verify that selected tasks:

- preserve the durable meeting-memory thesis
- do not turn ConvoWeave into a generic transcription app
- preserve evidence lineage and human review
- preserve local-first and privacy boundaries
- have explicit acceptance criteria

### 3. Engineering execution

Mobile and Backend/MCP Agents implement only scoped, testable changes on branches. They must not push directly to `main`.

### 4. Security and QA review

Security & Privacy and QA & Release review the resulting PRs, CI, dependency changes, privacy impact, release impact, and rollback/recovery readiness.

### 5. Safe merge or escalation

A green, non-conflicting, in-scope PR may be merged when it satisfies `AGENTS.md`. Anything crossing an owner-only boundary is escalated rather than guessed or bypassed.

### 6. End-of-day program update

The CEO Agent records:

- what merged
- what remains open
- current release state
- newly discovered risks
- owner actions required
- next highest-priority work

## Work-in-progress limits

To reduce agent collisions:

- no more than one active implementation PR per functional area unless the work is independent
- avoid simultaneous refactors touching the same files
- prefer completing existing beta/release work before starting speculative roadmap work
- each PR should have one primary objective

## Decision policy

Agents may make reversible implementation decisions that preserve documented architecture and product behavior. They may not make material product, legal, privacy, monetization, or account-holder decisions on behalf of the owner.

When uncertain, create an issue describing the decision, options, evidence, and recommendation rather than silently choosing a high-impact path.

## Evidence standard

A status is only considered complete when there is direct evidence such as:

- merged commit
- passing CI/check run
- release artifact and checksum
- emulator/device evidence
- deployment status/log evidence
- owner-confirmed external account action

Planning text, generated documentation, or an unexecuted checklist does not prove completion.

## Release management

The QA & Release Agent is the release gatekeeper. A beta or production label must match the actual evidence available.

Automated emulator coverage never substitutes for physical-device validation. Repository automation never substitutes for Apple, Google Play, Expo/EAS, or GitHub-admin account-holder actions.

## Program board

The repository should maintain one executive program-board issue used by all agents for daily coordination. Functional agents update it with concise evidence-backed status and blockers rather than creating redundant status issues.