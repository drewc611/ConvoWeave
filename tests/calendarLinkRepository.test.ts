import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarEventThreadLink } from '../src/models/domain';

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

import { CalendarEventThreadLinkRepository } from '../src/storage/repositories';

beforeEach(() => sqliteState.rows.clear());

describe('calendar event thread link persistence', () => {
  it('survives restart and can be explicitly unlinked', async () => {
    const link: CalendarEventThreadLink = {
      id: 'calendar:cal:event:2026-09-21T14:00:00.000Z',
      threadId: 'thread-1',
      calendarId: 'cal',
      eventId: 'event',
      eventStartAt: '2026-09-21T14:00:00.000Z',
      linkedAt: '2026-09-19T08:00:00.000Z',
    };

    await new CalendarEventThreadLinkRepository().upsert(link);
    expect(await new CalendarEventThreadLinkRepository().get(link.id)).toEqual(link);

    await new CalendarEventThreadLinkRepository().remove(link.id);
    expect(await new CalendarEventThreadLinkRepository().get(link.id)).toBeNull();
  });
});
