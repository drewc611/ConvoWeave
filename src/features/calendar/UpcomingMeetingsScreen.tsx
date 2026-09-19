import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { CalendarEventThreadLink, Thread } from '../../models/domain';
import { CalendarEventThreadLinkRepository, ThreadRepository } from '../../storage/repositories';
import { colors } from '../../theme';
import { buildCalendarEventThreadLink, calendarEventLinkId, type UpcomingCalendarEvent } from './calendarModel';
import {
  getDeviceCalendarPermission,
  listUpcomingDeviceCalendarEvents,
  requestDeviceCalendarPermission,
  type DeviceCalendarPermission,
} from './deviceCalendarProvider';

export function UpcomingMeetingsScreen({ onBack }: { onBack: () => void }) {
  const linkRepository = useMemo(() => new CalendarEventThreadLinkRepository(), []);
  const threadRepository = useMemo(() => new ThreadRepository(), []);
  const [permission, setPermission] = useState<DeviceCalendarPermission>('undetermined');
  const [events, setEvents] = useState<UpcomingCalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarEventThreadLink[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;

  const loadLinks = async () => setLinks(await linkRepository.list());

  const loadEvents = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const next = await listUpcomingDeviceCalendarEvents();
      setEvents(next);
    } catch {
      setMessage('Calendar events could not be read from this device.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const [storedLinks, storedThreads, currentPermission] = await Promise.all([
        linkRepository.list(),
        threadRepository.list(),
        getDeviceCalendarPermission(),
      ]);
      setLinks(storedLinks);
      setThreads(storedThreads);
      setSelectedThreadId(storedThreads[0]?.id ?? null);
      setPermission(currentPermission);
      if (currentPermission === 'granted') await loadEvents();
      else setLoading(false);
    })();
  }, []);

  const requestAccess = async () => {
    setLoading(true);
    const next = await requestDeviceCalendarPermission();
    setPermission(next);
    if (next === 'granted') await loadEvents();
    else {
      setLoading(false);
      setMessage('Calendar access was not granted. ConvoWeave will continue without calendar context.');
    }
  };

  const linkEvent = async (event: UpcomingCalendarEvent) => {
    if (!selectedThread) return;
    await linkRepository.upsert(buildCalendarEventThreadLink(event, selectedThread.id));
    await loadLinks();
  };

  const unlinkEvent = async (event: UpcomingCalendarEvent) => {
    await linkRepository.remove(calendarEventLinkId(event));
    await loadLinks();
  };

  const linksById = new Map(links.map((link) => [link.id, link]));
  const threadsById = new Map(threads.map((thread) => [thread.id, thread]));

  return (
    <Screen>
      <Header
        eyebrow="UPCOMING MEETINGS"
        title="Device calendar"
        body="Calendar access is read-only, device-local and optional. ConvoWeave stores only explicit event-to-thread links, not calendar notes or attendee data."
      />

      {permission !== 'granted' ? (
        <View style={screenStyles.card}>
          <Text style={styles.title}>Calendar is not connected.</Text>
          <Text style={styles.body}>ConvoWeave will not request access until you choose the button below. Denying access does not affect meeting capture or durable memory.</Text>
          <Pressable style={styles.primaryButton} disabled={loading} onPress={() => { void requestAccess(); }}>
            <Text style={styles.primaryText}>{loading ? 'Checking…' : 'Allow calendar access'}</Text>
          </Pressable>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Next 7 days</Text>
              <Text style={styles.body}>Choose a ConvoWeave thread, then link only the events that belong to that durable memory.</Text>
            </View>
            <Pressable style={styles.refreshButton} onPress={() => { void loadEvents(); }} disabled={loading}>
              <Text style={styles.refreshText}>{loading ? 'Loading…' : 'Refresh'}</Text>
            </Pressable>
          </View>

          <View style={styles.threadPanel}>
            <Text style={styles.threadLabel}>LINK EVENTS TO THREAD</Text>
            {threads.length === 0 ? (
              <Text style={styles.body}>Create a ConvoWeave thread before linking calendar events.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.threadRow}>
                {threads.map((thread) => (
                  <Pressable key={thread.id} onPress={() => setSelectedThreadId(thread.id)} style={[styles.threadChip, selectedThreadId === thread.id && styles.threadChipSelected]}>
                    <Text style={[styles.threadChipText, selectedThreadId === thread.id && styles.threadChipTextSelected]}>{thread.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {message ? <View style={screenStyles.card}><Text style={styles.message}>{message}</Text></View> : null}

          {!loading && events.length === 0 ? (
            <View style={screenStyles.card}>
              <Text style={styles.title}>No upcoming device events.</Text>
              <Text style={styles.body}>Nothing was found in the next seven days across calendars this device allows ConvoWeave to read.</Text>
            </View>
          ) : events.map((event) => {
            const linkId = calendarEventLinkId(event);
            const link = linksById.get(linkId);
            const linkedThread = link ? threadsById.get(link.threadId) : null;
            const linkedToSelected = Boolean(link && selectedThread && link.threadId === selectedThread.id);
            return (
              <View key={linkId} style={[screenStyles.card, linkedToSelected && styles.linkedCard]}>
                <View style={styles.row}>
                  <Text style={styles.kicker}>{event.allDay ? 'ALL DAY' : new Date(event.startAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>
                  <Text style={styles.date}>{new Date(event.startAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                </View>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.body}>{event.allDay ? 'All-day event' : `${new Date(event.startAt).toLocaleString()} – ${new Date(event.endAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}</Text>
                {event.location ? <Text style={styles.location}>{event.location}</Text> : null}

                {link ? (
                  <View style={styles.linkStatus}>
                    <Text style={styles.linkStatusText}>Linked to {linkedThread?.title ?? 'a ConvoWeave thread'}</Text>
                    <Pressable onPress={() => { void unlinkEvent(event); }}><Text style={styles.unlinkText}>Unlink</Text></Pressable>
                  </View>
                ) : (
                  <Pressable disabled={!selectedThread} style={[styles.linkButton, !selectedThread && styles.disabled]} onPress={() => { void linkEvent(event); }}>
                    <Text style={styles.linkText}>{selectedThread ? `Link to ${selectedThread.title}` : 'Select a thread to link'}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </>
      )}

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to settings</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 5 },
  message: { color: colors.mutedDark, lineHeight: 19, marginTop: 10 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 11, paddingVertical: 12, paddingHorizontal: 14, marginTop: 15, alignItems: 'center' },
  primaryText: { color: colors.paper, fontWeight: '900' },
  refreshButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11 },
  refreshText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  summaryTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  threadPanel: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 13, marginBottom: 12 },
  threadLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  threadRow: { gap: 7, paddingTop: 9 },
  threadChip: { borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 11 },
  threadChipSelected: { backgroundColor: colors.mintSoft, borderColor: colors.forest },
  threadChipText: { color: colors.mutedDark, fontSize: 11, fontWeight: '800' },
  threadChipTextSelected: { color: colors.forestDark },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 9 },
  kicker: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  date: { color: colors.muted, fontSize: 11 },
  location: { color: colors.blue, fontSize: 12, marginTop: 7 },
  linkedCard: { borderLeftWidth: 4, borderLeftColor: colors.forest },
  linkButton: { backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 11, marginTop: 14, alignItems: 'center' },
  linkText: { color: colors.forestDark, fontWeight: '900', fontSize: 12 },
  disabled: { opacity: 0.45 },
  linkStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: 10, padding: 10, marginTop: 14 },
  linkStatusText: { color: colors.forestDark, fontSize: 11, fontWeight: '800', flex: 1 },
  unlinkText: { color: colors.red, fontSize: 11, fontWeight: '900' },
});
