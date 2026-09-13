import type { Meeting } from '../models/domain';
import type { ProviderBundle } from './providers';
import type { RemoteProcessingClient, RemoteProcessingResult } from './backendClient';
import {
  canUploadAudio,
  UploadNotApprovedError,
  type UploadApproval,
} from './uploadPolicy';

export type UploadApprovalProvider = (meeting: Meeting) => Promise<UploadApproval | null>;

export type RemoteProviderOptions = {
  maxPollAttempts?: number;
  pollIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class RemoteMeetingCoordinator {
  private readonly inFlight = new Map<string, Promise<RemoteProcessingResult>>();
  private readonly maxPollAttempts: number;
  private readonly pollIntervalMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly client: RemoteProcessingClient,
    private readonly approvalProvider: UploadApprovalProvider,
    options: RemoteProviderOptions = {},
  ) {
    this.maxPollAttempts = options.maxPollAttempts ?? 20;
    this.pollIntervalMs = options.pollIntervalMs ?? 1500;
    this.sleep = options.sleep ?? defaultSleep;
  }

  process(meeting: Meeting): Promise<RemoteProcessingResult> {
    const existing = this.inFlight.get(meeting.id);
    if (existing) return existing;

    const request = this.run(meeting).catch((error: unknown) => {
      this.inFlight.delete(meeting.id);
      throw error;
    });
    this.inFlight.set(meeting.id, request);
    return request;
  }

  private async run(meeting: Meeting): Promise<RemoteProcessingResult> {
    const approval = await this.approvalProvider(meeting);
    if (!approval || !canUploadAudio(approval)) {
      throw new UploadNotApprovedError(
        'Remote transcription requires explicit audio-and-transcript approval for this meeting.',
      );
    }

    const session = await this.client.createSession(meeting, approval);
    await this.client.uploadAudio(session, meeting, approval);

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt += 1) {
      const result = await this.client.getResult(session.id);
      if (result) return result;
      if (attempt < this.maxPollAttempts - 1) await this.sleep(this.pollIntervalMs);
    }

    throw new Error('Remote processing did not become ready before the polling limit.');
  }
}

export function createRemoteProviderBundle(
  client: RemoteProcessingClient,
  approvalProvider: UploadApprovalProvider,
  options: RemoteProviderOptions = {},
): ProviderBundle {
  const coordinator = new RemoteMeetingCoordinator(client, approvalProvider, options);

  return {
    transcription: {
      async transcribe(meeting) {
        return (await coordinator.process(meeting)).transcript;
      },
    },
    extraction: {
      async extract(meeting) {
        return (await coordinator.process(meeting)).review.proposals;
      },
    },
    contradiction: {
      async inspect(_threadId, proposals) {
        return proposals;
      },
    },
    briefing: {
      async buildBrief() {
        throw new Error('Remote briefing is not configured for the current backend adapter.');
      },
    },
  };
}
