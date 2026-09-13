import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Tab = 'Today' | 'Memory' | 'Actions' | 'You';
type SignalType = 'decision' | 'commitment' | 'contradiction' | 'assumption';

type Signal = {
  id: string;
  type: SignalType;
  title: string;
  detail: string;
  meta: string;
  evidence: string;
};

const COLORS = {
  ink: '#17211B',
  muted: '#69736C',
  canvas: '#F4F3ED',
  paper: '#FFFFFF',
  line: '#DDDCD4',
  forest: '#1F5D42',
  forestSoft: '#DDEBE3',
  amber: '#A96322',
  amberSoft: '#F7E7D5',
  plum: '#76536E',
  plumSoft: '#EFE4EC',
  red: '#A8443D',
  redSoft: '#F5E1DF',
};

const signals: Signal[] = [
  {
    id: 'd1',
    type: 'decision',
    title: 'Ship the mobile capture flow first',
    detail: 'The team chose mobile capture before calendar integrations.',
    meta: 'Decision · Product sync · 9:42 AM',
    evidence: '“Let’s prove the capture and memory loop before integrations.”',
  },
  {
    id: 'c1',
    type: 'commitment',
    title: 'Maya owns the onboarding prototype',
    detail: 'Due Friday. No update has been captured since assignment.',
    meta: 'Commitment · Maya · Due Sep 18',
    evidence: '“I’ll have the onboarding prototype ready by Friday.”',
  },
  {
    id: 'x1',
    type: 'contradiction',
    title: 'Retention window conflicts with prior agreement',
    detail: 'Today: 90 days. Aug 28 decision: 30 days by default.',
    meta: 'Conflict · Needs confirmation',
    evidence: 'Today 10:07 AM vs. Decision D-014 from Aug 28',
  },
  {
    id: 'a1',
    type: 'assumption',
    title: 'Assumption: users prefer bot-free recording',
    detail: 'This is driving the capture design but has not been validated yet.',
    meta: 'Assumption · Review after 10 interviews',
    evidence: 'First stated in product discovery on Sep 2',
  },
];

const actionItems = [
  { owner: 'Maya', task: 'Finish onboarding prototype', due: 'Fri', state: 'At risk' },
  { owner: 'Andrew', task: 'Review privacy model', due: 'Today', state: 'Open' },
  { owner: 'Jon', task: 'Validate transcript storage costs', due: 'Thu', state: 'Open' },
];

const meetingThreads = [
  {
    title: 'Product launch',
    meetings: 6,
    changed: '3 decisions changed since the last meeting',
    unresolved: 2,
  },
  {
    title: 'Privacy & retention',
    meetings: 4,
    changed: '1 contradiction needs resolution',
    unresolved: 1,
  },
  {
    title: 'Mobile experience',
    meetings: 8,
    changed: '5 commitments are still active',
    unresolved: 3,
  },
];

function signalColors(type: SignalType) {
  if (type === 'decision') return { bg: COLORS.forestSoft, fg: COLORS.forest, label: 'DECISION' };
  if (type === 'commitment') return { bg: COLORS.amberSoft, fg: COLORS.amber, label: 'COMMITMENT' };
  if (type === 'contradiction') return { bg: COLORS.redSoft, fg: COLORS.red, label: 'CONTRADICTION' };
  return { bg: COLORS.plumSoft, fg: COLORS.plum, label: 'ASSUMPTION' };
}

function Pill({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{text}</Text>
    </View>
  );
}

