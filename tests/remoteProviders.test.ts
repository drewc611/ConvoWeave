import { describe, expect, it, vi } from 'vitest';
import type { Meeting, MeetingReview, Transcript } from '../src/models/domain';
import type { RemoteProcessingClient, RemoteProcessingResult } from '../src/services/backendClient';
import { createRemoteProviderBundle } from '../src/services/remoteProviders';
import { UploadNotApprovedError, type UploadApproval } from '../src/services/uploadPolicy';

const meeting: Meeting = {
  id: 'meeting-remote-1',
  threadId: 'thread-1',
  title: 'Remote processing test',
  startedAt: '2026-09-13T18:00:00-04:00',
  endedAt: '2026-09-13T18:15:00-04:00',
  durationMs: 900000,
  audioUri: 'file:///recordings/meeting-remote-1.m4a',
  status: 'review',
};

const transcript: Transcript = {
  meetingId: meeting.id,
  segments: [
    {
      id: 'segment-1',
      meetingId: meeting.id,
      startMs: 0,
      endMs: 3000,
      text: 'Ship the alpha on Friday.',
    },
  ],
};

const review: MeetingReview = {
  id: meeting.id,
  meetingId: meeting.id,
  transcript,
  proposals: [
    {
      id: 'decision-1',
      kind: 'decision',
      statement: 'Ship the alpha on Friday.',
      confidence: 0.9,
      evidence: [
        {
          meetingId: meeting.id,
          segmentIds: ['segment-1'],
          startMs: 0,
          endMs: 3000,
          quote: 'Ship the alpha on Friday.',
        },
      ],
      state: 'proposed',
    },
  ],
  updatedAt: '2026-09-13T18:16:00-04:00',
};

const result: RemoteProcessingResult = { transcript, review };

function approved(): UploadApproval {
  return {
    meetingId: meeting.id,
    scope: 'audio-and-transcript',
    approvedAt: '2026-09-13T18:15:30-04:00',
  };
}

describe('remote provider adapter', () => {
  it('shares one remote processing session across transcription and extraction', async () => {
    const createSession = vi.fn(async () => ({ id: 'session-1', meetingId: meeting.id, status: 'created' as const, audioUploadUrl: 'https://upload.example.test/audio' }));
    const uploadAudio = vi.fn(async () => undefined);
    const getResult = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(result);

    const client: RemoteProcessingClient = { createSession, uploadAudio, getResult };
    const bundle = createRemoteProviderBundle(client, async () => approved(), {
      maxPollAttempts: 3,
      pollIntervalMs: 0,
      sleep: async () => undefined,
    });

    const remoteTranscript = await bundle.transcription.transcribe(meeting);
    const proposals = await bundle.extraction.extract(meeting, remoteTranscript);

    expect(remoteTranscript).toEqual(transcript);
    expect(proposals).toEqual(review.proposals);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(uploadAudio).toHaveBeenCalledTimes(1);
    expect(getResult).toHaveBeenCalledTimes(2);
  });

  it('rejects remote transcription when approval does not include audio', async () => {
    const client: RemoteProcessingClient = {
      createSession: vi.fn(),
      uploadAudio: vi.fn(),
      getResult: vi.fn(),
    };
    const bundle = createRemoteProviderBundle(client, async () => ({
      meetingId: meeting.id,
      scope: 'transcript-only',
      approvedAt: '2026-09-13T18:15:30-04:00',
    }));

    await expect(bundle.transcription.transcribe(meeting)).rejects.toBeInstanceOf(UploadNotApprovedError);
    expect(client.createSession).not.toHaveBeenCalled();
    expect(client.uploadAudio).not.toHaveBeenCalled();
  });

  it('clears a failed cached request so a later retry can start a new session', async () => {
    const createSession = vi.fn()
      .mockRejectedValueOnce(new Error('temporary backend failure'))
      .mockResolvedValueOnce({ id: 'session-2', meetingId: meeting.id, status: 'created' as const, audioUploadUrl: 'https://upload.example.test/audio' });
    const uploadAudio = vi.fn(async () => undefined);
    const getResult = vi.fn(async () => result);
    const client: RemoteProcessingClient = { createSession, uploadAudio, getResult };
    const bundle = createRemoteProviderBundle(client, async () => approved(), { sleep: async () => undefined });

    await expect(bundle.transcription.transcribe(meeting)).rejects.toThrow('temporary backend failure');
    await expect(bundle.transcription.transcribe(meeting)).resolves.toEqual(transcript);
    expect(createSession).toHaveBeenCalledTimes(2);
  });
});
