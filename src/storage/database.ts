import * as SQLite from 'expo-sqlite';

let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;

export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('convoweave.db');
  }
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entities (
      kind TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (kind, id)
    );
    CREATE INDEX IF NOT EXISTS idx_entities_kind_updated ON entities(kind, updated_at DESC);
  `);
  return db;
}