function SectionHeader({ title, right }: { title: string; right?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const tone = signalColors(signal.type);
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <Pressable style={styles.card} onPress={() => setShowEvidence((v) => !v)}>
      <View style={styles.rowBetween}>
        <Pill text={tone.label} bg={tone.bg} fg={tone.fg} />
        <Text style={styles.cardMeta}>{signal.meta}</Text>
      </View>
      <Text style={styles.cardTitle}>{signal.title}</Text>
      <Text style={styles.cardBody}>{signal.detail}</Text>
      <View style={styles.evidenceRow}>
        <Text style={[styles.evidenceLink, { color: tone.fg }]}>Source proof</Text>
        <Text style={styles.chevron}>{showEvidence ? '−' : '+'}</Text>
      </View>
      {showEvidence ? (
        <View style={[styles.evidenceBox, { borderLeftColor: tone.fg }]}>
          <Text style={styles.evidenceText}>{signal.evidence}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function TodayScreen({ recording, onToggleRecording }: { recording: boolean; onToggleRecording: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>SUNDAY · SEPTEMBER 13</Text>
        <Text style={styles.heroTitle}>Keep the thread.</Text>
        <Text style={styles.heroBody}>
          ConvoWeave remembers what changed, who committed to what, and why a decision was made.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onToggleRecording}
          style={[styles.recordButton, recording && styles.recordButtonActive]}
        >
          <View style={[styles.recordDot, recording && styles.recordDotActive]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.recordTitle, recording && styles.recordTitleActive]}>
              {recording ? 'Meeting in progress' : 'Start a meeting'}
            </Text>
            <Text style={[styles.recordSubtitle, recording && styles.recordSubtitleActive]}>
              {recording ? 'Tap to finish and weave the meeting' : 'Capture in-person or speaker audio'}
            </Text>
          </View>
          <Text style={[styles.recordTime, recording && styles.recordTitleActive]}>{recording ? '12:08' : '●'}</Text>
        </Pressable>
      </View>

      <View style={styles.deltaCard}>
        <Text style={styles.deltaEyebrow}>BEFORE YOUR NEXT MEETING</Text>
        <Text style={styles.deltaTitle}>What changed since last time?</Text>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>3</Text>
            <Text style={styles.metricLabel}>new decisions</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>2</Text>
            <Text style={styles.metricLabel}>at risk</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>1</Text>
            <Text style={styles.metricLabel}>conflict</Text>
          </View>
        </View>
        <Text style={styles.deltaPrompt}>
          Suggested question: “Are we still keeping the default retention window at 30 days?”
        </Text>
      </View>

      <SectionHeader title="Signals worth your attention" right="4 found" />
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}

      <SectionHeader title="Open commitments" right="View all" />
      <View style={styles.card}>
        {actionItems.slice(0, 2).map((item, index) => (
          <View key={item.task} style={[styles.actionRow, index > 0 && styles.topLine]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.owner.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTask}>{item.task}</Text>
              <Text style={styles.actionMeta}>{item.owner} · {item.due}</Text>
            </View>
            <Pill
              text={item.state.toUpperCase()}
              bg={item.state === 'At risk' ? COLORS.redSoft : COLORS.canvas}
              fg={item.state === 'At risk' ? COLORS.red : COLORS.muted}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function MemoryScreen() {
  const [selected, setSelected] = useState(0);
  const thread = meetingThreads[selected] ?? meetingThreads[0];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageEyebrow}>ORGANIZATIONAL MEMORY</Text>
      <Text style={styles.pageTitle}>Memory</Text>
      <Text style={styles.pageBody}>Meetings become connected threads instead of isolated transcripts.</Text>

      <SectionHeader title="Threads" right={`${meetingThreads.length} active`} />
      {meetingThreads.map((item, index) => (
        <Pressable
          key={item.title}
          onPress={() => setSelected(index)}
          style={[styles.threadCard, selected === index && styles.threadCardSelected]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.threadTitle}>{item.title}</Text>
            <Text style={styles.threadMeta}>{item.meetings} meetings · {item.unresolved} unresolved</Text>
            <Text style={styles.threadChanged}>{item.changed}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}

      <SectionHeader title="Decision lineage" />
      <View style={styles.timelineCard}>
        <View style={styles.timelineRow}>
          <View style={styles.timelineRail}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineLine} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDate}>AUG 28 · DECISION D-014</Text>
            <Text style={styles.timelineTitle}>Default retention: 30 days</Text>
            <Text style={styles.timelineBody}>Chosen to reduce privacy exposure while preserving useful recall.</Text>
          </View>
        </View>
        <View style={styles.timelineRow}>
          <View style={styles.timelineRail}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.red }]} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineDate, { color: COLORS.red }]}>TODAY · POSSIBLE CONFLICT</Text>
            <Text style={styles.timelineTitle}>90-day retention mentioned</Text>
            <Text style={styles.timelineBody}>ConvoWeave linked the statement back to D-014 instead of treating it as unrelated text.</Text>
          </View>
        </View>
      </View>

      <View style={styles.askCard}>
        <Text style={styles.askEyebrow}>ASK THE THREAD</Text>
        <Text style={styles.askQuestion}>Why did we choose 30-day retention?</Text>
        <Text style={styles.askAnswer}>
          The Aug 28 decision prioritized lower privacy exposure. The team explicitly accepted reduced long-term recall in exchange for a smaller data footprint.
        </Text>
        <Text style={styles.askSource}>2 source moments · tap to verify</Text>
      </View>

      <Text style={styles.smallPrint}>Selected thread: {thread.title}</Text>
    </ScrollView>
  );
}

