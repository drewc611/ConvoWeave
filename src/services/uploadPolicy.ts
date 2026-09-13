import type { Meeting } from '../models/domain';

export type UploadScope = 'transcript-only' | 'audio-and-transcript';

export type UploadApproval = {
  meetingId: string;
  scope: UploadScope;
  approvedAt: string;
  expiresAt?: string;
};

export class UploadNotApprovedError extends Error {
  constructor(message = 'Remote processing is disabled until this meeting is explicitly approved for upload.') {
    super(message);
    this.name = 'UploadNotApprovedError';
  }
}

export function assertUploadApproved(meeting: Meeting, approval: UploadApproval | null | undefined, now = Date.now()) {
  if (!approval) throw new UploadNotApprovedError();
  if (approval.meetingId !== meeting.id) {
    throw new UploadNotApprovedError('Upload approval does not belong to this meeting.');
  }
  if (approval.expiresAt && new Date(approval.expiresAt).getTime() <= now) {
    throw new UploadNotApprovedError('Upload approval has expired.');
  }
  if (approval.scope === 'audio-and-transcript' && !meeting.audioUri) {
    throw new UploadNotApprovedError('Audio upload was approved, but this meeting has no local audio recording.');
  }
}

export function canUploadAudio(approval: UploadApproval) {
  return approval.scope === 'audio-and-transcript';
}
