import * as Calendar from 'expo-calendar';
import { normalizeCalendarEvent, type UpcomingCalendarEvent } from './calendarModel';

export type DeviceCalendarPermission = 'granted' | 'denied' | 'undetermined';

function permissionState(status: string): DeviceCalendarPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getDeviceCalendarPermission(): Promise<DeviceCalendarPermission> {
  const response = await Calendar.getCalendarPermissions();
  return permissionState(response.status);
}

export async function requestDeviceCalendarPermission(): Promise<DeviceCalendarPermission> {
  const response = await Calendar.requestCalendarPermissions();
  return permissionState(response.status);
}

export async function listUpcomingDeviceCalendarEvents(
  now = new Date(),
  days = 7,
): Promise<UpcomingCalendarEvent[]> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  if (calendars.length === 0) return [];

  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const events = await Calendar.listEvents(calendars, now, end);

  return events
    .map((event) => normalizeCalendarEvent({
      id: event.id,
      calendarId: event.calendarId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      location: event.location,
    }))
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}
