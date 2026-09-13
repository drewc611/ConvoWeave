# ConvoWeave Product Strategy

## Positioning

ConvoWeave is not another transcript-and-summary application. It is a meeting memory and decision system that maintains the evolving state of work across conversations.

Core promise:

> Know what changed, why it changed, who committed to what, and what still needs resolution.

## Category baseline

The major meeting assistants already cover much of the expected baseline:

- audio capture and transcription
- AI summaries
- extracted action items and decisions
- AI chat over meetings
- calendar and conferencing integrations
- search across prior meetings
- follow-up generation
- mobile access

ConvoWeave should support these capabilities where necessary, but should not use them as its primary differentiation.

## Differentiating product system

### 1. Decision Ledger

Every meaningful decision becomes a durable object instead of a sentence buried in a summary.

Store:

- decision statement
- owner or decision authority
- date and meeting source
- rationale
- alternatives discussed
- confidence
- evidence moments
- related assumptions
- status: active, superseded, reversed, disputed
- supersedes / superseded-by relationships

Primary user question:

> What is the current decision, and why did we make it?

### 2. Decision Diff

For recurring meetings, compare the current conversation with the prior known state.

Surface:

- new decisions
- changed decisions
- reversed decisions
- materially changed requirements
- commitments that moved
- unresolved conflicts
- assumptions that became facts or were invalidated

The product should answer "what changed?" before presenting a full summary.

### 3. Contradiction Detector

Detect statements that conflict with a prior decision, commitment, requirement, number, date, policy, or assumption.

Do not automatically declare a contradiction as fact. Present:

- current statement
- conflicting prior statement
- both source moments
- confidence
- recommended clarification question
- resolution state

Example:

> Today someone said retention is 90 days. The Aug 28 decision set the default at 30 days. Confirm whether D-014 has been superseded.

### 4. Commitment Radar

Treat promises as durable objects across meetings.

Track:

- commitment text
- person responsible
- due date if stated
- source evidence
- first-seen date
- latest update
- status
- age
- number of meetings since last update

Risk signals:

- due date approaching without an update
- repeated carryover
- conflicting ownership
- due date changed repeatedly
- promise mentioned but never explicitly closed

### 5. Assumption Register

Capture important assumptions separately from facts and decisions.

Store:

- assumption
- source
- owner
- validation method
- review date
- state: untested, supported, disproven, expired

This gives teams a visible answer to:

> What are we currently treating as true without evidence?

### 6. Source Proof

Every AI-generated claim that affects work should be traceable to evidence.

For each generated decision, commitment, contradiction, or assumption, retain:

- meeting id
- transcript range
- speaker
- timestamp
- optional audio range

The UI should let a user move from interpretation to source in one tap.

### 7. Meeting Threads

Group meetings into persistent work threads rather than independent recordings.

A thread should carry forward:

- active decisions
- commitments
- assumptions
- unresolved questions
- known risks
- participants
- linked documents

The thread should produce the context for the next meeting automatically.

### 8. Pre-meeting Brief

Before a recurring meeting, generate a short operational brief:

- what changed since last time
- overdue or at-risk commitments
- unresolved contradictions
- assumptions due for validation
- decisions likely to be revisited
- suggested clarification questions

This should be more useful than rereading the last meeting summary.

### 9. Private Sidecar

Allow a user to take personal observations that are never included in shared notes, shared AI context, exports, or team search unless explicitly promoted.

Examples:

- private preparation notes
- concerns
- negotiation observations
- personal follow-up reminders

The product must visually distinguish private content from shared meeting records.

### 10. Decision Impact Alerts

When a later meeting changes a decision, identify other open work that depends on it.

Example:

> Changing the launch date affects three open commitments and one unresolved vendor decision.

This can evolve into a lightweight dependency graph across people, projects, decisions, and commitments.

## Mobile-first V1

### V1 must work well without a meeting bot

Initial flow:

1. User taps Start Meeting.
2. App captures in-person or speaker audio with explicit consent controls.
3. Transcript is created.
4. AI extracts proposed decisions, commitments, assumptions, and unresolved questions.
5. User reviews the extracted objects.
6. Objects are attached to a meeting thread.
7. ConvoWeave compares them with prior thread state.
8. User receives a What Changed view.

### V1 screens

- Today
- Live meeting capture
- Meeting review
- Memory / threads
- Decision detail
- Commitment radar
- Contradiction review
- Private sidecar
- Settings / privacy / retention

## Product rules

1. Never invent a decision.
2. Separate observed text from AI interpretation.
3. Every important extracted object must preserve source evidence.
4. Ambiguous ownership remains ambiguous until confirmed.
5. Conflicts are proposed for review, not silently resolved.
6. Private notes never enter shared context without an explicit user action.
7. A newer statement does not automatically supersede an older decision.
8. Users can correct the system, and corrections become first-class history.

## Technical direction

Mobile client:

- Expo SDK 57
- React Native
- TypeScript
- native audio capture through an Expo-supported module
- local encrypted persistence for draft/private data

Backend direction:

- API-first service boundary
- relational store for durable decision/commitment state
- object storage for audio where enabled
- transcript service abstraction
- model-provider abstraction so extraction is not locked to one LLM
- embeddings/search as a retrieval layer, not the system of record

The durable structured state is the product. Vector search is supporting infrastructure.

## Data model candidates

Primary entities:

- User
- Workspace
- Meeting
- MeetingThread
- Participant
- TranscriptSegment
- Decision
- DecisionRelation
- Commitment
- Assumption
- Contradiction
- Question
- EvidenceRef
- PrivateNote
- DocumentRef

## Near-term build order

### Milestone 1: Mobile shell

- navigation
- design system
- local demo data
- decision / commitment / contradiction / assumption surfaces

### Milestone 2: Real capture

- microphone permissions
- audio recording
- pause/resume
- local draft persistence
- consent indicator

### Milestone 3: Processing pipeline

- upload session
- transcription adapter
- speaker segmentation
- extraction pipeline
- source evidence ranges

### Milestone 4: Durable memory

- meeting threads
- decision ledger
- commitment state
- assumption state
- correction workflow

### Milestone 5: Intelligence

- decision diff
- contradiction proposals
- risk scoring for commitments
- pre-meeting brief
- impact alerts

### Milestone 6: Integrations

Only after the memory loop works:

- calendar
- Zoom / Teams / Meet
- Slack / email
- task systems
- CRM where appropriate

## Competitive principle

Do not try to win by producing a prettier transcript.

Win by turning conversation into trusted, versioned operational memory.