function ActionsScreen() {
  const [completed, setCompleted] = useState<string[]>([]);
  const openCount = actionItems.length - completed.length;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageEyebrow}>COMMITMENT RADAR</Text>
      <Text style={styles.pageTitle}>Actions</Text>
      <Text style={styles.pageBody}>Track promises across meetings, not just tasks extracted from one transcript.</Text>

      <View style={styles.actionSummary}>
        <Text style={styles.actionSummaryValue}>{openCount}</Text>
        <Text style={styles.actionSummaryLabel}>open commitments</Text>
        <View style={styles.summarySpacer} />
        <Text style={[styles.actionSummaryValue, { color: COLORS.red }]}>1</Text>
        <Text style={styles.actionSummaryLabel}>at risk</Text>
      </View>

      <SectionHeader title="Active" />
      {actionItems.map((item) => {
        const done = completed.includes(item.task);
        return (
          <Pressable
            key={item.task}
            onPress={() =>
              setCompleted((current) =>
                current.includes(item.task)
                  ? current.filter((task) => task !== item.task)
                  : [...current, item.task],
              )
            }
            style={[styles.card, done && styles.doneCard]}
          >
            <View style={styles.actionDetailRow}>
              <View style={[styles.checkbox, done && styles.checkboxDone]}>
                <Text style={styles.checkmark}>{done ? '✓' : ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, done && styles.doneText]}>{item.task}</Text>
                <Text style={styles.cardMeta}>{item.owner} · due {item.due}</Text>
              </View>
              <Pill
                text={item.state.toUpperCase()}
                bg={item.state === 'At risk' ? COLORS.redSoft : COLORS.canvas}
                fg={item.state === 'At risk' ? COLORS.red : COLORS.muted}
              />
            </View>
          </Pressable>
        );
      })}

      <SectionHeader title="Commitment intelligence" />
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>This promise may slip</Text>
        <Text style={styles.insightBody}>
          Maya’s Friday prototype commitment has appeared in two meetings without a progress update. ConvoWeave would surface it before the next sync instead of waiting for someone to remember.
        </Text>
      </View>
    </ScrollView>
  );
}

