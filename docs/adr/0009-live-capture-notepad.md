# ADR 0009: Live capture notepad and draft persistence

## Status
Accepted for live capture v1.

## Context
A meeting recorder that only shows a timer forces users to choose between listening and maintaining context somewhere else. ConvoWeave should let a user record and write lightweight personal meeting notes in the same focused surface without inventing live transcript or AI content.

## Decision
`Meeting` drafts may contain `captureNotes` in addition to the local audio reference and duration checkpoint.

During an active capture:

- recording remains explicit and consent-gated;
- manual notes are editable in a focused notepad;
- audio/duration are checkpointed on the existing cadence;
- note changes are checkpointed with the meeting draft;
- operating-system interruption checkpoints include the latest notes;
- draft recovery preserves the notes with the meeting.

When capture ends, `captureNotes` become the initial manual context in Review when no saved review transcript already exists. Review remains the human gate before decisions, commitments or assumptions become durable thread memory. After a completed review is saved, the canonical manual transcript replaces the temporary capture-note field.

## Privacy
Capture notes are local draft data. They are not Private Sidecar notes and they are not automatically shared with a remote provider. Existing explicit remote-processing approval rules remain unchanged.

## Non-goals
This sprint does not add a fake live transcript, live AI coaching, inferred decisions during recording, or automatic memory mutation.

## Consequences
Users can stay in one meeting workspace while recording and taking notes, and interruption/restart recovery protects both forms of work. Future real-time transcription can be added as a separate source pane without replacing the manual notepad or the review gate.
