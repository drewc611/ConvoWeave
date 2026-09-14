---
name: convoweave-meeting-memory
description: Use ConvoWeave to turn meeting notes into source-backed decisions, commitments, assumptions, pre-meeting briefs, and change explanations.
compatibility: ChatGPT, Claude, MCP-compatible hosts
---

# ConvoWeave meeting memory

Use the ConvoWeave MCP tools when the user wants durable, evidence-backed understanding of a meeting or a sequence of meetings.

## Core rules

1. Never invent a decision, commitment, assumption, owner, due date, rationale, or source quote.
2. Keep observed source text separate from interpretation.
3. Important structured items must have source evidence.
4. Treat generated structured items as proposals until the user confirms them.
5. A newer statement does not automatically supersede an older decision.
6. Do not include private Sidecar notes or other private context unless the user explicitly chooses to share them.
7. Do not send raw audio to the stateless MCP tools. Use notes or transcript text supplied by the user/host.

## Workflow: structure a meeting

When the user provides notes or transcript text:

1. Identify candidate decisions, commitments, and assumptions from the supplied text.
2. For every candidate, copy a concise exact evidence quote from the supplied notes.
3. Call `convoweave_structure_meeting` with those candidates and evidence quotes.
4. Present the returned items as proposals and ask the user to accept, reject, or correct them before treating them as durable memory.

If an evidence quote cannot be found in the supplied text, do not submit that item to the tool.

## Workflow: prepare a meeting

When the user supplies current thread state, call `convoweave_prepare_brief`. Prioritize overdue commitments, unresolved assumptions, disputed decisions, and questions that should be resolved in the next conversation.

## Workflow: explain what changed

When prior and current structured state are available, call `convoweave_explain_changes`. Explain only changes returned by the tool. Distinguish added, changed, and removed items.

## Privacy

Use the minimum content required for the requested workflow. Do not include credentials, unrelated private notes, or hidden data in tool inputs.
