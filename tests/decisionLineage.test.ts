import { describe, expect, it } from 'vitest';
import type { Decision } from '../src/models/domain';
import { disputeDecision, reverseDecision, supersedeDecision } from '../src/features/decisions/decisionLineage';

const original: Decision = {
  id: 'd1',
  threadId: 'thread-1',
  statement: 'Retain recordings for 30 days',
  status: 'active',
  evidence: [],
  createdAt: '2026-09-01T00:00:00Z',
};

describe('decision lineage transitions', () => {
  it('supersedes without deleting or mutating the prior identity', () => {
    const replacement: Decision = {
      id: 'd2',
      threadId: 'thread-1',
      statement: 'Retain recordings for 14 days',
      status: 'active',
      evidence: [],
      createdAt: '2026-09-13T00:00:00Z',
    };

    const lineage = supersedeDecision(original, replacement);
    expect(lineage.prior.id).toBe('d1');
    expect(lineage.prior.status).toBe('superseded');
    expect(lineage.prior.supersededByDecisionId).toBe('d2');
    expect(lineage.replacement.supersedesDecisionId).toBe('d1');
    expect(lineage.replacement.status).toBe('active');
  });

  it('rejects lineage across threads', () => {
    const replacement: Decision = {
      ...original,
      id: 'd2',
      threadId: 'thread-2',
    };
    expect(() => supersedeDecision(original, replacement)).toThrow(/cannot cross meeting threads/i);
  });

  it('marks decisions reversed or disputed without erasing evidence', () => {
    expect(reverseDecision(original).status).toBe('reversed');
    expect(disputeDecision(original).status).toBe('disputed');
    expect(reverseDecision(original).id).toBe('d1');
  });
});
