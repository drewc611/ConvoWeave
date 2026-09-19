import type { CalendarEventThreadLink } from '../../models/domain';

export type UpcomingCalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  location?: string;
};

export type CalendarEventInput = {
  id: string;
  calendarId: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
  allDay: boolean;
  location?: string | null;
};

export function normalizeCalendarEvent(event: CalendarEventInput): UpcomingCalendarEvent {
  return {
    id: event.id,
    calendarId: event.calendarId,
    title: event.title.trim() || 'Untitled calendar event',
    startAt: new Date(event.startDate).toISOString(),
    endAt: new Date(event.endDate).toISOString(),
    allDay: event.allDay,
    location: event.location?.trim() || undefined,
  };
}

export function calendarEventLinkId(event: Pick<UpcomingCalendarEvent, 'calendarId' | 'id' | 'startAt'>): string {
  return `calendar:${event.calendarId}:${event.id}:${event.startAt}`;
}

export function buildCalendarEventThreadLink(
  event: UpcomingCalendarEvent,
  threadId: string,
  now = new Date(),
): CalendarEventThreadLink {
  return {
    id: calendarEventLinkId(event),
    threadId,
    calendarId: event.calendarId,
    eventId: event.id,
    eventStartAt: event.startAt,
    linkedAt: now.toISOString(),
  };
}
