import { createDeterministicProcessor } from './deterministic.mjs';

export function createProcessor(config) {
  switch (config.processingProvider) {
    case 'deterministic':
      return createDeterministicProcessor();
    default:
      throw new Error(`No processor adapter configured for ${config.processingProvider}`);
  }
}
