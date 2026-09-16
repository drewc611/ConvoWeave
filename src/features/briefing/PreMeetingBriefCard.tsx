import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BriefingProvider } from '../../services/providers';
import { colors } from '../../theme';

type BriefState =
  | { status: 'idle'; title: string; bullets: string[] }
  | { status: 'loading'; title: string; bullets: string[] }
  | { status: 'ready'; title: string; bullets: string[] }
  | { status: 'error'; title: string; bullets: string[] };

type PreMeetingBriefCardProps = {
  threadId: string | null;
  provider: BriefingProvider;
};

export function PreMeetingBriefCard({ threadId, provider }: PreMeetingBriefCardProps) {
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<BriefState>({
    status: 'idle',
    title: 'Before your next meeting',
    bullets: [],
  });

  useEffect(() => {
    let cancelled = false;

    if (!threadId) {
      setState({ status: 'idle', title: 'Before your next meeting', bullets: [] });
      return () => { cancelled = true; };
    }

    setState((current) => ({ ...current, status: 'loading' }));

    void provider.buildBrief(threadId)
      .then((brief) => {
        if (cancelled) return;
        setState({ status: 'ready', title: brief.title, bullets: brief.bullets });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error', title: 'Before your next meeting', bullets: [] });
      });

    return () => { cancelled = true; };
  }, [provider, retryKey, threadId]);

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>PRE-MEETING BRIEF</Text>
      <Text style={styles.title}>{state.title}</Text>

      {!threadId ? (
        <Text style={styles.empty}>Choose a thread to prepare its reviewed meeting memory.</Text>
      ) : state.status === 'loading' ? (
        <Text style={styles.empty}>Preparing the current thread context…</Text>
      ) : state.status === 'error' ? (
        <>
          <Text style={styles.empty}>The brief could not be prepared. Your meeting workspace is still available.</Text>
          <Pressable style={styles.retry} onPress={() => setRetryKey((value) => value + 1)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.list}>
          {state.bullets.map((bullet, index) => (
            <View key={`${index}:${bullet}`} style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.bullet}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.boundary}>Built from reviewed thread memory. Private Sidecar notes are excluded.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: '#CFE5D7',
    borderRadius: 18,
    padding: 16,
  },
  kicker: {
    color: colors.forest,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.25,
    marginBottom: 5,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  list: { gap: 9 },
  row: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.forest,
    marginTop: 5,
  },
  bullet: {
    flex: 1,
    color: colors.mutedDark,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '650' as '700',
  },
  empty: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 9,
    backgroundColor: colors.ink,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  retryText: { color: colors.paper, fontSize: 11, fontWeight: '800' },
  boundary: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 12,
    paddingTop: 10,
  },
});
