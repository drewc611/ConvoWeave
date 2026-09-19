import { describe, expect, it } from 'vitest';
import { buildCalendarEventThreadLink, calendarEventLinkId, normalizeCalendarEvent } from '../src/features/calendar/calendarModel';

describe('device calendar normalization', () => {
  it('keeps only minimal event fields needed by the UI', () => {
    const event = normalizeCalendarEvent({
      id: 'event-1',
      calendarId: 'calendar-1',
      title: '  Product review  ',
      startDate: new Date('2026-09-21T14:00:00.000Z'),
      endDate: '2026-09-21T15:00:00.000Z',
      allDay: false,
      location: '  Room 4  ',
    });

    expect(event).toEqual({
      id: 'event-1',
      calendarId: 'calendar-1',
      title: 'Product review',
      startAt: '2026-09-21T14:00:00.000Z',
      endAt: '2026-09-21T15:00:00.000Z',
      allDay: false,
      location: 'Room 4',
    });
    expect(Object.keys(event).sort()).toEqual(['allDay', 'calendarId', 'endAt', 'id', 'location', 'startAt', 'title'].sort());
  });

  it('creates deterministic event-instance link IDs and persists no calendar content', () => {
    const event = normalizeCalendarEvent({
      id: 'event-1',
      calendarId: 'calendar-1',
      title: 'Product review',
      startDate: '2026-09-21T14:00:00.000Z',
      endDate: '2026-09-21T15:00:00.000Z',
      allDay: false,
    });
    const link = buildCalendarEventThreadLink(event, 'thread-1', new Date('2026-09-19T08:00:00.000Z'));

    expect(link.id).toBe(calendarEventLinkId(event));
    expect(link).toEqual({
      id: 'calendar:calendar-1:event-1:2026-09-21T14:00:00.000Z',
      threadId: 'thread-1',
      calendarId: 'calendar-1',
      eventId: 'event-1',
      eventStartAt: '2026-09-21T14:00:00.000Z',
      linkedAt: '2026-09-19T08:00:00.000Z',
    });
    expect('title' in link).toBe(false);
    expect('location' in link).toBe(false);
    expect('notes' in link).toBe(false);
    expect('attendees' in link).toBe(false);
  });
});
