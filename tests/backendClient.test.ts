import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Meeting } from '../src/models/domain';
import { HttpProcessingClient } from '../src/services/backendClient';
import type { UploadApproval } from '../src/services/uploadPolicy';

const meeting: Meeting = {
  id: 'meeting-http-1',
  threadId: 'thread-1',
  title: 'HTTP boundary test',
  startedAt: '2026-09-13T18:00:00-04:00',
  endedAt: '2026-09-13T18:05:00-04:00',
  durationMs: 300000,
  audioUri: 'file:///recordings/meeting-http-1.m4a',
  status: 'review',
};

const approval: UploadApproval = {
  meetingId: meeting.id,
  scope: 'audio-and-transcript',
  approvedAt: '2026-09-13T18:05:30-04:00',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HttpProcessingClient credential boundary', () => {
  it('sends bearer authorization to ConvoWeave backend requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        id: 'session-1',
        meetingId: meeting.id,
        status: 'created',
        audioUploadUrl: 'https://uploads.example.test/audio',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const client = new HttpProcessingClient('https://api.convoweave.example/', async () => 'secret-access-token');

    await client.createSession(meeting, approval);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.convoweave.example/v1/processing-sessions');
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer secret-access-token');
  });

  it('never forwards the backend bearer token to a presigned audio upload URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(new Blob(['audio-bytes'], { type: 'audio/mp4' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const client = new HttpProcessingClient('https://api.convoweave.example', async () => 'secret-access-token');

    await client.uploadAudio(
      {
        id: 'session-1',
        meetingId: meeting.id,
        status: 'created',
        audioUploadUrl: 'https://uploads.example.test/audio',
      },
      meeting,
      approval,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [localUrl] = fetchMock.mock.calls[0] ?? [];
    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1] ?? [];
    expect(localUrl).toBe(meeting.audioUri);
    expect(uploadUrl).toBe('https://uploads.example.test/audio');
    const uploadHeaders = new Headers(uploadInit?.headers);
    expect(uploadHeaders.get('Authorization')).toBeNull();
    expect(uploadHeaders.get('Content-Type')).toBe('audio/mp4');
  });

  it('treats HTTP 202 as processing-not-ready rather than a failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 202 }));
    const client = new HttpProcessingClient('https://api.convoweave.example', async () => null);

    await expect(client.getResult('session-1')).resolves.toBeNull();
  });
});
