import type { Commitment } from '../../models/domain';

export type CommitmentRisk = 'overdue' | 'due-soon' | 'open' | 'closed';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getCommitmentRisk(commitment: Commitment, nowMs = Date.now()): CommitmentRisk {
  if (commitment.status !== 'open') return 'closed';
  if (!commitment.dueAt) return 'open';

  const dueMs = new Date(commitment.dueAt).getTime();
  if (!Number.isFinite(dueMs)) return 'open';
  if (dueMs < nowMs) return 'overdue';
  if (dueMs - nowMs <= DAY_MS) return 'due-soon';
  return 'open';
}

export function sortCommitmentsByAttention(items: Commitment[], nowMs = Date.now()) {
  const rank: Record<CommitmentRisk, number> = { overdue: 0, 'due-soon': 1, open: 2, closed: 3 };
  return [...items].sort((a, b) => {
    const riskDifference = rank[getCommitmentRisk(a, nowMs)] - rank[getCommitmentRisk(b, nowMs)];
    if (riskDifference !== 0) return riskDifference;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
  });
}
