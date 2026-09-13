import type { Contradiction, MeetingProposal } from '../../models/domain';

export function contradictionFromProposal(proposal: MeetingProposal, threadId: string): Contradiction | null {
  if (proposal.kind !== 'contradiction') return null;
  const currentEvidence = proposal.evidence[0];
  const priorEvidence = proposal.priorEvidence?.[0];
  if (!currentEvidence || !priorEvidence) return null;

  return {
    id: proposal.id,
    threadId,
    currentEvidence,
    priorEvidence,
    explanation: proposal.statement,
    confidence: proposal.confidence,
    status: 'proposed',
  };
}
