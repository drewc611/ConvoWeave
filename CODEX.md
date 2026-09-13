# ConvoWeave Engineering Handoff

## Mission

Build ConvoWeave as a mobile-first meeting memory and decision system.

Do not reduce the product to transcription plus summaries. The core product is durable, source-backed state across meetings.

Read these files before changing code:

1. `LICENSE`
2. `docs/PRODUCT_STRATEGY.md`
3. `README.md`
4. `App.tsx`

## Legal constraint

This repository is proprietary. Do not replace the license with an open-source license. Do not add code copied from incompatible or unknown-license repositories.

Third-party dependencies must retain their own licenses and attribution requirements.

## Current stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript

Keep the client mobile-first for iOS and Android.

## Product invariants

These rules are architectural requirements:

1. Important AI outputs must retain source evidence.
2. A generated interpretation is never stored as if it were raw transcript evidence.
3. Decisions are versioned objects.
4. A newer statement does not silently overwrite an older decision.
5. Contradictions are proposed for review and can be dismissed or resolved.
6. Commitments persist across meetings until explicitly completed, cancelled, or superseded.
7. Assumptions remain distinct from facts and decisions.
8. Private notes never enter shared context without explicit promotion by the user.
9. User corrections must remain auditable.
10. Vector search is not the source of truth for business state.

## Immediate build sequence

### Task 1: Refactor the prototype into modules

Preserve the current visual language and behavior while moving code into:

```text
src/
  components/
  features/
    meetings/
    memory/
    decisions/
    commitments/
    contradictions/
    assumptions/
    private-notes/
  models/
  services/
  storage/
  theme/
```

Do not redesign the product during this refactor.

### Task 2: Add local durable data

Implement a local persistence abstraction suitable for development and offline-first mobile use.

Required repositories:

- MeetingRepository
- ThreadRepository
- DecisionRepository
- CommitmentRepository
- AssumptionRepository
- ContradictionRepository
- PrivateNoteRepository

Keep storage behind interfaces so the implementation can later move from local storage to a remote API without rewriting feature code.

### Task 3: Implement meeting capture

Add an explicit meeting capture flow:

- request microphone permission
- display recording/consent state before recording begins
- start recording
- pause/resume
- stop
- preserve an unfinished recording as a draft
- show duration
- handle interruptions
- handle permission denial gracefully

Do not upload audio automatically in this milestone.

### Task 4: Meeting review workflow

After a recording ends, show a review screen with sections for:

- transcript placeholder / processing state
- proposed decisions
- proposed commitments
- proposed assumptions
- unresolved questions
- possible contradictions

Every proposed object must support:

- accept
- edit
- reject
- inspect source evidence

### Task 5: Domain models

Implement strict TypeScript models roughly equivalent to:

```ts
type EvidenceRef = {
  meetingId: string;
  segmentIds: string[];
  speakerId?: string;
  startMs: number;
  endMs: number;
  quote?: string;
};

type DecisionStatus = 'active' | 'superseded' | 'reversed' | 'disputed';

type Decision = {
  id: string;
  threadId: string;
  statement: string;
  rationale?: string;
  ownerId?: string;
  status: DecisionStatus;
  evidence: EvidenceRef[];
  createdAt: string;
  supersedesDecisionId?: string;
  supersededByDecisionId?: string;
};

type Commitment = {
  id: string;
  threadId: string;
  statement: string;
  ownerId?: string;
  dueAt?: string;
  status: 'open' | 'done' | 'cancelled' | 'superseded';
  evidence: EvidenceRef[];
  createdAt: string;
  lastUpdatedAt: string;
};

type Assumption = {
  id: string;
  threadId: string;
  statement: string;
  status: 'untested' | 'supported' | 'disproven' | 'expired';
  evidence: EvidenceRef[];
  reviewAt?: string;
};

type Contradiction = {
  id: string;
  threadId: string;
  currentEvidence: EvidenceRef;
  priorEvidence: EvidenceRef;
  explanation: string;
  confidence: number;
  status: 'proposed' | 'dismissed' | 'resolved';
};
```

Improve these types where required, but preserve the separation between evidence and interpretation.

### Task 6: Decision Diff engine

Create a deterministic comparison layer before adding an LLM.

Inputs:

- prior thread state
- newly accepted decisions / commitments / assumptions

Outputs:

- new
- changed
- superseded
- removed/cancelled
- unresolved

The UI should render this as "What changed?".

### Task 7: AI adapter boundary

Do not call a model directly from screen components.

Create interfaces for:

- TranscriptionProvider
- ExtractionProvider
- ContradictionProvider
- BriefingProvider

The first implementation may be a mock provider for local development.

Every extraction response must include evidence references and confidence.

## Do not build yet

Do not spend early cycles on:

- CRM integrations
- complex admin consoles
- sales coaching
- meeting bot infrastructure
- browser extensions
- enterprise analytics dashboards
- custom vector database infrastructure

The product has to prove the memory loop first.

## UX direction

Keep the current visual language:

- warm neutral canvas
- dark green as the primary product color
- restrained status colors
- editorial typography hierarchy
- low visual noise
- information density without dashboard clutter

Avoid generic AI gradients, glowing cards, oversized chat bubbles, and template SaaS dashboard styling.

## Definition of the first real alpha

A user can:

1. install the mobile app
2. start and stop a real recording
3. review a meeting
4. accept/edit/reject extracted structured objects
5. attach the meeting to a persistent thread
6. see current decisions and open commitments
7. see a What Changed view for a later meeting
8. inspect source evidence for any important AI claim
9. create private notes that remain isolated
10. reopen the app without losing data

## Testing expectations

For each milestone:

- keep TypeScript strict
- run `npm run typecheck`
- add unit tests for domain/state logic
- add tests for decision diff behavior
- test private/shared data boundaries
- test state restoration after app restart
- test microphone permission denial and interruption states

Do not mark a milestone complete if the happy-path UI exists but state is not durable.
