import type { Meeting, MeetingReview, Transcript } from '../models/domain';
import { assertUploadApproved, canUploadAudio, type UploadApproval } from './uploadPolicy';

export type ProcessingSession = {
  id: string;
  meetingId: string;
  status: 'created' | 'uploading' | 'processing' | 'ready' | 'failed';
  audioUploadUrl?: string;
};

export type RemoteProcessingResult = {
  transcript: Transcript;
  review: MeetingReview;
};

export class BackendRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'BackendRequestError';
  }
}

export interface RemoteProcessingClient {
  createSession(meeting: Meeting, approval: UploadApproval): Promise<ProcessingSession>;
  uploadAudio(session: ProcessingSession, meeting: Meeting, approval: UploadApproval): Promise<void>;
  getResult(sessionId: string): Promise<RemoteProcessingResult | null>;
}

export class LocalOnlyProcessingClient implements RemoteProcessingClient {
  async createSession(): Promise<ProcessingSession> {
    throw new Error('Remote processing is disabled in local mode.');
  }

  async uploadAudio(): Promise<void> {
    throw new Error('Remote processing is disabled in local mode.');
  }

  async getResult(): Promise<RemoteProcessingResult | null> {
    throw new Error('Remote processing is disabled in local mode.');
  }
}

export class HttpProcessingClient implements RemoteProcessingClient {
  constructor(private readonly baseUrl: string, private readonly accessTokenProvider: () => Promise<string | null>) {}

  async createSession(meeting: Meeting, approval: UploadApproval): Promise<ProcessingSession> {
    assertUploadApproved(meeting, approval);
    const response = await this.request('/v1/processing-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId: meeting.id,
        threadId: meeting.threadId,
        uploadScope: approval.scope,
        approvedAt: approval.approvedAt,
        durationMs: meeting.durationMs,
      }),
    });
    return response.json() as Promise<ProcessingSession>;
  }

  async uploadAudio(session: ProcessingSession, meeting: Meeting, approval: UploadApproval): Promise<void> {
    assertUploadApproved(meeting, approval);
    if (!canUploadAudio(approval)) throw new Error('This approval allows transcript upload only.');
    if (!session.audioUploadUrl) throw new Error('Backend did not provide an audio upload URL.');
    if (!meeting.audioUri) throw new Error('Meeting has no local audio URI.');

    const audioResponse = await fetch(meeting.audioUri);
    if (!audioResponse.ok) throw new Error('Local recording could not be opened for upload.');
    const audio = await audioResponse.blob();
    const uploadResponse = await fetch(session.audioUploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': audio.type || 'application/octet-stream' },
      body: audio,
    });
    if (!uploadResponse.ok) {
      throw await this.toRequestError(uploadResponse, 'Audio upload failed.');
    }
  }

  async getResult(sessionId: string): Promise<RemoteProcessingResult | null> {
    const response = await this.request(`/v1/processing-sessions/${encodeURIComponent(sessionId)}`, { method: 'GET' });
    if (response.status === 202) return null;
    return response.json() as Promise<RemoteProcessingResult>;
  }

  private async request(path: string, init: RequestInit) {
    const token = await this.accessTokenProvider();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers });
    if (!response.ok && response.status !== 202) {
      throw await this.toRequestError(response, 'Backend request failed.');
    }
    return response;
  }

  private async toRequestError(response: Response, fallbackMessage: string): Promise<BackendRequestError> {
    const headerRequestId = response.headers.get('x-request-id') ?? undefined;
    let code = 'backend-request-failed';
    let message = fallbackMessage;
    let requestId = headerRequestId;

    try {
      const payload = await response.clone().json() as {
        error?: { code?: unknown; message?: unknown; requestId?: unknown };
      };
      if (typeof payload.error?.code === 'string') code = payload.error.code;
      if (typeof payload.error?.message === 'string') message = payload.error.message;
      if (typeof payload.error?.requestId === 'string') requestId = payload.error.requestId;
    } catch {
      // Non-JSON upstream errors still become a typed client error.
    }

    return new BackendRequestError(message, response.status, code, requestId);
  }
}