function YouScreen() {
  const [privateMode, setPrivateMode] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageEyebrow}>YOUR WORKING MEMORY</Text>
      <Text style={styles.pageTitle}>You</Text>
      <Text style={styles.pageBody}>Personal context stays separate from shared meeting records.</Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>A</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>Andrew</Text>
          <Text style={styles.profileMeta}>Personal workspace</Text>
        </View>
      </View>

      <SectionHeader title="Privacy sidecar" />
      <Pressable style={styles.settingCard} onPress={() => setPrivateMode((v) => !v)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>Private side notes</Text>
          <Text style={styles.settingBody}>Keep your observations out of shared meeting summaries and exports.</Text>
        </View>
        <View style={[styles.toggle, privateMode && styles.toggleOn]}>
          <View style={[styles.toggleKnob, privateMode && styles.toggleKnobOn]} />
        </View>
      </Pressable>

      <SectionHeader title="Your patterns" />
      <View style={styles.card}>
        <Text style={styles.patternTitle}>You have 4 unanswered questions across 3 active threads.</Text>
        <Text style={styles.cardBody}>The oldest is from the Privacy & retention thread, 12 days ago.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.patternTitle}>2 decisions you own are being referenced by other teams.</Text>
        <Text style={styles.cardBody}>ConvoWeave can notify you when a later meeting changes their meaning.</Text>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Today');
  const [recording, setRecording] = useState(false);

  const screen = useMemo(() => {
    if (tab === 'Memory') return <MemoryScreen />;
    if (tab === 'Actions') return <ActionsScreen />;
    if (tab === 'You') return <YouScreen />;
    return <TodayScreen recording={recording} onToggleRecording={() => setRecording((v) => !v)} />;
  }, [tab, recording]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>ConvoWeave</Text>
          <Text style={styles.brandTag}>Your conversations. Connected.</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Private</Text>
        </View>
      </View>

      <View style={styles.screen}>{screen}</View>

      <View style={styles.nav}>
        {(['Today', 'Memory', 'Actions', 'You'] as Tab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={styles.navItem}>
            <Text style={[styles.navGlyph, tab === item && styles.navGlyphActive]}>
              {item === 'Today' ? '●' : item === 'Memory' ? '◎' : item === 'Actions' ? '✓' : '○'}
            </Text>
            <Text style={[styles.navLabel, tab === item && styles.navLabelActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.canvas },
  screen: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { color: COLORS.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  brandTag: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: COLORS.paper },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.forest },
  statusText: { fontSize: 11, color: COLORS.ink, fontWeight: '700' },
  scrollContent: { padding: 18, paddingBottom: 36 },
  hero: { paddingTop: 10, paddingBottom: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: COLORS.forest },
  heroTitle: { fontSize: 36, lineHeight: 40, fontWeight: '800', color: COLORS.ink, letterSpacing: -1.2, marginTop: 8 },
  heroBody: { fontSize: 16, lineHeight: 23, color: COLORS.muted, marginTop: 8, maxWidth: 500 },
  recordButton: { marginTop: 22, minHeight: 78, padding: 16, borderRadius: 20, backgroundColor: COLORS.ink, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordButtonActive: { backgroundColor: COLORS.redSoft, borderWidth: 1, borderColor: '#E7BAB6' },
  recordDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: '#6D7A71', backgroundColor: COLORS.paper },
  recordDotActive: { borderWidth: 0, backgroundColor: COLORS.red },
  recordTitle: { color: COLORS.paper, fontSize: 16, fontWeight: '800' },
  recordTitleActive: { color: COLORS.red },
  recordSubtitle: { color: '#BFC6C1', fontSize: 12, marginTop: 3 },
  recordSubtitleActive: { color: '#875C58' },
  recordTime: { color: COLORS.paper, fontSize: 12, fontWeight: '800' },
  deltaCard: { marginTop: 14, borderRadius: 20, padding: 18, backgroundColor: COLORS.forest },
  deltaEyebrow: { color: '#BCD7C7', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  deltaTitle: { color: COLORS.paper, fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  metric: { flex: 1 },
  metricValue: { color: COLORS.paper, fontSize: 27, fontWeight: '800' },
  metricLabel: { color: '#C5D8CD', fontSize: 11, marginTop: 1 },
  metricDivider: { width: 1, height: 36, backgroundColor: '#4B7A65', marginHorizontal: 10 },
  deltaPrompt: { marginTop: 18, color: '#ECF5EF', fontSize: 13, lineHeight: 19, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#5D8874' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.3 },
  sectionRight: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  card: { backgroundColor: COLORS.paper, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  pillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  cardMeta: { color: COLORS.muted, fontSize: 10, flexShrink: 1, textAlign: 'right' },
  cardTitle: { color: COLORS.ink, fontSize: 16, lineHeight: 21, fontWeight: '800', marginTop: 12, letterSpacing: -0.25 },
  cardBody: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  evidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 },
  evidenceLink: { fontSize: 12, fontWeight: '800' },
  chevron: { color: COLORS.muted, fontSize: 20, lineHeight: 20 },
  evidenceBox: { marginTop: 10, backgroundColor: COLORS.canvas, padding: 11, borderLeftWidth: 3, borderRadius: 8 },
  evidenceText: { color: COLORS.ink, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line, marginTop: 10, paddingTop: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.forestSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.forest, fontWeight: '900' },
  actionTask: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  actionMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  pageEyebrow: { fontSize: 10, color: COLORS.forest, fontWeight: '900', letterSpacing: 1.1, marginTop: 12 },
  pageTitle: { fontSize: 34, color: COLORS.ink, fontWeight: '800', letterSpacing: -1, marginTop: 5 },
  pageBody: { fontSize: 14, lineHeight: 21, color: COLORS.muted, marginTop: 5, maxWidth: 500 },
  threadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: 16, padding: 15, marginBottom: 8, borderWidth: 1, borderColor: COLORS.line },
  threadCardSelected: { borderColor: COLORS.forest, backgroundColor: '#FAFCFA' },
  threadTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '800' },
  threadMeta: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  threadChanged: { color: COLORS.forest, fontSize: 12, fontWeight: '700', marginTop: 7 },
  timelineCard: { backgroundColor: COLORS.paper, borderRadius: 18, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.line },
  timelineRow: { flexDirection: 'row' },
  timelineRail: { width: 24, alignItems: 'center' },
  timelineDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.forest, marginTop: 3 },
  timelineLine: { width: 1, flex: 1, minHeight: 78, backgroundColor: COLORS.line, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineDate: { color: COLORS.forest, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  timelineTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800', marginTop: 4 },
  timelineBody: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  askCard: { marginTop: 20, backgroundColor: COLORS.ink, borderRadius: 18, padding: 17 },
  askEyebrow: { color: '#A9BDB1', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  askQuestion: { color: COLORS.paper, fontSize: 17, fontWeight: '800', marginTop: 8 },
  askAnswer: { color: '#D8E0DB', fontSize: 13, lineHeight: 20, marginTop: 9 },
  askSource: { color: '#9FCDB3', fontSize: 11, fontWeight: '700', marginTop: 12 },
  smallPrint: { textAlign: 'center', color: COLORS.muted, fontSize: 10, marginTop: 16 },
  actionSummary: { flexDirection: 'row', alignItems: 'baseline', marginTop: 22, backgroundColor: COLORS.paper, borderRadius: 18, padding: 18 },
  actionSummaryValue: { color: COLORS.ink, fontSize: 28, fontWeight: '900' },
  actionSummaryLabel: { color: COLORS.muted, fontSize: 11, marginLeft: 5 },
  summarySpacer: { flex: 1 },
  actionDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 25, height: 25, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  checkmark: { color: COLORS.paper, fontWeight: '900' },
  doneCard: { opacity: 0.55 },
  doneText: { textDecorationLine: 'line-through' },
  insightCard: { backgroundColor: COLORS.amberSoft, borderRadius: 18, padding: 17 },
  insightTitle: { color: COLORS.amber, fontSize: 15, fontWeight: '900' },
  insightBody: { color: '#72533A', fontSize: 13, lineHeight: 20, marginTop: 7 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.paper, borderRadius: 18, padding: 16, marginTop: 22 },
  profileAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: COLORS.paper, fontSize: 18, fontWeight: '900' },
  profileName: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  profileMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  settingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.paper, borderRadius: 18, padding: 16 },
  settingTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  settingBody: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: COLORS.line, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: COLORS.forest },
  toggleKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: COLORS.paper },
  toggleKnobOn: { alignSelf: 'flex-end' },
  patternTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  nav: { height: 70, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line, backgroundColor: COLORS.paper, paddingBottom: 6 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navGlyph: { color: '#A1A7A2', fontSize: 18, fontWeight: '800' },
  navGlyphActive: { color: COLORS.forest },
  navLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  navLabelActive: { color: COLORS.forest },
});
