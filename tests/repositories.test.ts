import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Meeting, MeetingReview, PrivateNote, Question, Thread } from '../src/models/domain';

const sqliteState = vi.hoisted(() => ({
  rows: new Map<string, { kind: string; id: string; payload: string; updatedAt: string }>(),
}));

vi.mock('../src/storage/database', () => ({
  getDatabase: async () => ({
    getAllAsync: async <T>(_sql: string, kind: string): Promise<T[]> => {
      return [...sqliteState.rows.values()]
        .filter((row) => row.kind === kind)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((row) => ({ payload: row.payload }) as T);
    },
    getFirstAsync: async <T>(_sql: string, kind: string, id: string): Promise<T | null> => {
      const row = sqliteState.rows.get(`${kind}:${id}`);
      return row ? ({ payload: row.payload } as T) : null;
    },
    runAsync: async (sql: string, ...args: unknown[]) => {
      if (sql.startsWith('INSERT INTO entities')) {
        const [kind, id, payload, updatedAt] = args as [string, string, string, string];
        sqliteState.rows.set(`${kind}:${id}`, { kind, id, payload, updatedAt });
        return;
      }
      if (sql.startsWith('DELETE FROM entities')) {
        const [kind, id] = args as [string, string];
        sqliteState.rows.delete(`${kind}:${id}`);
        return;
      }
      throw new Error(`Unexpected SQL in repository test: ${sql}`);
    },
  }),
}));

import {
  MeetingRepository,
  MeetingReviewRepository,
  PrivateNoteRepository,
  QuestionRepository,
  ThreadRepository,
} from '../src/storage/repositories';

beforeEach(() => {
  sqliteState.rows.clear();
});

describe('repository restart persistence', () => {
  it('recovers an unfinished recording draft and live notes from a new repository instance', async () => {
    const draft: Meeting = {
      id: 'meeting-draft-1',
      threadId: 'thread-1',
      title: 'Recovery test',
      startedAt: '2026-09-13T18:00:00-04:00',
      durationMs: 65000,
      audioUri: 'file:///recordings/meeting-draft-1.m4a',
      captureNotes: 'Pricing decision changed. Ask Jordan to confirm the rollout date.',
      status: 'draft',
    };

    await new MeetingRepository().upsert(draft);

    const afterRestart = await new MeetingRepository().get(draft.id);
    expect(afterRestart).toEqual(draft);
    expect(afterRestart?.status).toBe('draft');
    expect(afterRestart?.audioUri).toBe(draft.audioUri);
    expect(afterRestart?.durationMs).toBe(65000);
    expect(afterRestart?.captureNotes).toBe('Pricing decision changed. Ask Jordan to confirm the rollout date.');
  });

  it('recovers transcript and proposal review state from a new repository instance', async () => {
    const review: MeetingReview = {
      id: 'meeting-1',
      meetingId: 'meeting-1',
      transcript: {
        meetingId: 'meeting-1',
        segments: [
          {
            id: 'segment-1',
            meetingId: 'meeting-1',
            speakerId: 'speaker-1',
            startMs: 0,
            endMs: 4200,
            text: 'Keep the current launch date.',
          },
        ],
      },
      proposals: [
        {
          id: 'decision-1',
          kind: 'decision',
          statement: 'Keep the current launch date.',
          confidence: 0.95,
          evidence: [
            {
              meetingId: 'meeting-1',
              segmentIds: ['segment-1'],
              speakerId: 'speaker-1',
              startMs: 0,
              endMs: 4200,
              quote: 'Keep the current launch date.',
            },
          ],
          state: 'accepted',
        },
      ],
      updatedAt: '2026-09-13T18:10:00-04:00',
    };

    await new MeetingReviewRepository().upsert(review);

    const afterRestart = await new MeetingReviewRepository().get(review.id);
    expect(afterRestart).toEqual(review);
    expect(afterRestart?.proposals[0]?.state).toBe('accepted');
    expect(afterRestart?.transcript.segments[0]?.text).toBe('Keep the current launch date.');
  });

  it('preserves durable question state and source evidence across repository instances', async () => {
    const question: Question = {
      id: 'question-1',
      threadId: 'thread-1',
      statement: 'Who owns the final launch approval?',
      status: 'open',
      evidence: [
        {
          meetingId: 'meeting-1',
          segmentIds: ['segment-question-1'],
          speakerId: 'speaker-1',
          startMs: 5000,
          endMs: 6500,
          quote: 'Who owns the final launch approval?',
        },
      ],
      createdAt: '2026-09-13T18:12:00-04:00',
    };

    await new QuestionRepository().upsert(question);

    const afterRestart = await new QuestionRepository().get(question.id);
    expect(afterRestart).toEqual(question);
    expect(afterRestart?.status).toBe('open');
    expect(afterRestart?.evidence[0]?.quote).toBe('Who owns the final launch approval?');
  });

  it('preserves thread identity and private-note promotion state across repository instances', async () => {
    const thread: Thread = {
      id: 'thread-1',
      title: 'Product launch',
      createdAt: '2026-09-13T18:00:00-04:00',
      updatedAt: '2026-09-13T18:00:00-04:00',
    };
    const note: PrivateNote = {
      id: 'private-1',
      threadId: thread.id,
      body: 'Ask about the unconfirmed budget privately.',
      createdAt: '2026-09-13T18:05:00-04:00',
      updatedAt: '2026-09-13T18:07:00-04:00',
      promotedAt: '2026-09-13T18:07:00-04:00',
    };

    await new ThreadRepository().upsert(thread);
    await new PrivateNoteRepository().upsert(note);

    const restartedThreads = await new ThreadRepository().list();
    const restartedNotes = await new PrivateNoteRepository().list();
    expect(restartedThreads).toEqual([thread]);
    expect(restartedNotes).toEqual([note]);
    expect(restartedNotes[0]?.promotedAt).toBe(note.promotedAt);
  });

  it('persists deletion across repository re-instantiation', async () => {
    const thread: Thread = {
      id: 'thread-delete',
      title: 'Temporary',
      createdAt: '2026-09-13T18:00:00-04:00',
      updatedAt: '2026-09-13T18:00:00-04:00',
    };

    await new ThreadRepository().upsert(thread);
    await new ThreadRepository().remove(thread.id);

    expect(await new ThreadRepository().get(thread.id)).toBeNull();
  });
});
