# ADR 0008: ConvoWeave suite UI and meeting workspace

## Status
Accepted for UI v1.

## Context
ConvoWeave had a functional local-first alpha but its primary screen presented features as a vertical collection of cards. That made the product work, but it did not express the product model clearly enough for daily use across phone, tablet and web.

Current meeting products demonstrate two useful patterns:

- feature-rich meeting workspaces that keep summaries, transcripts, tasks and meeting controls in one place;
- low-noise notepad-first experiences that prioritize attention, privacy and human-authored context.

ConvoWeave should adopt those interaction strengths without becoming a transcript-first clone. Its core differentiation is durable operational memory across meetings: decisions, commitments, assumptions, contradictions, evidence and explicit change history.

## Decision
ConvoWeave will use a responsive suite shell with two primary surfaces.

### Today / Home
The home surface prioritizes:

1. selected meeting thread;
2. recording and recovery state;
3. active decisions, open commitments and untested assumptions;
4. attention signals such as overdue commitments and proposed contradictions;
5. recent meetings and their What Changed counts;
6. direct navigation to durable-memory registers.

Desktop/web uses a left navigation rail, primary work column and memory-attention rail. Phone/tablet collapses this into horizontal navigation and stacked content.

### Meeting Workspace
A completed meeting opens into a source-backed workspace rather than a generic detail card.

- durable meeting memory is the primary pane;
- transcript/source material is a separate pane on wide screens and a tab on narrow screens;
- decisions, commitments and assumptions shown in the workspace are filtered by evidence that references that meeting;
- contradictions retain both current and prior source proof;
- What Changed is surfaced as a first-class action when a change set exists;
- Private Sidecar content is not shown in shared meeting memory unless separately promoted by existing product rules.

## Visual system
The UI uses a calm neutral canvas, white working surfaces, dark ink for hierarchy, restrained green for trusted/source-backed state, blue for change information, amber for unvalidated state and red for unresolved risk. The visual system avoids dense gradients, decorative dashboards and unsupported AI affordances.

## Constraints
- No fake meetings, analytics or AI answers are introduced for visual completeness.
- Existing repository/domain behavior remains authoritative.
- The UI must remain usable with AI processing disabled.
- Source proof and privacy boundaries remain visible.
- No competitor visual assets, proprietary code or exact layouts are copied.

## Consequences
The product now has a coherent daily workspace while retaining the existing specialist screens. Later UI sprints can place those specialist screens inside the same shell, add calendar-aware Today views, and redesign the in-meeting capture pane without changing the domain model introduced here.
