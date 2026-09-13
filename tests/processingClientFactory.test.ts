import { describe, expect, it } from 'vitest';
import { HttpProcessingClient, LocalOnlyProcessingClient } from '../src/services/backendClient';
import { createProcessingClient } from '../src/services/processingClientFactory';

describe('processing client factory', () => {
  it('keeps local mode local-only', () => {
    const client = createProcessingClient({
      environment: 'development',
      processingMode: 'local',
    }, async () => null);
    expect(client).toBeInstanceOf(LocalOnlyProcessingClient);
  });

  it('creates the HTTP client only when remote mode has an API URL', () => {
    const client = createProcessingClient({
      environment: 'preview',
      processingMode: 'remote',
      apiUrl: 'https://preview-api.convoweave.example',
    }, async () => 'token');
    expect(client).toBeInstanceOf(HttpProcessingClient);
  });
});
