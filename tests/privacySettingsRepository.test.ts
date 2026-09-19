import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrivacySettings } from '../src/models/domain';

const sqliteState = vi.hoisted(() => ({
  rows: new Map<string, { kind: string; id: string; payload: string; updatedAt: string }>(),
}));

vi.mock('../src/storage/database', () => ({
  getDatabase: async () => ({
    getAllAsync: async <T>(_sql: string, kind: string): Promise<T[]> => [...sqliteState.rows.values()]
      .filter((row) => row.kind === kind)
      .map((row) => ({ payload: row.payload }) as T),
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
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  }),
}));

import { PrivacySettingsRepository } from '../src/storage/repositories';

beforeEach(() => sqliteState.rows.clear());

describe('privacy settings persistence', () => {
  it('survives repository re-instantiation', async () => {
    const settings: PrivacySettings = {
      id: 'privacy-settings',
      audioRetention: '30d',
      updatedAt: '2026-09-19T07:30:00.000Z',
    };

    await new PrivacySettingsRepository().upsert(settings);

    const afterRestart = await new PrivacySettingsRepository().get('privacy-settings');
    expect(afterRestart).toEqual(settings);
    expect(afterRestart?.audioRetention).toBe('30d');
  });
});
