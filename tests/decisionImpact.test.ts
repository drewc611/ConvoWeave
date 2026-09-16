import { describe, expect, it } from 'vitest';
import type { Assumption, Commitment, Decision, Question } from '../src/models/domain';
import { buildDecisionImpacts } from '../src/features/decisions/decisionImpact';

const evidence = (meetingId: string) => [{
  meetingId,
  segmentIds: [`${meetingId}:segment`],
  startMs: 0,
  endMs: 1000,
  quote: `Evidence from ${meetingId}`,
}];

function decision(id: string, status: Decision['status']): Decision {
  return {
    id,
    threadId: 'thread-1',
    statement: `Decision ${id}`,
    status,
    evidence: evidence(`meeting-${id}`),
    createdAt: '2026-09-16T12:00:00.000Z',
  };
}

function commitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: 'commitment-1',
    threadId: 'thread-1',
    statement: 'Prepare the launch checklist.',
    status: 'open',
    evidence: evidence('meeting-commitment'),
    createdAt: '2026-09-16T12:10:00.000Z',
    lastUpdatedAt: '2026-09-16T12:10:00.000Z',
    ...overrides,
  };
}

function assumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'assumption-1',
    threadId: 'thread-1',
    statement: 'The current rollout window is still valid.',
    status: 'untested',
    evidence: evidence('meeting-assumption'),
    ...overrides,
  };
}

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'question-1',
    threadId: 'thread-1',
    statement: 'Who approves the revised launch plan?',
    status: 'open',
    evidence: evidence('meeting-question'),
    createdAt: '2026-09-16T12:20:00.000Z',
    ...overrides,
  };
}

describe('decision impact alerts', () => {
  it('does not infer impacts when no explicit dependency exists', () => {
    const impacts = buildDecisionImpacts(
      [decision('decision-1', 'reversed')],
      [commitment()],
      [assumption()],
      [question()],
    );

    expect(impacts).toEqual([]);
  });

  it('does not alert while an explicitly linked decision remains active', () => {
    const impacts = buildDecisionImpacts(
      [decision('decision-1', 'active')],
      [commitment({ dependsOnDecisionIds: ['decision-1'] })],
      [],
      [],
    );

    expect(impacts).toEqual([]);
  });

  it('alerts deterministically for unresolved work linked to changed decisions', () => {
    const decisions = [
      decision('decision-reversed', 'reversed'),
      decision('decision-disputed', 'disputed'),
      decision('decision-superseded', 'superseded'),
    ];

    const impacts = buildDecisionImpacts(
      decisions,
      [commitment({ dependsOnDecisionIds: ['decision-superseded', 'decision-reversed'] })],
      [assumption({ dependsOnDecisionIds: ['decision-disputed'] })],
      [question({ dependsOnDecisionIds: ['decision-superseded'] })],
    );

    expect(impacts.map((impact) => [impact.kind, impact.decisionStatus])).toEqual([
      ['commitment', 'reversed'],
      ['assumption', 'disputed'],
      ['commitment', 'superseded'],
      ['question', 'superseded'],
    ]);
    expect(impacts[0]?.itemEvidence[0]?.quote).toBe('Evidence from meeting-commitment');
    expect(impacts[0]?.decisionEvidence[0]?.quote).toBe('Evidence from meeting-decision-reversed');
  });

  it('excludes completed, resolved, or validated dependent work without deleting its links', () => {
    const changed = decision('decision-1', 'reversed');
    const closedCommitment = commitment({ status: 'done', dependsOnDecisionIds: ['decision-1'] });
    const closedAssumption = assumption({ status: 'supported', dependsOnDecisionIds: ['decision-1'] });
    const closedQuestion = question({ status: 'resolved', dependsOnDecisionIds: ['decision-1'] });

    const impacts = buildDecisionImpacts(
      [changed],
      [closedCommitment],
      [closedAssumption],
      [closedQuestion],
    );

    expect(impacts).toEqual([]);
    expect(closedCommitment.dependsOnDecisionIds).toEqual(['decision-1']);
    expect(closedAssumption.dependsOnDecisionIds).toEqual(['decision-1']);
    expect(closedQuestion.dependsOnDecisionIds).toEqual(['decision-1']);
  });

  it('ignores dangling dependency ids rather than inventing a decision relationship', () => {
    const impacts = buildDecisionImpacts(
      [],
      [commitment({ dependsOnDecisionIds: ['missing-decision'] })],
      [],
      [],
    );

    expect(impacts).toEqual([]);
  });
});
