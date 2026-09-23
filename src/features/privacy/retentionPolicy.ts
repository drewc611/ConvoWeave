import type { AudioRetentionPolicy, Meeting, PrivacySettings } from '../../models/domain';

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  id: 'privacy-settings',
  audioRetention: 'forever',
  updatedAt: '1970-01-01T00:00:00.000Z',
};

const RETENTION_DAYS: Record<Exclude<AudioRetentionPolicy, 'forever'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function retentionCutoff(policy: AudioRetentionPolicy, now: Date): number | null {
  if (policy === 'forever') return null;
  return now.getTime() - RETENTION_DAYS[policy] * 24 * 60 * 60 * 1000;
}

export function eligibleCompletedAudio(
  meetings: Meeting[],
  policy: AudioRetentionPolicy,
  now = new Date(),
): Meeting[] {
  const cutoff = retentionCutoff(policy, now);
  if (cutoff === null) return [];

  return meetings.filter((meeting) => {
    if (meeting.status !== 'complete' || !meeting.audioUri || meeting.audioCleanupUri) return false;
    const completedAt = meeting.endedAt ?? meeting.startedAt;
    const completedMs = Date.parse(completedAt);
    return Number.isFinite(completedMs) && completedMs < cutoff;
  });
}

/**
 * First phase of local audio cleanup. Persist this state before deleting the file.
 * A restart can resume deletion from audioCleanupUri without claiming audio is available.
 */
export function beginLocalAudioCleanup(meeting: Meeting): Meeting {
  if (!meeting.audioUri || meeting.status !== 'complete') return meeting;
  const { audioUri, ...rest } = meeting;
  return { ...rest, audioCleanupUri: audioUri };
}

/** Final phase after deletion succeeds or the file is already absent. */
export function finishLocalAudioCleanup(meeting: Meeting): Meeting {
  const { audioUri: _audioUri, audioCleanupUri: _audioCleanupUri, ...rest } = meeting;
  return rest;
}

export function pendingAudioCleanup(meetings: Meeting[]): Meeting[] {
  return meetings.filter((meeting) => meeting.status === 'complete' && Boolean(meeting.audioCleanupUri));
}

/** Backward-compatible helper for callers/tests that only need the final clean state. */
export function withoutLocalAudio(meeting: Meeting): Meeting {
  return finishLocalAudioCleanup(meeting);
}
