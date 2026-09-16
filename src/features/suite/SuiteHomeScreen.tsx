import { useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  Assumption,
  Commitment,
  Contradiction,
  Decision,
  Meeting,
  MeetingChangeSet,
  PrivateNote,
  Question,
  Thread,
} from '../../models/domain';
import { colors } from '../../theme';
import { PreMeetingBriefCard } from '../briefing/PreMeetingBriefCard';
import { createLocalBriefingProvider } from '../briefing/localBriefingProvider';

type SuiteHomeScreenProps = {
  threads: Thread[];
  selectedThreadId: string | null;
  newThreadTitle: string;
  meetings: Meeting[];
  decisions: Decision[];
  commitments: Commitment[];
  assumptions: Assumption[];
  questions: Question[];
  contradictions: Contradiction[];
  privateNotes: PrivateNote[];
  changeSets: MeetingChangeSet[];
  pendingDraftMeeting: Meeting | null;
  pendingReviewMeeting: Meeting | null;
  onSelectThread: (threadId: string) => void;
  onChangeNewThreadTitle: (value: string) => void;
  onCreateThread: () => void;
  onStartCapture: () => void;
  onRecoverDraft: (meeting: Meeting) => void;
  onDiscardDraft: (meeting: Meeting) => void;
  onResumeReview: () => void;
  onOpenMeeting: (meeting: Meeting) => void;
  onOpenChanges: (meetingId: string) => void;
  onOpenDecisions: () => void;
  onOpenCommitments: () => void;
  onOpenAssumptions: () => void;
  onOpenQuestions: () => void;
  onOpenContradictions: () => void;
  onOpenPrivateNotes: () => void;
};

