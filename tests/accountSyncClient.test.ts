import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountSyncRequestError, HttpAccountSyncClient, type SyncedThreadSnapshot } from '../src/services/accountSyncClient';

const snapshot: SyncedThreadSnapshot = {
  thread: { id: 'thread-1', title: 'Roadmap', createdAt: '2026-09-14T00:00:00Z', updatedAt: '2026-09-14T00:00:00Z' },
  decisions: [],
  commitments: [],
  assumptions: [],
  meetings: [],
};

afterEach(() => vi.restoreAllMocks());

describe('HttpAccountSyncClient', () => {
  it('sends the bearer token only to the configured ConvoWeave sync API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(snapshot), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const client = new HttpAccountSyncClient('https://mcp.convoweave.example/', async () => 'access-token');
    await client.putThread(snapshot);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://mcp.convoweave.example/v1/account/threads/thread-1');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer access-token');
  });

  it('fails closed when no access token is available', async () => {
    const client = new HttpAccountSyncClient('https://mcp.convoweave.example', async () => null);
    await expect(client.listThreads()).rejects.toMatchObject({ code: 'missing-access-token', status: 401 });
  });

  it('preserves stable server error codes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'insufficient-scope', message: 'Missing required scope.' },
    }), { status: 403, headers: { 'Content-Type': 'application/json' } }));
    const client = new HttpAccountSyncClient('https://mcp.convoweave.example', async () => 'access-token');
    let caught: unknown;
    try { await client.getThread('thread-1'); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AccountSyncRequestError);
    expect(caught).toMatchObject({ code: 'insufficient-scope', status: 403 });
  });
});
