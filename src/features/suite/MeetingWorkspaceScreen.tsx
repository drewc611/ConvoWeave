import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SourceProof } from '../../components/SourceProof';
import type { Assumption, Commitment, Contradiction, Decision, Meeting, MeetingChangeSet } from '../../models/domain';
import { colors } from '../../theme';

type MeetingWorkspaceScreenProps = {
  meeting: Meeting;
  threadTitle: string;
  decisions: Decision[];
  commitments: Commitment[];
  assumptions: Assumption[];
  contradictions: Contradiction[];
  changeSet?: MeetingChangeSet;
  onBack: () => void;
  onOpenChanges: () => void;
  onOpenDecisions: () => void;
  onOpenCommitments: () => void;
  onOpenAssumptions: () => void;
  onOpenContradictions: () => void;
};

type MobileTab = 'memory' | 'transcript';

function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function MeetingWorkspaceScreen(props: MeetingWorkspaceScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 980;
  const [mobileTab, setMobileTab] = useState<MobileTab>('memory');

  const meetingDecisions = useMemo(() => props.decisions.filter((item) => item.evidence.some((ref) => ref.meetingId === props.meeting.id)), [props.decisions, props.meeting.id]);
  const meetingCommitments = useMemo(() => props.commitments.filter((item) => item.evidence.some((ref) => ref.meetingId === props.meeting.id)), [props.commitments, props.meeting.id]);
  const meetingAssumptions = useMemo(() => props.assumptions.filter((item) => item.evidence.some((ref) => ref.meetingId === props.meeting.id)), [props.assumptions, props.meeting.id]);
  const meetingContradictions = useMemo(() => props.contradictions.filter((item) => item.currentEvidence.meetingId === props.meeting.id || item.priorEvidence.meetingId === props.meeting.id), [props.contradictions, props.meeting.id]);
  const transcript = props.meeting.transcript?.segments ?? [];
  const changeCount = props.changeSet?.changes.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topbar}>
        <Pressable style={styles.backButton} onPress={props.onBack}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.topbarTitleWrap}>
          <Text style={styles.topbarThread}>{props.threadTitle.toUpperCase()}</Text>
          <Text style={styles.topbarTitle} numberOfLines={1}>{props.meeting.title}</Text>
        </View>
        <View style={styles.sourceBadge}><View style={styles.sourceDot} /><Text style={styles.sourceBadgeText}>Source-backed</Text></View>
      </View>

      {!desktop ? (
        <View style={styles.mobileTabs}>
          <Pressable onPress={() => setMobileTab('memory')} style={[styles.mobileTab, mobileTab === 'memory' && styles.mobileTabActive]}><Text style={[styles.mobileTabText, mobileTab === 'memory' && styles.mobileTabTextActive]}>Memory</Text></Pressable>
          <Pressable onPress={() => setMobileTab('transcript')} style={[styles.mobileTab, mobileTab === 'transcript' && styles.mobileTabActive]}><Text style={[styles.mobileTabText, mobileTab === 'transcript' && styles.mobileTabTextActive]}>Transcript</Text></Pressable>
        </View>
      ) : null}

      <View style={[styles.workspace, desktop && styles.workspaceDesktop]}>
        {(desktop || mobileTab === 'memory') ? (
          <ScrollView style={styles.memoryPane} contentContainerStyle={styles.memoryContent}>
            <View style={styles.meetingHero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>MEETING MEMORY</Text>
                <Text style={styles.heroTitle}>{props.meeting.title}</Text>
                <Text style={styles.heroMeta}>{new Date(props.meeting.startedAt).toLocaleString()} · {formatDuration(props.meeting.durationMs)}</Text>
              </View>
              <View style={styles.heroStatus}><Text style={styles.heroStatusText}>{props.meeting.status}</Text></View>
            </View>

            {changeCount > 0 ? (
              <Pressable style={styles.changeBanner} onPress={props.onOpenChanges}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.changeKicker}>WHAT CHANGED</Text>
                  <Text style={styles.changeTitle}>{changeCount} durable-memory changes from this meeting</Text>
                </View>
                <Text style={styles.changeArrow}>→</Text>
              </Pressable>
            ) : null}

            <View style={styles.summaryGrid}>
              <SummaryStat value={meetingDecisions.length} label="decisions" />
              <SummaryStat value={meetingCommitments.length} label="commitments" />
              <SummaryStat value={meetingAssumptions.length} label="assumptions" />
              <SummaryStat value={meetingContradictions.length} label="conflicts" />
            </View>

            <MemorySection eyebrow="DECISIONS" title="What became true" empty="No decisions were saved from this meeting." onOpenAll={props.onOpenDecisions}>
              {meetingDecisions.map((item) => (
                <MemoryItem key={item.id} status={item.status} statement={item.statement} meta={item.rationale} evidence={item.evidence} />
              ))}
            </MemorySection>

            <MemorySection eyebrow="COMMITMENTS" title="What people committed to" empty="No commitments were saved from this meeting." onOpenAll={props.onOpenCommitments}>
              {meetingCommitments.map((item) => (
                <MemoryItem key={item.id} status={item.status} statement={item.statement} meta={[item.ownerId, item.dueAt ? `Due ${new Date(item.dueAt).toLocaleDateString()}` : undefined].filter(Boolean).join(' · ')} evidence={item.evidence} />
              ))}
            </MemorySection>

            <MemorySection eyebrow="ASSUMPTIONS" title="What still needs proof" empty="No assumptions were saved from this meeting." onOpenAll={props.onOpenAssumptions}>
              {meetingAssumptions.map((item) => (
                <MemoryItem key={item.id} status={item.status} statement={item.statement} meta={item.reviewAt ? `Review ${new Date(item.reviewAt).toLocaleDateString()}` : undefined} evidence={item.evidence} />
              ))}
            </MemorySection>

            {meetingContradictions.length ? (
              <MemorySection eyebrow="CONTRADICTIONS" title="What conflicts with prior memory" empty="" onOpenAll={props.onOpenContradictions}>
                {meetingContradictions.map((item) => (
                  <View key={item.id} style={styles.conflictCard}>
                    <View style={styles.conflictHeader}><Text style={styles.conflictStatus}>{item.status.toUpperCase()}</Text><Text style={styles.conflictConfidence}>{Math.round(item.confidence * 100)}% confidence</Text></View>
                    <Text style={styles.memoryStatement}>{item.explanation}</Text>
                    <Text style={styles.evidenceLabel}>CURRENT SOURCE</Text>
                    <SourceProof evidence={[item.currentEvidence]} compact />
                    <Text style={styles.evidenceLabel}>PRIOR SOURCE</Text>
                    <SourceProof evidence={[item.priorEvidence]} compact />
                  </View>
                ))}
              </MemorySection>
            ) : null}

            <View style={styles.privacyNote}>
              <Text style={styles.privacyTitle}>Private Sidecar stays separate</Text>
              <Text style={styles.privacyBody}>This workspace only shows durable shared memory and source evidence. Unpromoted private notes remain outside shared context.</Text>
            </View>
          </ScrollView>
        ) : null}

        {(desktop || mobileTab === 'transcript') ? (
          <View style={[styles.transcriptPane, desktop && styles.transcriptPaneDesktop]}>
            <View style={styles.transcriptHeader}>
              <View>
                <Text style={styles.transcriptKicker}>SOURCE</Text>
                <Text style={styles.transcriptTitle}>Transcript</Text>
              </View>
              <View style={styles.transcriptCount}><Text style={styles.transcriptCountText}>{transcript.length}</Text></View>
            </View>
            <ScrollView style={styles.transcriptScroll} contentContainerStyle={styles.transcriptContent}>
              {transcript.length === 0 ? (
                <View style={styles.transcriptEmpty}>
                  <Text style={styles.transcriptEmptyTitle}>No saved transcript</Text>
                  <Text style={styles.transcriptEmptyBody}>The meeting memory can still exist without a transcript. Source proof appears when transcript evidence is available.</Text>
                </View>
              ) : transcript.map((segment) => (
                <View key={segment.id} style={styles.segment}>
                  <View style={styles.segmentMeta}>
                    <Text style={styles.speaker}>{segment.speakerId ?? 'Speaker'}</Text>
                    <Text style={styles.timestamp}>{formatClock(segment.startMs)}</Text>
                  </View>
                  <Text style={styles.segmentText}>{segment.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return <View style={styles.summaryStat}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function MemorySection({ eyebrow, title, empty, onOpenAll, children }: { eyebrow: string; title: string; empty: string; onOpenAll: () => void; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <View style={styles.memorySection}>
      <View style={styles.memorySectionHeader}>
        <View style={{ flex: 1 }}><Text style={styles.memoryEyebrow}>{eyebrow}</Text><Text style={styles.memoryTitle}>{title}</Text></View>
        <Pressable onPress={onOpenAll}><Text style={styles.openAll}>Open all</Text></Pressable>
      </View>
      {hasChildren ? children : <Text style={styles.emptyText}>{empty}</Text>}
    </View>
  );
}

function MemoryItem({ status, statement, meta, evidence }: { status: string; statement: string; meta?: string; evidence: Decision['evidence'] }) {
  return (
    <View style={styles.memoryItem}>
      <View style={styles.memoryItemTop}><Text style={styles.memoryStatus}>{status.toUpperCase()}</Text>{meta ? <Text style={styles.memoryMeta}>{meta}</Text> : null}</View>
      <Text style={styles.memoryStatement}>{statement}</Text>
      {evidence.length ? <SourceProof evidence={evidence} compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  topbar: { minHeight: 68, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 28, lineHeight: 30, marginTop: -2 },
  topbarTitleWrap: { flex: 1, minWidth: 0 },
  topbarThread: { color: colors.forest, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  topbarTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 2 },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.mintSoft, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 10 },
  sourceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.forest },
  sourceBadgeText: { color: colors.forestDark, fontSize: 10, fontWeight: '800' },
  mobileTabs: { flexDirection: 'row', backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 14, paddingVertical: 9, gap: 7 },
  mobileTab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: colors.canvas },
  mobileTabActive: { backgroundColor: colors.ink },
  mobileTabText: { color: colors.mutedDark, fontSize: 12, fontWeight: '800' },
  mobileTabTextActive: { color: colors.paper },
  workspace: { flex: 1 },
  workspaceDesktop: { flexDirection: 'row' },
  memoryPane: { flex: 1 },
  memoryContent: { width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 44 },
  meetingHero: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  heroEyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.35, marginBottom: 8 },
  heroTitle: { color: colors.ink, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.8 },
  heroMeta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  heroStatus: { backgroundColor: colors.mintSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  heroStatusText: { color: colors.forestDark, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  changeBanner: { backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: '#D8DFFE', borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  changeKicker: { color: colors.blue, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  changeTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 4 },
  changeArrow: { color: colors.blue, fontSize: 23, marginLeft: 10 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  summaryStat: { minWidth: 110, flexGrow: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12 },
  summaryValue: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  memorySection: { marginBottom: 25 },
  memorySectionHeader: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  memoryEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.25, marginBottom: 4 },
  memoryTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.35 },
  openAll: { color: colors.forest, fontSize: 11, fontWeight: '900', padding: 6 },
  memoryItem: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 15, marginBottom: 8 },
  memoryItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  memoryStatus: { color: colors.forest, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  memoryMeta: { color: colors.muted, fontSize: 10, flexShrink: 1, textAlign: 'right' },
  memoryStatement: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: '700', marginBottom: 9 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14 },
  conflictCard: { backgroundColor: colors.redSoft, borderWidth: 1, borderColor: '#E6C8C5', borderRadius: 15, padding: 15, marginBottom: 8 },
  conflictHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  conflictStatus: { color: colors.red, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  conflictConfidence: { color: colors.muted, fontSize: 10 },
  evidenceLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 10, marginBottom: 4 },
  privacyNote: { backgroundColor: colors.mintSoft, borderRadius: 16, borderWidth: 1, borderColor: '#CFE5D7', padding: 15 },
  privacyTitle: { color: colors.forestDark, fontSize: 12, fontWeight: '900' },
  privacyBody: { color: colors.mutedDark, fontSize: 11, lineHeight: 17, marginTop: 5 },
  transcriptPane: { flex: 1, backgroundColor: colors.paper },
  transcriptPaneDesktop: { width: 410, flex: 0, borderLeftWidth: 1, borderLeftColor: colors.line },
  transcriptHeader: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transcriptKicker: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 3 },
  transcriptTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  transcriptCount: { minWidth: 28, height: 28, borderRadius: 10, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  transcriptCountText: { color: colors.mutedDark, fontSize: 10, fontWeight: '900' },
  transcriptScroll: { flex: 1 },
  transcriptContent: { padding: 17, paddingBottom: 40 },
  transcriptEmpty: { backgroundColor: colors.canvas, borderRadius: 15, padding: 16 },
  transcriptEmptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  transcriptEmptyBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  segment: { paddingBottom: 17, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  segmentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  speaker: { color: colors.forestDark, fontSize: 10, fontWeight: '900' },
  timestamp: { color: colors.muted, fontSize: 9, fontVariant: ['tabular-nums'] },
  segmentText: { color: colors.mutedDark, fontSize: 13, lineHeight: 20 },
});
