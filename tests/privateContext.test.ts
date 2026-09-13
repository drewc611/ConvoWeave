import { describe, expect, it } from 'vitest';
import type { PrivateNote } from '../src/models/domain';
import {
  notesEligibleForSharedContext,
  promotePrivateNote,
  returnPrivateNoteToSidecar,
} from '../src/features/private-notes/privateContext';

const privateNote: PrivateNote = {
  id: 'n1',
  threadId: 't1',
  body: 'Do not share this note.',
  createdAt: '2026-09-13T12:00:00Z',
  updatedAt: '2026-09-13T12:00:00Z',
};

describe('Private Sidecar boundary', () => {
  it('excludes private notes from shared context by default', () => {
    expect(notesEligibleForSharedContext([privateNote])).toEqual([]);
  });

  it('includes a note only after explicit promotion', () => {
    const promoted = promotePrivateNote(privateNote, '2026-09-13T13:00:00Z');
    expect(notesEligibleForSharedContext([promoted])).toEqual([promoted]);
    expect(promoted.promotedAt).toBe('2026-09-13T13:00:00Z');
  });

  it('removes eligibility when a promoted note returns to private', () => {
    const promoted = promotePrivateNote(privateNote, '2026-09-13T13:00:00Z');
    const returned = returnPrivateNoteToSidecar(promoted, '2026-09-13T14:00:00Z');
    expect(returned.promotedAt).toBeUndefined();
    expect(notesEligibleForSharedContext([returned])).toEqual([]);
  });
});
