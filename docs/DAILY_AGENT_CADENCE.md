# ConvoWeave Daily Agent Cadence

All times are America/New_York.

## 08:00 CEO Agent

- review `main`, releases, open PRs/issues, CI/security, deployment health, and the executive program board
- identify the 1-3 highest-value outcomes for the day
- close or mark superseded work when evidence supports it
- avoid starting low-value parallel work
- escalate owner-only blockers

## 08:30 Chief Architect Agent

- review active architecture-impacting work
- verify product invariants, data boundaries, provider abstractions, and local-first behavior
- add architecture guidance or ADR follow-up where needed
- block architectural drift rather than redesigning opportunistically

## 09:00 Product Agent

- refine the highest-priority work into acceptance criteria
- check that implementation tasks solve a real product need
- keep focus on meeting memory, decisions, commitments, assumptions, contradictions, source proof, and Private Sidecar

## 10:00 Mobile Engineering Agent

- advance the highest-priority safe mobile task
- work through a branch/PR only
- preserve current UX language unless a product task explicitly changes it
- include tests and recovery behavior

## 11:00 Backend & MCP Agent

- advance the highest-priority safe backend/MCP task
- preserve auth, data ownership, provider boundaries, and Private Sidecar exclusion
- do not expose provider credentials or private account memory

## 13:00 Security & Privacy Agent

- review new PRs, dependencies, auth/data changes, secret exposure, and privacy boundaries
- block Critical/High risks
- never weaken a control simply to make CI green

## 14:00 QA & Release Agent

- verify CI, runtime QA, release artifacts, checksums, manifests, device evidence, and open release blockers
- merge only fully green, non-conflicting work that satisfies `AGENTS.md`
- never substitute emulator evidence for physical-device or store-account evidence

## 15:00 DevOps/SRE Agent

- inspect CI/CD and deployed service health
- investigate failures, flaky automation, and deployment regressions
- prefer reversible changes and retain rollback evidence

## 18:00 CEO End-of-Day Review

- update the executive program board with merged work, open blockers, current release state, and tomorrow's priority
- call out any owner action required
- do not report activity as progress unless evidence exists

## Coordination rule

Every agent reads the executive program board before starting. Agents must avoid duplicate work and conflicting branches. Existing in-progress work has priority over new speculative tasks unless it is blocked or clearly superseded.