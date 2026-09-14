import { createHash } from 'node:crypto';

function stableId(kind, statement, quote) {
  return `${kind}-${createHash('sha256').update(`${kind}\n${statement}\n${quote}`).digest('hex').slice(0, 12)}`;
}

function ensureQuote(notes, quote) {
  const normalizedNotes = notes.toLocaleLowerCase();
  const normalizedQuote = quote.toLocaleLowerCase().trim();
  if (!normalizedQuote || !normalizedNotes.includes(normalizedQuote)) {
    throw new Error('Every structured item must include an evidenceQuote copied from the supplied meeting notes.');
  }
}

function normalizeItems(kind, notes, items = []) {
  return items.map((item) => {
    const statement = item.statement.trim();
    const evidenceQuote = item.evidenceQuote.trim();
    ensureQuote(notes, evidenceQuote);
    return {
      id: item.id?.trim() || stableId(kind, statement, evidenceQuote),
      kind,
      statement,
      status: 'proposed',
      confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : undefined,
      owner: item.owner?.trim() || undefined,
      dueAt: item.dueAt?.trim() || undefined,
      rationale: item.rationale?.trim() || undefined,
      evidence: {
        source: 'host-supplied-notes',
        quote: evidenceQuote,
      },
    };
  });
}

export function capabilities() {
  return {
    product: 'ConvoWeave',
    integrationVersion: '1.0',
    mode: 'stateless',
    sourceBacked: true,
    tools: [
      'convoweave_capabilities',
      'convoweave_structure_meeting',
      'convoweave_prepare_brief',
      'convoweave_explain_changes',
    ],
    guarantees: [
      'Important structured items require source evidence.',
      'Generated items are proposals until a human confirms them.',
      'Private notes must not be included unless the user explicitly chooses to share them.',
    ],
  };
}

export function structureMeeting(input) {
  const notes = input.notes.trim();
  if (!notes) throw new Error('Meeting notes are required.');
  return {
    meetingId: input.meetingId,
    threadId: input.threadId || undefined,
    title: input.title?.trim() || 'Meeting memory',
    source: { type: 'host-supplied-notes', text: notes },
    decisions: normalizeItems('decision', notes, input.decisions),
    commitments: normalizeItems('commitment', notes, input.commitments),
    assumptions: normalizeItems('assumption', notes, input.assumptions),
    reviewRequired: true,
  };
}

function openItems(items, allowedStatuses) {
  return items.filter((item) => allowedStatuses.includes(item.status));
}

export function prepareBrief(input, now = new Date()) {
  const activeDecisions = openItems(input.decisions ?? [], ['active', 'disputed']);
  const commitments = openItems(input.commitments ?? [], ['open']);
  const assumptions = openItems(input.assumptions ?? [], ['untested', 'expired']);
  const overdue = commitments.filter((item) => item.dueAt && new Date(item.dueAt).getTime() < now.getTime());

  const bullets = [];
  if (overdue.length) bullets.push(`${overdue.length} overdue commitment${overdue.length === 1 ? '' : 's'} need attention.`);
  if (commitments.length) bullets.push(`${commitments.length} open commitment${commitments.length === 1 ? '' : 's'} remain.`);
  if (assumptions.length) bullets.push(`${assumptions.length} unresolved assumption${assumptions.length === 1 ? '' : 's'} should be validated.`);
  if (activeDecisions.length) bullets.push(`${activeDecisions.length} active/disputed decision${activeDecisions.length === 1 ? '' : 's'} define the current state.`);
  if (!bullets.length) bullets.push('No open decisions, commitments, or assumptions were supplied.');

  return {
    title: input.threadTitle ? `Pre-meeting brief: ${input.threadTitle}` : 'Pre-meeting brief',
    bullets,
    overdueCommitmentIds: overdue.map((item) => item.id),
    activeDecisionIds: activeDecisions.map((item) => item.id),
    unresolvedAssumptionIds: assumptions.map((item) => item.id),
  };
}

function indexById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function diffCollection(prior = [], current = []) {
  const before = indexById(prior);
  const after = indexById(current);
  const added = [];
  const removed = [];
  const changed = [];

  for (const [id, value] of after) {
    if (!before.has(id)) {
      added.push(value);
      continue;
    }
    const oldValue = before.get(id);
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) changed.push({ id, before: oldValue, after: value });
  }
  for (const [id, value] of before) if (!after.has(id)) removed.push(value);
  return { added, changed, removed };
}

export function explainChanges(input) {
  return {
    decisions: diffCollection(input.prior?.decisions, input.current?.decisions),
    commitments: diffCollection(input.prior?.commitments, input.current?.commitments),
    assumptions: diffCollection(input.prior?.assumptions, input.current?.assumptions),
  };
}