function formatDuration(ms: number) {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SuiteHomeScreen(props: SuiteHomeScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1080;
  const compact = width < 720;
  const selectedThread = props.threads.find((thread) => thread.id === props.selectedThreadId) ?? null;
  const selectedThreadId = props.selectedThreadId;

  const threadMeetings = useMemo(
    () => props.meetings.filter((meeting) => !selectedThreadId || meeting.threadId === selectedThreadId).slice(0, 8),
    [props.meetings, selectedThreadId],
  );
  const threadDecisions = props.decisions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadCommitments = props.commitments.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadAssumptions = props.assumptions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadQuestions = props.questions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadContradictions = props.contradictions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadPrivateNotes = props.privateNotes.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const changeSetByMeeting = new Map(props.changeSets.map((item) => [item.meetingId, item]));

  const activeDecisions = threadDecisions.filter((item) => item.status === 'active');
  const openCommitments = threadCommitments.filter((item) => item.status === 'open');
  const untestedAssumptions = threadAssumptions.filter((item) => item.status === 'untested');
  const openQuestions = threadQuestions.filter((item) => item.status === 'open');
  const proposedContradictions = threadContradictions.filter((item) => item.status === 'proposed');
  const privateCount = threadPrivateNotes.filter((item) => !item.promotedAt).length;
  const overdueCommitments = openCommitments.filter((item) => item.dueAt && Date.parse(item.dueAt) < Date.now());
  const briefingProvider = useMemo(
    () => createLocalBriefingProvider((threadId) => ({
      threadTitle: props.threads.find((thread) => thread.id === threadId)?.title,
      decisions: props.decisions.filter((item) => item.threadId === threadId),
      commitments: props.commitments.filter((item) => item.threadId === threadId),
      assumptions: props.assumptions.filter((item) => item.threadId === threadId),
      questions: props.questions.filter((item) => item.threadId === threadId),
      contradictions: props.contradictions.filter((item) => item.threadId === threadId),
    })),
    [props.assumptions, props.commitments, props.contradictions, props.decisions, props.questions, props.threads],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.shell, desktop && styles.shellDesktop]}>
        {desktop ? (
          <View style={styles.sidebar}>
            <Brand />
            <Text style={styles.navLabel}>WORKSPACE</Text>
            <NavItem label="Today" active />
            <NavItem label="Decisions" count={activeDecisions.length} onPress={props.onOpenDecisions} />
            <NavItem label="Commitments" count={openCommitments.length} onPress={props.onOpenCommitments} />
            <NavItem label="Assumptions" count={untestedAssumptions.length} onPress={props.onOpenAssumptions} />
            <NavItem label="Open Questions" count={openQuestions.length} onPress={props.onOpenQuestions} />
            <NavItem label="Contradictions" count={proposedContradictions.length} onPress={props.onOpenContradictions} />
            <NavItem label="Private Sidecar" count={privateCount} onPress={props.onOpenPrivateNotes} />
            <View style={styles.sidebarSpacer} />
            <View style={styles.sidebarStatus}>
              <View style={styles.statusDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarStatusTitle}>Local-first workspace</Text>
                <Text style={styles.sidebarStatusBody}>Private notes stay private until promoted.</Text>
              </View>
            </View>
          </View>
        ) : null}

        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, desktop && styles.contentDesktop]} keyboardShouldPersistTaps="handled">
          {!desktop ? (
            <View style={styles.mobileHeader}>
              <Brand />
              <Pressable style={styles.mobileCapture} onPress={props.onStartCapture} disabled={!selectedThreadId || Boolean(props.pendingDraftMeeting)}>
                <Text style={styles.mobileCaptureText}>Record</Text>
              </Pressable>
            </View>
          ) : null}

          {!desktop ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
              <NavPill label="Today" active />
              <NavPill label="Decisions" onPress={props.onOpenDecisions} />
              <NavPill label="Commitments" onPress={props.onOpenCommitments} />
              <NavPill label="Assumptions" onPress={props.onOpenAssumptions} />
              <NavPill label="Questions" onPress={props.onOpenQuestions} />
              <NavPill label="Conflicts" onPress={props.onOpenContradictions} />
              <NavPill label="Private" onPress={props.onOpenPrivateNotes} />
            </ScrollView>
          ) : null}

          <View style={[styles.pageGrid, desktop && styles.pageGridDesktop]}>
            <View style={styles.mainColumn}>
              <View style={styles.pageHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>TODAY · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</Text>
                  <Text style={styles.pageTitle}>{selectedThread?.title ?? 'Your meeting memory'}</Text>
                  <Text style={styles.pageBody}>Everything that changed, everything still open, and the source behind it.</Text>
                </View>
              </View>

              <View style={styles.threadPanel}>
                <Text style={styles.fieldLabel}>THREAD</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.threadRow}>
                  {props.threads.map((thread) => (
                    <Pressable key={thread.id} onPress={() => props.onSelectThread(thread.id)} style={[styles.threadChip, selectedThreadId === thread.id && styles.threadChipActive]}>
                      <Text style={[styles.threadChipText, selectedThreadId === thread.id && styles.threadChipTextActive]}>{thread.title}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.newThreadRow}>
                  <TextInput
                    value={props.newThreadTitle}
                    onChangeText={props.onChangeNewThreadTitle}
                    placeholder="Create a new thread"
                    placeholderTextColor={colors.muted}
                    style={styles.newThreadInput}
                    returnKeyType="done"
                    onSubmitEditing={props.onCreateThread}
                  />
                  <Pressable style={styles.newThreadButton} onPress={props.onCreateThread}><Text style={styles.newThreadButtonText}>Add</Text></Pressable>
                </View>
              </View>

              {props.pendingDraftMeeting ? (
                <RecoveryCard
                  tone="danger"
                  label="UNFINISHED CAPTURE"
                  title={props.pendingDraftMeeting.title}
                  body={`Checkpointed at ${Math.round(props.pendingDraftMeeting.durationMs / 1000)} seconds.${props.pendingDraftMeeting.audioUri ? ' Local audio is available for recovery.' : ''}`}
                  primaryLabel={props.pendingDraftMeeting.audioUri ? 'Review recovered draft' : undefined}
                  onPrimary={props.pendingDraftMeeting.audioUri ? () => props.onRecoverDraft(props.pendingDraftMeeting!) : undefined}
                  secondaryLabel="Discard draft"
                  onSecondary={() => props.onDiscardDraft(props.pendingDraftMeeting!)}
                />
              ) : null}

              {props.pendingReviewMeeting ? (
                <RecoveryCard
                  tone="attention"
                  label="REVIEW SAVED"
                  title={`Finish ${props.pendingReviewMeeting.title}`}
                  body="Your transcript and review choices are saved locally."
                  primaryLabel="Resume review"
                  onPrimary={props.onResumeReview}
                />
              ) : null}

              <Pressable
                disabled={!selectedThreadId || Boolean(props.pendingDraftMeeting)}
                onPress={props.onStartCapture}
                style={({ pressed }) => [styles.captureHero, (!selectedThreadId || Boolean(props.pendingDraftMeeting)) && styles.captureHeroDisabled, pressed && styles.pressed]}
              >
                <View style={styles.recordOrb}><View style={styles.recordDot} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.captureKicker}>CAPTURE</Text>
                  <Text style={styles.captureTitle}>Start a meeting</Text>
                  <Text style={styles.captureBody}>{props.pendingDraftMeeting ? 'Resolve the unfinished capture first.' : `Record directly into ${selectedThread?.title ?? 'this thread'}.`}</Text>
                </View>
                {!compact ? <Text style={styles.captureArrow}>→</Text> : null}
              </Pressable>

              <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
                <MetricCard value={activeDecisions.length} label="Active decisions" hint="Current truth" tone="green" onPress={props.onOpenDecisions} />
                <MetricCard value={openCommitments.length} label="Open commitments" hint={overdueCommitments.length ? `${overdueCommitments.length} overdue` : 'On track'} tone={overdueCommitments.length ? 'red' : 'blue'} onPress={props.onOpenCommitments} />
                <MetricCard value={untestedAssumptions.length} label="Assumptions" hint="Need validation" tone="amber" onPress={props.onOpenAssumptions} />
              </View>

              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionKicker}>CONVERSATION HISTORY</Text>
                  <Text style={styles.sectionTitle}>Recent meetings</Text>
                </View>
                <Text style={styles.sectionMeta}>{threadMeetings.length} shown</Text>
              </View>

              {threadMeetings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No meetings in this thread yet.</Text>
                  <Text style={styles.emptyBody}>Your first capture becomes the start of this thread’s durable memory.</Text>
                </View>
              ) : threadMeetings.map((meeting) => {
                const changeSet = changeSetByMeeting.get(meeting.id);
                return (
                  <Pressable key={meeting.id} style={({ pressed }) => [styles.meetingRow, pressed && styles.pressed]} onPress={() => props.onOpenMeeting(meeting)}>
                    <View style={styles.meetingDate}><Text style={styles.meetingDateText}>{dayLabel(meeting.startedAt)}</Text></View>
                    <View style={styles.meetingMain}>
                      <Text style={styles.meetingTitle}>{meeting.title}</Text>
                      <Text style={styles.meetingMeta}>{formatDuration(meeting.durationMs)} · {new Date(meeting.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>
                    </View>
                    <View style={styles.meetingRight}>
                      <StatusPill status={meeting.status} />
                      {changeSet?.changes.length ? (
                        <Pressable style={styles.changeBadge} onPress={() => props.onOpenChanges(meeting.id)}>
                          <Text style={styles.changeBadgeText}>{changeSet.changes.length} changes</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.rightRail, !desktop && styles.rightRailMobile]}>
              <PreMeetingBriefCard threadId={selectedThreadId} provider={briefingProvider} />

              <View style={styles.railCard}>
                <Text style={styles.railKicker}>MEMORY PULSE</Text>
                <Text style={styles.railTitle}>What needs attention</Text>
                <AttentionRow label="Overdue commitments" value={overdueCommitments.length} tone={overdueCommitments.length ? 'danger' : 'quiet'} onPress={props.onOpenCommitments} />
                <AttentionRow label="Proposed contradictions" value={proposedContradictions.length} tone={proposedContradictions.length ? 'danger' : 'quiet'} onPress={props.onOpenContradictions} />
                <AttentionRow label="Untested assumptions" value={untestedAssumptions.length} tone={untestedAssumptions.length ? 'attention' : 'quiet'} onPress={props.onOpenAssumptions} />
                <AttentionRow label="Open questions" value={openQuestions.length} tone={openQuestions.length ? 'attention' : 'quiet'} onPress={props.onOpenQuestions} />
              </View>

              <View style={styles.railCard}>
                <Text style={styles.railKicker}>DURABLE MEMORY</Text>
                <Text style={styles.railTitle}>Your operational layer</Text>
                <MemoryLink title="Decision Ledger" body="Current, reversed and superseded decisions with source proof." onPress={props.onOpenDecisions} />
                <MemoryLink title="Commitment Radar" body="Promises, owners, due dates and risk." onPress={props.onOpenCommitments} />
                <MemoryLink title="Assumption Register" body="What still needs to be proven." onPress={props.onOpenAssumptions} />
                <MemoryLink title="Open Questions" body="Unresolved questions that stay visible until explicitly closed." onPress={props.onOpenQuestions} />
                <MemoryLink title="Contradiction Review" body="Conflicts that require human resolution." onPress={props.onOpenContradictions} />
                <MemoryLink title="Private Sidecar" body="Notes excluded from shared context until you promote them." onPress={props.onOpenPrivateNotes} />
              </View>

              <View style={styles.privacyCard}>
                <Text style={styles.privacyTitle}>Private by default</Text>
                <Text style={styles.privacyBody}>Source-backed memory can be shared. Private Sidecar notes remain excluded until you explicitly promote them.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><View style={styles.brandMarkInner} /></View>
      <View><Text style={styles.brandName}>ConvoWeave</Text><Text style={styles.brandSub}>MEETING MEMORY</Text></View>
    </View>
  );
}

function NavItem({ label, count, active = false, onPress }: { label: string; count?: number; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress && !active} onPress={onPress} style={[styles.navItem, active && styles.navItemActive]}>
      <Text style={[styles.navItemText, active && styles.navItemTextActive]}>{label}</Text>
      {typeof count === 'number' ? <View style={[styles.navCount, active && styles.navCountActive]}><Text style={[styles.navCountText, active && styles.navCountTextActive]}>{count}</Text></View> : null}
    </Pressable>
  );
}

function NavPill({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.navPill, active && styles.navPillActive]}><Text style={[styles.navPillText, active && styles.navPillTextActive]}>{label}</Text></Pressable>;
}

function MetricCard({ value, label, hint, tone, onPress }: { value: number; label: string; hint: string; tone: 'green' | 'blue' | 'amber' | 'red'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.metricCard, pressed && styles.pressed]}>
      <View style={[styles.metricAccent, tone === 'green' && styles.metricGreen, tone === 'blue' && styles.metricBlue, tone === 'amber' && styles.metricAmber, tone === 'red' && styles.metricRed]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricHint, tone === 'red' && styles.metricHintDanger]}>{hint}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: Meeting['status'] }) {
  const complete = status === 'complete';
  return <View style={[styles.statusPill, complete && styles.statusPillComplete]}><Text style={[styles.statusPillText, complete && styles.statusPillTextComplete]}>{status}</Text></View>;
}

