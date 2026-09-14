import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Meeting } from '../src/models/domain';
import type { RuntimeConfig } from '../src/config/runtime';
import { BackendRequestError } from '../src/services/backendClient';
import {
  buildPreviewRemoteReview,
  canUsePreviewRemoteProcessing,
  describeRemoteProcessingError,
} from '../src/services/previewRemoteReview';

const meeting: Meeting = {
  id: 'meeting-preview-1',
  threadId: 'thread-1',
  title: 'Preview meeting',
  startedAt: '2026-09-13T21:00:00-04:00',
  endedAt: '2026-09-13T21:15:00-04:00',
  durationMs: 900000,
  audioUri: 'file:///recordings/preview.m4a',
  status: 'review',
};

const config: RuntimeConfig = {
  environment: 'preview',
  processingMode: 'remote',
  apiUrl: 'https://preview-api.example.test',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('preview remote review', () => {
  it('requires preview remote config, local audio and an in-memory token', () => {
    expect(canUsePreviewRemoteProcessing(config, meeting, 'token')).toBe(true);
    expect(canUsePreviewRemoteProcessing({ ...config, processingMode: 'local' }, meeting, 'token')).toBe(false);
    expect(canUsePreviewRemoteProcessing(config, { ...meeting, audioUri: undefined }, 'token')).toBe(false);
    expect(canUsePreviewRemoteProcessing(config, meeting, '   ')).toBe(false);
  });

  it('processes approved audio and returns the backend review', async () => {
    let resultPolls = 0;
    const remoteResult = {
      transcript: {
        meetingId: meeting.id,
        segments: [{
          id: 'segment-1',
          meetingId: meeting.id,
          startMs: 0,
          endMs: 3000,
          text: 'Ship on Friday.',
        }],
      },
      review: {
        id: meeting.id,
        meetingId: meeting.id,
        transcript: { meetingId: meeting.id, segments: [] },
        proposals: [{
          id: 'decision-1',
          kind: 'decision',
          statement: 'Ship on Friday.',
          confidence: 0.92,
          evidence: [{ meetingId: meeting.id, segmentIds: ['segment-1'], startMs: 0, endMs: 3000, quote: 'Ship on Friday.' }],
          state: 'proposed',
        }],
        updatedAt: '2026-09-13T21:16:00-04:00',
      },
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === meeting.audioUri) return new Response(new Blob(['audio-bytes'], { type: 'audio/mp4' }), { status: 200 });
      if (url.endsWith('/v1/processing-sessions') && init?.method === 'POST') {
        expect(new Headers(init.headers).get('Authorization')).toBe('Bearer preview-token');
        return new Response(JSON.stringify({
          id: 'session-1',
          meetingId: meeting.id,
          status: 'created',
          audioUploadUrl: 'https://upload.example.test/audio-1',
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
      if (url === 'https://upload.example.test/audio-1' && init?.method === 'PUT') {
        expect(new Headers(init.headers).get('Authorization')).toBeNull();
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/v1/processing-sessions/session-1') && init?.method === 'GET') {
        resultPolls += 1;
        if (resultPolls === 1) return new Response(JSON.stringify({ status: 'processing' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify(remoteResult), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const review = await buildPreviewRemoteReview(config, meeting, ' preview-token ', {
      maxPollAttempts: 3,
      pollIntervalMs: 0,
      sleep: async () => undefined,
      now: () => new Date('2026-09-13T21:16:30-04:00'),
    });

    expect(review.transcript).toEqual(remoteResult.transcript);
    expect(review.proposals).toEqual(remoteResult.review.proposals);
    expect(review.updatedAt).toBe('2026-09-14T01:16:30.000Z');
    expect(resultPolls).toBe(2);
  });

  it('fails closed without explicit preview credentials', async () => {
    await expect(buildPreviewRemoteReview(config, meeting, '   ')).rejects.toThrow('Enter a preview access token');
    await expect(buildPreviewRemoteReview({ ...config, environment: 'production' }, meeting, 'token')).rejects.toThrow('preview build');
  });

  it('includes backend request IDs in user-facing diagnostics', () => {
    const message = describeRemoteProcessingError(new BackendRequestError('Authentication is required.', 401, 'unauthorized', 'req-123'));
    expect(message).toContain('Authentication is required.');
    expect(message).toContain('req-123');
  });
});
