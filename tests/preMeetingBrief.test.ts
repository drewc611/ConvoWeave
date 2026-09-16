import { describe, expect, it } from 'vitest';
import {
  buildLocalThreadBrief,
  createLocalBriefingProvider,
  type ThreadBriefSnapshot,
} from '../src/features/briefing/localBriefingProvider';

const NOW = Date.parse('2026-09-16T12:00:00.000Z');

function snapshot(): ThreadBriefSnapshot {
  return {
    threadTitle: 'Launch readiness',
    decisions: [
      {
        id: 'decision-1',
        threadId: 'thread-1',
        statement: 'Ship the mobile memory loop before calendar integrations.',
        status: 'active',
        evidence: [],
        createdAt: '2026-09-15T12:00:00.000Z',
      },
    ],
    commitments: [
      {
        id: 'commitment-overdue',
        threadId: 'thread-1',
        statement: 'Validate the Android recovery flow.',
        dueAt: '2026-09-15T17:00:00.000Z',
        status: 'open',
        evidence: [],
        createdAt: '2026-09-10T12:00:00.000Z',
        lastUpdatedAt: '2026-09-10T12:00:00.000Z',
      },
      {
        id: 'commitment-upcoming',
        threadId: 'thread-1',
        statement: 'Prepare store screenshots.',
        dueAt: '2026-09-20T17:00:00.000Z',
        status: 'open',
        evidence: [],
        createdAt: '2026-09-12T12:00:00.000Z',
        lastUpdatedAt: '2026-09-12T12:00:00.000Z',
      },
    ],
    assumptions: [
      {
        id: 'assumption-1',
        threadId: 'thread-1',
        statement: 'The current retention default is acceptable.',
        status: 'untested',
        evidence: [],
        reviewAt: '2026-09-16T10:00:00.000Z',
      },
    ],
    questions: [
      {
        id: 'question-1',
        threadId: 'thread-1',
        statement: 'Who owns the final store metadata review?',
        status: 'open',
        evidence: [],
        createdAt: '2026-09-14T12:00:00.000Z',
      },
    ],
    contradictions: [
      {
        id: 'contradiction-1',
        threadId: 'thread-1',
        currentEvidence: { meetingId: 'meeting-2', segmentIds: ['2'], startMs: 0, endMs: 1000 },
        priorEvidence: { meetingId: 'meeting-1', segmentIds: ['1'], startMs: 0, endMs: 1000 },
        explanation: 'The launch date differs from the active decision.',
        confidence: 0.93,
        status: 'proposed',
      },
    ],
  };
}

describe('local pre-meeting briefing', () => {
  it('prioritizes unresolved risk while retaining reviewed open questions', () => {
    const brief = buildLocalThreadBrief(snapshot(), NOW);

    expect(brief.title).toBe('Before Launch readiness');
    expect(brief.bullets[0]).toContain('Clarify before the meeting');
    expect(brief.bullets[1]).toBe('Overdue commitment: Validate the Android recovery flow.');
    expect(brief.bullets[2]).toBe('Validate now: The current retention default is acceptable.');
    expect(brief.bullets).toContain('Resolve question: Who owns the final store metadata review?');
    expect(brief.bullets).toContain('Current decision: Ship the mobile memory loop before calendar integrations.');
    expect(brief.bullets.length).toBeLessThanOrEqual(5);
  });

  it('returns a useful empty state without inventing meeting memory', () => {
    const brief = buildLocalThreadBrief({
      threadTitle: 'New thread',
      decisions: [],
      commitments: [],
      assumptions: [],
      questions: [],
      contradictions: [],
    }, NOW);

    expect(brief.title).toBe('Before New thread');
    expect(brief.bullets).toEqual([
      'No reviewed decisions, commitments, assumptions, questions, or contradictions need attention in this thread yet.',
    ]);
  });

  it('uses the requested thread snapshot through the BriefingProvider boundary', async () => {
    const requested: string[] = [];
    const provider = createLocalBriefingProvider((threadId) => {
      requested.push(threadId);
      return snapshot();
    });

    const brief = await provider.buildBrief('thread-1');

    expect(requested).toEqual(['thread-1']);
    expect(brief.title).toBe('Before Launch readiness');
    expect(brief.bullets[0]).toContain('Clarify before the meeting');
  });
});
