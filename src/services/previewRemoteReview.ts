import type { Meeting, MeetingReview } from '../models/domain';
import type { RuntimeConfig } from '../config/runtime';
import { createProcessingClient } from './processingClientFactory';
import { createRemoteProviderBundle } from './remoteProviders';
import { BackendRequestError } from './backendClient';

export type PreviewRemoteReviewOptions = {
  maxPollAttempts?: number;
  pollIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
};

export function canUsePreviewRemoteProcessing(config: RuntimeConfig, meeting: Meeting, accessToken: string): boolean {
  return config.environment === 'preview'
    && config.processingMode === 'remote'
    && Boolean(config.apiUrl)
    && Boolean(meeting.audioUri)
    && Boolean(accessToken.trim());
}

export async function buildPreviewRemoteReview(
  config: RuntimeConfig,
  meeting: Meeting,
  accessToken: string,
  options: PreviewRemoteReviewOptions = {},
): Promise<MeetingReview> {
  if (config.environment !== 'preview' || config.processingMode !== 'remote' || !config.apiUrl) {
    throw new Error('Remote processing is available only in an explicitly configured preview build.');
  }
  if (!meeting.audioUri) throw new Error('This meeting does not have a local recording to upload.');
  const token = accessToken.trim();
  if (!token) throw new Error('Enter a preview access token before remote processing.');

  const now = options.now ?? (() => new Date());
  const client = createProcessingClient(config, async () => token);
  const providers = createRemoteProviderBundle(
    client,
    async (approvedMeeting) => ({
      meetingId: approvedMeeting.id,
      scope: 'audio-and-transcript',
      approvedAt: now().toISOString(),
    }),
    {
      maxPollAttempts: options.maxPollAttempts,
      pollIntervalMs: options.pollIntervalMs,
      sleep: options.sleep,
    },
  );

  const transcript = await providers.transcription.transcribe(meeting);
  const proposals = await providers.extraction.extract(meeting, transcript);
  return {
    id: meeting.id,
    meetingId: meeting.id,
    transcript,
    proposals,
    updatedAt: now().toISOString(),
  };
}

export function describeRemoteProcessingError(error: unknown): string {
  if (error instanceof BackendRequestError) {
    const requestSuffix = error.requestId ? ` Request ID: ${error.requestId}.` : '';
    return `${error.message}${requestSuffix}`;
  }
  return error instanceof Error ? error.message : 'Remote processing failed. Continue with manual review.';
}
