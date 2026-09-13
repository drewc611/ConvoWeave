import type {
  Assumption,
  Commitment,
  Contradiction,
  Decision,
  Meeting,
  MeetingChangeSet,
  MeetingReview,
  PrivateNote,
  Thread,
} from '../models/domain';
import { getDatabase } from './database';

export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  upsert(value: T): Promise<void>;
  remove(id: string): Promise<void>;
}

type EntityKind =
  | 'meeting'
  | 'meeting-review'
  | 'meeting-change-set'
  | 'thread'
  | 'decision'
  | 'commitment'
  | 'assumption'
  | 'contradiction'
  | 'private-note';
type EntityRow = { payload: string };

class SQLiteEntityRepository<T extends { id: string }> implements Repository<T> {
  constructor(private readonly kind: EntityKind) {}

  async list(): Promise<T[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<EntityRow>(
      'SELECT payload FROM entities WHERE kind = ? ORDER BY updated_at DESC',
      this.kind,
    );
    return rows.map((row) => JSON.parse(row.payload) as T);
  }

  async get(id: string): Promise<T | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<EntityRow>(
      'SELECT payload FROM entities WHERE kind = ? AND id = ?',
      this.kind,
      id,
    );
    return row ? (JSON.parse(row.payload) as T) : null;
  }

  async upsert(value: T): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO entities(kind, id, payload, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(kind, id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      this.kind,
      value.id,
      JSON.stringify(value),
      new Date().toISOString(),
    );
  }

  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM entities WHERE kind = ? AND id = ?', this.kind, id);
  }
}

export class MeetingRepository extends SQLiteEntityRepository<Meeting> { constructor() { super('meeting'); } }
export class MeetingReviewRepository extends SQLiteEntityRepository<MeetingReview> { constructor() { super('meeting-review'); } }
export class MeetingChangeSetRepository extends SQLiteEntityRepository<MeetingChangeSet> { constructor() { super('meeting-change-set'); } }
export class ThreadRepository extends SQLiteEntityRepository<Thread> { constructor() { super('thread'); } }
export class DecisionRepository extends SQLiteEntityRepository<Decision> { constructor() { super('decision'); } }
export class CommitmentRepository extends SQLiteEntityRepository<Commitment> { constructor() { super('commitment'); } }
export class AssumptionRepository extends SQLiteEntityRepository<Assumption> { constructor() { super('assumption'); } }
export class ContradictionRepository extends SQLiteEntityRepository<Contradiction> { constructor() { super('contradiction'); } }
export class PrivateNoteRepository extends SQLiteEntityRepository<PrivateNote> { constructor() { super('private-note'); } }
