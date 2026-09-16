import type { Assumption, Commitment, Decision, EvidenceRef, Question } from '../../models/domain';

export type DecisionImpactKind = 'commitment' | 'assumption' | 'question';

export type DecisionImpact = {
  id: string;
  kind: DecisionImpactKind;
  itemId: string;
  itemStatement: string;
  itemEvidence: EvidenceRef[];
  decisionId: string;
  decisionStatement: string;
  decisionStatus: Exclude<Decision['status'], 'active'>;
  decisionEvidence: EvidenceRef[];
};

function impactedDecision(decision: Decision | undefined): decision is Decision & { status: Exclude<Decision['status'], 'active'> } {
  return Boolean(decision && decision.status !== 'active');
}

export function buildDecisionImpacts(
  decisions: Decision[],
  commitments: Commitment[],
  assumptions: Assumption[],
  questions: Question[],
): DecisionImpact[] {
  const decisionsById = new Map(decisions.map((decision) => [decision.id, decision]));
  const impacts: DecisionImpact[] = [];

  const collect = (
    kind: DecisionImpactKind,
    item: { id: string; statement: string; evidence: EvidenceRef[]; dependsOnDecisionIds?: string[] },
  ) => {
    for (const decisionId of item.dependsOnDecisionIds ?? []) {
      const decision = decisionsById.get(decisionId);
      if (!impactedDecision(decision)) continue;
      impacts.push({
        id: `${kind}:${item.id}:${decision.id}`,
        kind,
        itemId: item.id,
        itemStatement: item.statement,
        itemEvidence: item.evidence,
        decisionId: decision.id,
        decisionStatement: decision.statement,
        decisionStatus: decision.status,
        decisionEvidence: decision.evidence,
      });
    }
  };

  for (const commitment of commitments.filter((item) => item.status === 'open')) collect('commitment', commitment);
  for (const assumption of assumptions.filter((item) => item.status === 'untested')) collect('assumption', assumption);
  for (const question of questions.filter((item) => item.status === 'open')) collect('question', question);

  const statusRank: Record<DecisionImpact['decisionStatus'], number> = {
    reversed: 0,
    disputed: 1,
    superseded: 2,
  };
  const kindRank: Record<DecisionImpactKind, number> = { commitment: 0, assumption: 1, question: 2 };

  return impacts.sort((left, right) =>
    statusRank[left.decisionStatus] - statusRank[right.decisionStatus]
    || kindRank[left.kind] - kindRank[right.kind]
    || left.itemStatement.localeCompare(right.itemStatement),
  );
}
