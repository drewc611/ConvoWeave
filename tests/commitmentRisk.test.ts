import { describe, expect, it } from 'vitest';
import type { Commitment } from '../src/models/domain';
import { getCommitmentRisk, sortCommitmentsByAttention } from '../src/features/commitments/commitmentRisk';

const now = Date.parse('2026-09-13T12:00:00Z');

function commitment(id: string, dueAt?: string): Commitment {
  return {
    id,
    threadId: 't1',
    statement: id,
    dueAt,
    status: 'open',
    evidence: [],
    createdAt: '2026-09-01T00:00:00Z',
    lastUpdatedAt: '2026-09-01T00:00:00Z',
  };
}

describe('commitment risk', () => {
  it('detects overdue, due-soon, and open commitments', () => {
    expect(getCommitmentRisk(commitment('late', '2026-09-12T12:00:00Z'), now)).toBe('overdue');
    expect(getCommitmentRisk(commitment('soon', '2026-09-14T08:00:00Z'), now)).toBe('due-soon');
    expect(getCommitmentRisk(commitment('later', '2026-09-20T12:00:00Z'), now)).toBe('open');
    expect(getCommitmentRisk(commitment('none'), now)).toBe('open');
  });

  it('puts commitments needing attention first', () => {
    const sorted = sortCommitmentsByAttention([
      commitment('later', '2026-09-20T12:00:00Z'),
      commitment('late', '2026-09-12T12:00:00Z'),
      commitment('soon', '2026-09-14T08:00:00Z'),
    ], now);
    expect(sorted.map((item) => item.id)).toEqual(['late', 'soon', 'later']);
  });
});
