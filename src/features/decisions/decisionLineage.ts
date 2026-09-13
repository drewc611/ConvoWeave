import type { Decision } from '../../models/domain';

export function supersedeDecision(prior: Decision, replacement: Decision): { prior: Decision; replacement: Decision } {
  if (prior.id === replacement.id) {
    throw new Error('A replacement decision must have a new id.');
  }
  if (prior.threadId !== replacement.threadId) {
    throw new Error('Decision lineage cannot cross meeting threads.');
  }

  return {
    prior: {
      ...prior,
      status: 'superseded',
      supersededByDecisionId: replacement.id,
    },
    replacement: {
      ...replacement,
      status: 'active',
      supersedesDecisionId: prior.id,
    },
  };
}

export function reverseDecision(decision: Decision): Decision {
  return { ...decision, status: 'reversed' };
}

export function disputeDecision(decision: Decision): Decision {
  return { ...decision, status: 'disputed' };
}

export function restoreDecision(decision: Decision): Decision {
  return { ...decision, status: 'active' };
}
