import { describe, expect, it } from 'vitest';
import type { Meeting } from '../src/models/domain';
import { beginLocalAudioCleanup, eligibleCompletedAudio, finishLocalAudioCleanup, pendingAudioCleanup, retentionCutoff, withoutLocalAudio } from '../src/features/privacy/retentionPolicy';

const now = new Date('2026-09-19T12:00:00.000Z');

function meeting(overrides: Partial<Meeting>): Meeting {
  return {
    id: overrides.id ?? 'meeting-1',
    threadId: 'thread-1',
    title: 'Retention test',
    startedAt: '2026-08-01T12:00:00.000Z',
    endedAt: '2026-08-01T13:00:00.000Z',
    durationMs: 3600000,
    audioUri: 'file:///recording.m4a',
    status: 'complete',
    transcript: {
      meetingId: overrides.id ?? 'meeting-1',
      segments: [{
        id: 'segment-1',
        meetingId: overrides.id ?? 'meeting-1',
        startMs: 0,
        endMs: 1000,
        text: 'Keep this transcript.',
      }],
    },
    ...overrides,
  };
}

describe('local raw-audio retention', () => {
  it('treats forever as a true no-op', () => {
    expect(retentionCutoff('forever', now)).toBeNull();
    expect(eligibleCompletedAudio([meeting({})], 'forever', now)).toEqual([]);
  });

  it('selects only completed recordings older than the cutoff', () => {
    const oldComplete = meeting({ id: 'old', endedAt: '2026-08-01T13:00:00.000Z' });
    const recentComplete = meeting({ id: 'recent', endedAt: '2026-09-10T13:00:00.000Z' });
    const oldDraft = meeting({ id: 'draft', status: 'draft', endedAt: undefined });
    const oldReview = meeting({ id: 'review', status: 'review' });
    const alreadyClean = meeting({ id: 'clean', audioUri: undefined });

    expect(eligibleCompletedAudio(
      [oldComplete, recentComplete, oldDraft, oldReview, alreadyClean],
      '30d',
      now,
    ).map((item) => item.id)).toEqual(['old']);
  });

  it('uses the configured 7, 30 and 90 day boundaries', () => {
    const twentyDaysOld = meeting({ id: '20', endedAt: '2026-08-30T12:00:00.000Z' });
    const sixtyDaysOld = meeting({ id: '60', endedAt: '2026-07-21T12:00:00.000Z' });

    expect(eligibleCompletedAudio([twentyDaysOld, sixtyDaysOld], '7d', now).map((item) => item.id)).toEqual(['20', '60']);
    expect(eligibleCompletedAudio([twentyDaysOld, sixtyDaysOld], '30d', now).map((item) => item.id)).toEqual(['60']);
    expect(eligibleCompletedAudio([twentyDaysOld, sixtyDaysOld], '90d', now)).toEqual([]);
  });

  it('removes only the local audio reference and preserves structured meeting memory', () => {
    const original = meeting({ id: 'preserve', captureNotes: undefined });
    const cleaned = withoutLocalAudio(original);

    expect(cleaned.audioUri).toBeUndefined();
    expect(cleaned.transcript).toEqual(original.transcript);
    expect(cleaned.status).toBe('complete');
    expect(cleaned.threadId).toBe(original.threadId);
    expect(cleaned.endedAt).toBe(original.endedAt);
    expect(original.audioUri).toBe('file:///recording.m4a');
  });
  it('persists a recoverable tombstone before destructive deletion', () => {
    const original = meeting({ id: 'pending' });
    const pending = beginLocalAudioCleanup(original);

    expect(pending.audioUri).toBeUndefined();
    expect(pending.audioCleanupUri).toBe('file:///recording.m4a');
    expect(pending.transcript).toEqual(original.transcript);
    expect(pendingAudioCleanup([pending])).toEqual([pending]);
  });

  it('recovers idempotently after interruption between state transition and deletion', () => {
    const pending = beginLocalAudioCleanup(meeting({ id: 'restart' }));
    const recovered = finishLocalAudioCleanup(pending);
    const retried = finishLocalAudioCleanup(recovered);

    expect(recovered.audioUri).toBeUndefined();
    expect(recovered.audioCleanupUri).toBeUndefined();
    expect(retried).toEqual(recovered);
    expect(recovered.transcript).toEqual(pending.transcript);
  });

  it('never begins cleanup for draft or review-stage recordings', () => {
    const draft = meeting({ id: 'draft-safe', status: 'draft' });
    const review = meeting({ id: 'review-safe', status: 'review' });

    expect(beginLocalAudioCleanup(draft)).toBe(draft);
    expect(beginLocalAudioCleanup(review)).toBe(review);
  });
});
