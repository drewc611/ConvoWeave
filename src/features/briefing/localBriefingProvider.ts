import type { Assumption, Commitment, Contradiction, Decision } from '../../models/domain';
import type { BriefingProvider } from '../../services/providers';

export type ThreadBriefSnapshot = {
  threadTitle?: string;
  decisions: Decision[];
  commitments: Commitment[];
  assumptions: Assumption[];
  contradictions: Contradiction[];
};

export type ThreadBrief = {
  title: string;
  bullets: string[];
};

const MAX_BULLETS = 5;

function parsedTime(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function buildLocalThreadBrief(snapshot: ThreadBriefSnapshot, now = Date.now()): ThreadBrief {
  const bullets: string[] = [];
  const add = (value: string) => {
    if (bullets.length < MAX_BULLETS && !bullets.includes(value)) bullets.push(value);
  };

  const contradictions = snapshot.contradictions
    .filter((item) => item.status === 'proposed')
    .sort((left, right) => right.confidence - left.confidence);

  for (const contradiction of contradictions.slice(0, 1)) {
    add(`Clarify before the meeting: ${contradiction.explanation}`);
  }

  const openCommitments = snapshot.commitments.filter((item) => item.status === 'open');
  const overdueCommitments = openCommitments
    .filter((item) => parsedTime(item.dueAt) < now)
    .sort((left, right) => parsedTime(left.dueAt) - parsedTime(right.dueAt));

  for (const commitment of overdueCommitments.slice(0, 2)) {
    add(`Overdue commitment: ${commitment.statement}`);
  }

  const assumptions = snapshot.assumptions
    .filter((item) => item.status === 'untested')
    .sort((left, right) => parsedTime(left.reviewAt) - parsedTime(right.reviewAt));

  for (const assumption of assumptions.slice(0, 1)) {
    const due = parsedTime(assumption.reviewAt) <= now;
    add(`${due ? 'Validate now' : 'Validate assumption'}: ${assumption.statement}`);
  }

  const activeDecisions = snapshot.decisions
    .filter((item) => item.status === 'active')
    .sort((left, right) => parsedTime(right.createdAt) - parsedTime(left.createdAt));

  for (const decision of activeDecisions.slice(0, 1)) {
    add(`Current decision: ${decision.statement}`);
  }

  const upcomingCommitments = openCommitments
    .filter((item) => !overdueCommitments.some((overdue) => overdue.id === item.id))
    .sort((left, right) => parsedTime(left.dueAt) - parsedTime(right.dueAt));

  for (const commitment of upcomingCommitments) {
    add(`Open commitment: ${commitment.statement}`);
  }

  if (bullets.length === 0) {
    bullets.push('No reviewed decisions, commitments, assumptions, or contradictions need attention in this thread yet.');
  }

  return {
    title: snapshot.threadTitle ? `Before ${snapshot.threadTitle}` : 'Before your next meeting',
    bullets,
  };
}

export function createLocalBriefingProvider(getSnapshot: (threadId: string) => ThreadBriefSnapshot): BriefingProvider {
  return {
    async buildBrief(threadId: string) {
      return buildLocalThreadBrief(getSnapshot(threadId));
    },
  };
}
