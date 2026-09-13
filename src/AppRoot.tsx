import { useEffect, useMemo, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from './components/Screen';
import { CaptureScreen } from './features/meetings/CaptureScreen';
import { ReviewScreen } from './features/meetings/ReviewScreen';
import type { Assumption, Commitment, Decision, Meeting, MeetingProposal } from './models/domain';
import { mockProviders } from './services/mockProviders';
import {
  AssumptionRepository,
  CommitmentRepository,
  DecisionRepository,
  MeetingRepository,
} from './storage/repositories';
import { colors } from './theme';

type Route = 'home' | 'capture' | 'review';

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppRoot() {
  const repositories = useMemo(() => ({
    meetings: new MeetingRepository(),
    decisions: new DecisionRepository(),
    commitments: new CommitmentRepository(),
    assumptions: new AssumptionRepository(),
  }), []);
  const [route, setRoute] = useState<Route>('home');
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [counts, setCounts] = useState({ decisions: 0, commitments: 0, assumptions: 0 });

  const refresh = async () => {
    const [meetings, decisions, commitments, assumptions] = await Promise.all([
      repositories.meetings.list(),
      repositories.decisions.list(),
      repositories.commitments.list(),
      repositories.assumptions.list(),
    ]);
    setRecentMeetings(meetings.slice(0, 5));
    setCounts({
      decisions: decisions.length,
      commitments: commitments.filter((item) => item.status === 'open').length,
      assumptions: assumptions.filter((item) => item.status === 'untested').length,
    });
  };

  useEffect(() => { void refresh(); }, []);

  const finishCapture = async (audioUri: string | undefined, durationMs: number) => {
    const now = new Date();
    const meeting: Meeting = {
      id: makeId('meeting'),
      title: `Meeting · ${now.toLocaleDateString()}`,
      startedAt: new Date(now.getTime() - durationMs).toISOString(),
      endedAt: now.toISOString(),
      durationMs,
      audioUri,
      status: 'review',
    };
    await repositories.meetings.upsert(meeting);
    setCurrentMeeting(meeting);
    setRoute('review');
  };

  const saveReview = async (meeting: Meeting, proposals: MeetingProposal[]) => {
    const threadId = meeting.threadId ?? 'inbox-thread';
    const accepted = proposals.filter((item) => item.state === 'accepted');

    for (const proposal of accepted) {
      if (proposal.kind === 'decision') {
        const decision: Decision = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          status: 'active',
          evidence: proposal.evidence,
          createdAt: new Date().toISOString(),
        };
        await repositories.decisions.upsert(decision);
      }
      if (proposal.kind === 'commitment') {
        const commitment: Commitment = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          status: 'open',
          evidence: proposal.evidence,
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        };
        await repositories.commitments.upsert(commitment);
      }
      if (proposal.kind === 'assumption') {
        const assumption: Assumption = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          status: 'untested',
          evidence: proposal.evidence,
        };
        await repositories.assumptions.upsert(assumption);
      }
    }

    await repositories.meetings.upsert({ ...meeting, status: 'complete' });
    setCurrentMeeting(null);
    setRoute('home');
    await refresh();
  };

  if (route === 'capture') {
    return <CaptureScreen onCancel={() => setRoute('home')} onFinished={finishCapture} />;
  }
  if (route === 'review' && currentMeeting) {
    return <ReviewScreen meeting={currentMeeting} providers={mockProviders} onDone={saveReview} />;
  }

  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <Header
        eyebrow="CONVOWEAVE"
        title="Your meetings should remember each other."
        body="Capture a meeting, confirm the important memory, then carry decisions and commitments forward instead of starting from zero."
      />

      <Pressable style={styles.capture} onPress={() => setRoute('capture')}>
        <View style={styles.captureDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.captureTitle}>Start a meeting</Text>
          <Text style={styles.captureBody}>Record on device, then review before anything becomes memory.</Text>
        </View>
      </Pressable>

      <View style={styles.metrics}>
        <Metric value={counts.decisions} label="decisions" />
        <Metric value={counts.commitments} label="open commitments" />
        <Metric value={counts.assumptions} label="assumptions" />
      </View>

      <Text style={styles.section}>Recent meetings</Text>
      {recentMeetings.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.empty}>No meetings yet. The first recording will create a durable local draft.</Text>
        </View>
      ) : recentMeetings.map((meeting) => (
        <View key={meeting.id} style={screenStyles.card}>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <Text style={styles.meetingMeta}>{meeting.status.toUpperCase()} · {Math.round(meeting.durationMs / 1000)} sec</Text>
          <Text style={styles.meetingMeta}>{new Date(meeting.startedAt).toLocaleString()}</Text>
        </View>
      ))}

      <View style={styles.privateNote}>
        <Text style={styles.privateTitle}>Private by design</Text>
        <Text style={styles.privateBody}>Raw audio and local state remain on this device in the current alpha. AI providers are mocked until a backend and explicit upload policy are added.</Text>
      </View>
    </Screen>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  capture: { backgroundColor: colors.forest, borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  captureDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF' },
  captureTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  captureBody: { color: '#E5F0E9', marginTop: 5, lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  metric: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 12 },
  metricValue: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  section: { color: colors.ink, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  empty: { color: colors.muted, lineHeight: 21 },
  meetingTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 7 },
  meetingMeta: { color: colors.muted, lineHeight: 19 },
  privateNote: { backgroundColor: colors.forestSoft, borderRadius: 18, padding: 18, marginTop: 8 },
  privateTitle: { color: colors.forest, fontWeight: '900', marginBottom: 6 },
  privateBody: { color: colors.ink, lineHeight: 21 },
});
