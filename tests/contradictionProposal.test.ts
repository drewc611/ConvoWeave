import { describe, expect, it } from 'vitest';
import type { MeetingProposal } from '../src/models/domain';
import { contradictionFromProposal } from '../src/features/contradictions/contradictionProposal';

const currentEvidence = {
  meetingId: 'm2',
  segmentIds: ['s2'],
  startMs: 1000,
  endMs: 2500,
  quote: 'Keep data for 90 days.',
};

const priorEvidence = {
  meetingId: 'm1',
  segmentIds: ['s1'],
  startMs: 500,
  endMs: 1900,
  quote: 'Default retention is 30 days.',
};

function proposal(overrides: Partial<MeetingProposal> = {}): MeetingProposal {
  return {
    id: 'x1',
    kind: 'contradiction',
    statement: 'Current retention statement conflicts with the prior decision.',
    confidence: 0.88,
    evidence: [currentEvidence],
    priorEvidence: [priorEvidence],
    state: 'accepted',
    ...overrides,
  };
}

describe('contradiction proposal persistence', () => {
  it('requires both current and prior evidence', () => {
    expect(contradictionFromProposal(proposal(), 't1')).toMatchObject({
      id: 'x1',
      threadId: 't1',
      status: 'proposed',
      currentEvidence,
      priorEvidence,
    });
  });

  it('refuses a one-sided contradiction', () => {
    expect(contradictionFromProposal(proposal({ priorEvidence: undefined }), 't1')).toBeNull();
  });

  it('ignores non-contradiction proposals', () => {
    expect(contradictionFromProposal(proposal({ kind: 'decision' }), 't1')).toBeNull();
  });
});
