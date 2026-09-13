import type { RuntimeConfig } from '../config/runtime';
import {
  HttpProcessingClient,
  LocalOnlyProcessingClient,
  type RemoteProcessingClient,
} from './backendClient';

export type AccessTokenProvider = () => Promise<string | null>;

export function createProcessingClient(
  config: RuntimeConfig,
  accessTokenProvider: AccessTokenProvider,
): RemoteProcessingClient {
  if (config.processingMode === 'local') {
    return new LocalOnlyProcessingClient();
  }

  if (!config.apiUrl) {
    throw new Error('Remote processing requires an API URL.');
  }

  return new HttpProcessingClient(config.apiUrl, accessTokenProvider);
}
