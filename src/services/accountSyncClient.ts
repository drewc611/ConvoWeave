import type { Assumption, Commitment, Decision, Meeting, Thread } from '../models/domain';

export type SyncedThreadSnapshot = {
  thread: Thread;
  decisions: Decision[];
  commitments: Commitment[];
  assumptions: Assumption[];
  meetings: Array<Pick<Meeting, 'id' | 'title' | 'startedAt' | 'endedAt' | 'status'>>;
  syncedAt?: string;
};

export type SyncedThreadSummary = {
  id: string;
  title: string;
  updatedAt?: string;
  counts: { decisions: number; commitments: number; assumptions: number; meetings: number };
};

export type AccountAccessTokenProvider = () => Promise<string | null>;

export class AccountSyncRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
    this.name = 'AccountSyncRequestError';
  }
}

export class HttpAccountSyncClient {
  constructor(
    private readonly baseUrl: string,
    private readonly accessTokenProvider: AccountAccessTokenProvider,
  ) {}

  async listThreads(): Promise<SyncedThreadSummary[]> {
    const response = await this.request('/v1/account/threads', { method: 'GET' });
    const payload = await response.json() as { threads: SyncedThreadSummary[] };
    return payload.threads;
  }

  async getThread(threadId: string): Promise<SyncedThreadSnapshot> {
    const response = await this.request(`/v1/account/threads/${encodeURIComponent(threadId)}`, { method: 'GET' });
    return response.json() as Promise<SyncedThreadSnapshot>;
  }

  async putThread(snapshot: SyncedThreadSnapshot): Promise<SyncedThreadSnapshot> {
    const response = await this.request(`/v1/account/threads/${encodeURIComponent(snapshot.thread.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    return response.json() as Promise<SyncedThreadSnapshot>;
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.request(`/v1/account/threads/${encodeURIComponent(threadId)}`, { method: 'DELETE' });
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const token = await this.accessTokenProvider();
    if (!token) throw new AccountSyncRequestError('Sign in is required before cloud sync.', 401, 'missing-access-token');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers });
    if (!response.ok) {
      let code = 'account-sync-failed';
      let message = 'ConvoWeave cloud sync failed.';
      try {
        const payload = await response.clone().json() as { error?: { code?: unknown; message?: unknown } };
        if (typeof payload.error?.code === 'string') code = payload.error.code;
        if (typeof payload.error?.message === 'string') message = payload.error.message;
      } catch {
        // Preserve a stable client error even for non-JSON gateway failures.
      }
      throw new AccountSyncRequestError(message, response.status, code);
    }
    return response;
  }
}
