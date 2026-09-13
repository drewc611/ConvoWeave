import type { PrivateNote } from '../../models/domain';

export function notesEligibleForSharedContext(notes: PrivateNote[]) {
  return notes.filter((note) => Boolean(note.promotedAt));
}

export function promotePrivateNote(note: PrivateNote, promotedAt = new Date().toISOString()): PrivateNote {
  return { ...note, promotedAt, updatedAt: promotedAt };
}

export function returnPrivateNoteToSidecar(note: PrivateNote, updatedAt = new Date().toISOString()): PrivateNote {
  const { promotedAt: _promotedAt, ...rest } = note;
  return { ...rest, updatedAt };
}
