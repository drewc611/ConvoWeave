import { createDeterministicProcessor } from './deterministic.mjs';
import { createOpenAIProcessor } from './openai.mjs';

export function createProcessor(config, options) {
  switch (config.processingProvider) {
    case 'deterministic':
      return createDeterministicProcessor();
    case 'openai':
      return createOpenAIProcessor(config, options);
    default:
      throw new Error(`No processor adapter configured for ${config.processingProvider}`);
  }
}