function AttentionRow({ label, value, tone, onPress }: { label: string; value: number; tone: 'danger' | 'attention' | 'quiet'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.attentionRow}>
      <View style={{ flex: 1 }}><Text style={styles.attentionLabel}>{label}</Text></View>
      <View style={[styles.attentionValue, tone === 'danger' && styles.attentionDanger, tone === 'attention' && styles.attentionAmber]}><Text style={[styles.attentionValueText, tone === 'danger' && styles.attentionDangerText, tone === 'attention' && styles.attentionAmberText]}>{value}</Text></View>
    </Pressable>
  );
}

function MemoryLink({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.memoryLink}>
      <View style={{ flex: 1 }}><Text style={styles.memoryLinkTitle}>{title}</Text><Text style={styles.memoryLinkBody}>{body}</Text></View>
      <Text style={styles.memoryArrow}>›</Text>
    </Pressable>
  );
}

function RecoveryCard({ tone, label, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary }: { tone: 'danger' | 'attention'; label: string; title: string; body: string; primaryLabel?: string; onPrimary?: () => void; secondaryLabel?: string; onSecondary?: () => void }) {
  return (
    <View style={[styles.recoveryCard, tone === 'danger' ? styles.recoveryDanger : styles.recoveryAttention]}>
      <Text style={[styles.recoveryLabel, tone === 'danger' ? styles.recoveryLabelDanger : styles.recoveryLabelAttention]}>{label}</Text>
      <Text style={styles.recoveryTitle}>{title}</Text>
      <Text style={styles.recoveryBody}>{body}</Text>
      <View style={styles.recoveryActions}>
        {primaryLabel && onPrimary ? <Pressable style={styles.recoveryPrimary} onPress={onPrimary}><Text style={styles.recoveryPrimaryText}>{primaryLabel}</Text></Pressable> : null}
        {secondaryLabel && onSecondary ? <Pressable style={styles.recoverySecondary} onPress={onSecondary}><Text style={styles.recoverySecondaryText}>{secondaryLabel}</Text></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  shell: { flex: 1 },
  shellDesktop: { flexDirection: 'row' },
  sidebar: { width: 248, backgroundColor: colors.paper, borderRightWidth: 1, borderRightColor: colors.line, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  brandMarkInner: { width: 11, height: 11, borderRadius: 4, backgroundColor: colors.mint },
  brandName: { color: colors.ink, fontWeight: '900', fontSize: 17, letterSpacing: -0.3 },
  brandSub: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 1 },
  navLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 34, marginBottom: 10, paddingHorizontal: 10 },
  navItem: { minHeight: 44, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  navItemActive: { backgroundColor: colors.ink },
  navItemText: { color: colors.mutedDark, fontSize: 14, fontWeight: '700', flex: 1 },
  navItemTextActive: { color: colors.paper },
  navCount: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  navCountActive: { backgroundColor: '#303832' },
  navCountText: { color: colors.mutedDark, fontSize: 11, fontWeight: '800' },
  navCountTextActive: { color: colors.paper },
  sidebarSpacer: { flex: 1 },
  sidebarStatus: { flexDirection: 'row', gap: 10, backgroundColor: colors.canvas, borderRadius: 14, padding: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.forest, marginTop: 4 },
  sidebarStatusTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  sidebarStatusBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  contentDesktop: { paddingHorizontal: 32, paddingTop: 28 },
  mobileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  mobileCapture: { backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  mobileCaptureText: { color: colors.paper, fontSize: 12, fontWeight: '800' },
  mobileNav: { gap: 7, paddingBottom: 18 },
  navPill: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  navPillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  navPillText: { color: colors.mutedDark, fontSize: 12, fontWeight: '800' },
  navPillTextActive: { color: colors.paper },
  pageGrid: { width: '100%', maxWidth: 1260, alignSelf: 'center' },
  pageGridDesktop: { flexDirection: 'row', gap: 22, alignItems: 'flex-start' },
  mainColumn: { flex: 1, minWidth: 0 },
  rightRail: { width: 310, gap: 14 },
  rightRailMobile: { width: '100%', marginTop: 18 },
  pageHeader: { flexDirection: 'row', marginBottom: 20 },
  eyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 9 },
  pageTitle: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
  pageBody: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 620 },
  threadPanel: { marginBottom: 18 },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.25, marginBottom: 8 },
  threadRow: { gap: 7, paddingBottom: 10 },
  threadChip: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  threadChipActive: { backgroundColor: colors.mintSoft, borderColor: '#C7E2D1' },
  threadChipText: { color: colors.mutedDark, fontWeight: '700', fontSize: 12 },
  threadChipTextActive: { color: colors.forestDark },
  newThreadRow: { flexDirection: 'row', gap: 7, maxWidth: 420 },
  newThreadInput: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: colors.ink, fontSize: 13 },
  newThreadButton: { justifyContent: 'center', backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 14 },
  newThreadButtonText: { color: colors.paper, fontWeight: '800', fontSize: 12 },
  recoveryCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  recoveryDanger: { backgroundColor: colors.redSoft, borderColor: '#E6C8C5' },
  recoveryAttention: { backgroundColor: colors.amberSoft, borderColor: '#EBD7B8' },
  recoveryLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  recoveryLabelDanger: { color: colors.red },
  recoveryLabelAttention: { color: colors.amber },
  recoveryTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 6 },
  recoveryBody: { color: colors.mutedDark, fontSize: 13, lineHeight: 19, marginTop: 5 },
  recoveryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  recoveryPrimary: { backgroundColor: colors.ink, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 11 },
  recoveryPrimaryText: { color: colors.paper, fontSize: 12, fontWeight: '800' },
  recoverySecondary: { backgroundColor: colors.paper, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 11 },
  recoverySecondaryText: { color: colors.red, fontSize: 12, fontWeight: '800' },
  captureHero: { backgroundColor: colors.ink, borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  captureHeroDisabled: { opacity: 0.48 },
  recordOrb: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#2A332D', alignItems: 'center', justifyContent: 'center' },
  recordDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.mint },
  captureKicker: { color: colors.mint, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  captureTitle: { color: colors.paper, fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 3 },
  captureBody: { color: '#B9C2BC', fontSize: 13, lineHeight: 19, marginTop: 4 },
  captureArrow: { color: colors.paper, fontSize: 25, marginLeft: 10 },
  metricGrid: { flexDirection: 'row', gap: 9, marginBottom: 28 },
  metricGridCompact: { flexDirection: 'column' },
  metricCard: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, minHeight: 122 },
  metricAccent: { width: 26, height: 4, borderRadius: 3, marginBottom: 13 },
  metricGreen: { backgroundColor: colors.forest },
  metricBlue: { backgroundColor: colors.blue },
  metricAmber: { backgroundColor: colors.amber },
  metricRed: { backgroundColor: colors.red },
  metricValue: { color: colors.ink, fontSize: 28, lineHeight: 32, fontWeight: '900', letterSpacing: -0.8 },
  metricLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 4 },
  metricHint: { color: colors.muted, fontSize: 11, marginTop: 6 },
  metricHintDanger: { color: colors.red, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 },
  sectionKicker: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 4 },
  sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  sectionMeta: { color: colors.muted, fontSize: 11, marginBottom: 3 },
  emptyCard: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 18 },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  meetingRow: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 11 },
  meetingDate: { width: 48, height: 48, borderRadius: 13, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  meetingDateText: { color: colors.mutedDark, fontSize: 10, lineHeight: 13, fontWeight: '800', textAlign: 'center' },
  meetingMain: { flex: 1, minWidth: 0 },
  meetingTitle: { color: colors.ink, fontSize: 14, fontWeight: '850' as '900' },
  meetingMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  meetingRight: { alignItems: 'flex-end', gap: 5 },
  statusPill: { borderRadius: 999, backgroundColor: colors.canvas, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillComplete: { backgroundColor: colors.mintSoft },
  statusPillText: { color: colors.mutedDark, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  statusPillTextComplete: { color: colors.forestDark },
  changeBadge: { backgroundColor: colors.blueSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  changeBadgeText: { color: colors.blue, fontSize: 9, fontWeight: '900' },
  railCard: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16 },
  railKicker: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.25, marginBottom: 5 },
  railTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 12 },
  attentionRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingVertical: 9 },
  attentionLabel: { color: colors.mutedDark, fontSize: 12, fontWeight: '700' },
  attentionValue: { minWidth: 28, height: 28, borderRadius: 9, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  attentionDanger: { backgroundColor: colors.redSoft },
  attentionAmber: { backgroundColor: colors.amberSoft },
  attentionValueText: { color: colors.mutedDark, fontSize: 11, fontWeight: '900' },
  attentionDangerText: { color: colors.red },
  attentionAmberText: { color: colors.amber },
  memoryLink: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingVertical: 11 },
  memoryLinkTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  memoryLinkBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  memoryArrow: { color: colors.muted, fontSize: 22 },
  privacyCard: { backgroundColor: colors.mintSoft, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#CFE5D7' },
  privacyTitle: { color: colors.forestDark, fontSize: 13, fontWeight: '900' },
  privacyBody: { color: colors.mutedDark, fontSize: 11, lineHeight: 17, marginTop: 5 },
  pressed: { opacity: 0.72 },
});
