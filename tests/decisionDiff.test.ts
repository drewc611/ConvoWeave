import { describe, expect, it } from 'vitest';
import { buildDecisionDiff, type ThreadState } from '../src/features/decisions/decisionDiff';

const empty: ThreadState = { decisions: [], commitments: [], assumptions: [] };

it('marks new decisions as new', () => {
  const current: ThreadState = {
    ...empty,
    decisions: [{ id: 'd1', threadId: 't1', statement: 'Ship mobile first', status: 'active', evidence: [], createdAt: '2026-09-13T00:00:00Z' }],
  };
  expect(buildDecisionDiff(empty, current)).toContainEqual({ kind: 'decision', id: 'd1', change: 'new', label: 'Ship mobile first' });
});

describe('decision lineage', () => {
  it('marks superseded decisions without erasing history', () => {
    const before: ThreadState = {
      ...empty,
      decisions: [{ id: 'd1', threadId: 't1', statement: '30 day retention', status: 'active', evidence: [], createdAt: '2026-09-01T00:00:00Z' }],
    };
    const after: ThreadState = {
      ...empty,
      decisions: [{ ...before.decisions[0], status: 'superseded', supersededByDecisionId: 'd2' }],
    };
    expect(buildDecisionDiff(before, after)[0]?.change).toBe('superseded');
  });
});
