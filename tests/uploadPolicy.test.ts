import { describe, expect, it } from 'vitest';
import type { Meeting } from '../src/models/domain';
import { assertUploadApproved, canUploadAudio, UploadNotApprovedError } from '../src/services/uploadPolicy';

const meeting: Meeting = {
  id: 'm1',
  threadId: 't1',
  title: 'Privacy review',
  startedAt: '2026-09-13T12:00:00Z',
  durationMs: 120000,
  audioUri: 'file:///meeting.m4a',
  status: 'review',
};

describe('upload policy', () => {
  it('blocks processing without explicit meeting approval', () => {
    expect(() => assertUploadApproved(meeting, null)).toThrow(UploadNotApprovedError);
  });

  it('rejects approval for another meeting', () => {
    expect(() => assertUploadApproved(meeting, {
      meetingId: 'm2',
      scope: 'transcript-only',
      approvedAt: '2026-09-13T12:05:00Z',
    })).toThrow(/does not belong/i);
  });

  it('rejects expired approval', () => {
    expect(() => assertUploadApproved(meeting, {
      meetingId: 'm1',
      scope: 'transcript-only',
      approvedAt: '2026-09-13T12:05:00Z',
      expiresAt: '2026-09-13T12:10:00Z',
    }, Date.parse('2026-09-13T12:11:00Z'))).toThrow(/expired/i);
  });

  it('distinguishes transcript-only from audio approval', () => {
    expect(canUploadAudio({
      meetingId: 'm1',
      scope: 'transcript-only',
      approvedAt: '2026-09-13T12:05:00Z',
    })).toBe(false);
    expect(canUploadAudio({
      meetingId: 'm1',
      scope: 'audio-and-transcript',
      approvedAt: '2026-09-13T12:05:00Z',
    })).toBe(true);
  });
});
