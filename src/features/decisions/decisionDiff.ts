import type { Assumption, Commitment, Decision, MemoryChange } from '../../models/domain';

export type ThreadState = {
  decisions: Decision[];
  commitments: Commitment[];
  assumptions: Assumption[];
};

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

export function buildDecisionDiff(prior: ThreadState, current: ThreadState): MemoryChange[] {
  const changes: MemoryChange[] = [];

  compare('decision', prior.decisions, current.decisions, (item) => item.statement, (item) => item.status === 'superseded' || item.status === 'reversed', changes);
  compare('commitment', prior.commitments, current.commitments, (item) => item.statement, (item) => item.status === 'superseded' || item.status === 'cancelled', changes);
  compare('assumption', prior.assumptions, current.assumptions, (item) => item.statement, (item) => item.status === 'disproven' || item.status === 'expired', changes);

  for (const item of current.commitments) {
    if (item.status === 'open' && item.dueAt && new Date(item.dueAt).getTime() < Date.now()) {
      changes.push({ kind: 'commitment', id: item.id, change: 'unresolved', label: item.statement });
    }
  }

  return changes;
}

function compare<T extends { id: string }>(
  kind: MemoryChange['kind'],
  prior: T[],
  current: T[],
  label: (item: T) => string,
  isSuperseded: (item: T) => boolean,
  target: MemoryChange[],
) {
  const previous = byId(prior);
  const next = byId(current);

  for (const item of current) {
    const old = previous.get(item.id);
    if (!old) {
      target.push({ kind, id: item.id, change: 'new', label: label(item) });
      continue;
    }
    if (JSON.stringify(old) !== JSON.stringify(item)) {
      target.push({ kind, id: item.id, change: isSuperseded(item) ? 'superseded' : 'changed', label: label(item) });
    }
  }

  for (const item of prior) {
    if (!next.has(item.id)) {
      target.push({ kind, id: item.id, change: 'removed', label: label(item) });
    }
  }
}
