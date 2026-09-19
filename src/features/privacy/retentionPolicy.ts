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
    if (meeting.status !== 'complete' || !meeting.audioUri) return false;
    const completedAt = meeting.endedAt ?? meeting.startedAt;
    const completedMs = Date.parse(completedAt);
    return Number.isFinite(completedMs) && completedMs < cutoff;
  });
}

export function withoutLocalAudio(meeting: Meeting): Meeting {
  const { audioUri: _audioUri, ...rest } = meeting;
  return rest;
}
