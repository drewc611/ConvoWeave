import { useEffect, useMemo, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, Screen, screenStyles } from './components/Screen';
import { AssumptionRegisterScreen } from './features/assumptions/AssumptionRegisterScreen';
import { CommitmentRadarScreen } from './features/commitments/CommitmentRadarScreen';
import { buildDecisionDiff, type ThreadState } from './features/decisions/decisionDiff';
import { DecisionLedgerScreen } from './features/decisions/DecisionLedgerScreen';
import { WhatChangedScreen } from './features/decisions/WhatChangedScreen';
import { CaptureScreen } from './features/meetings/CaptureScreen';
import { ReviewScreen } from './features/meetings/ReviewScreen';
import { PrivateSidecarScreen } from './features/private-notes/PrivateSidecarScreen';
import { promotePrivateNote, returnPrivateNoteToSidecar } from './features/private-notes/privateContext';
import type {
  Assumption,
  Commitment,
  Decision,
  Meeting,
  MeetingChangeSet,
  MeetingReview,
  PrivateNote,
  Thread,
} from './models/domain';
import { mockProviders } from './services/mockProviders';
import {
  AssumptionRepository,
  CommitmentRepository,
  DecisionRepository,
  MeetingChangeSetRepository,
  MeetingRepository,
  MeetingReviewRepository,
  PrivateNoteRepository,
  ThreadRepository,
} from './storage/repositories';
import { colors } from './theme';

type Route = 'home' | 'capture' | 'review' | 'changes' | 'decisions' | 'commitments' | 'assumptions' | 'private-notes';

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppRoot() {
  const repositories = useMemo(() => ({
    meetings: new MeetingRepository(),
    reviews: new MeetingReviewRepository(),
    changes: new MeetingChangeSetRepository(),
    threads: new ThreadRepository(),
    decisions: new DecisionRepository(),
    commitments: new CommitmentRepository(),
    assumptions: new AssumptionRepository(),
    privateNotes: new PrivateNoteRepository(),
  }), []);

  const [route, setRoute] = useState<Route>('home');
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [currentReview, setCurrentReview] = useState<MeetingReview | null>(null);
  const [currentChangeSet, setCurrentChangeSet] = useState<MeetingChangeSet | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>([]);
  const [changeSets, setChangeSets] = useState<MeetingChangeSet[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [pendingDraftMeeting, setPendingDraftMeeting] = useState<Meeting | null>(null);
  const [pendingReviewMeeting, setPendingReviewMeeting] = useState<Meeting | null>(null);
  const [pendingReview, setPendingReview] = useState<MeetingReview | null>(null);

  const refresh = async () => {
    let [nextMeetings, nextDecisions, nextCommitments, nextAssumptions, nextPrivateNotes, nextThreads, nextChangeSets] = await Promise.all([
      repositories.meetings.list(),
      repositories.decisions.list(),
      repositories.commitments.list(),
      repositories.assumptions.list(),
      repositories.privateNotes.list(),
      repositories.threads.list(),
      repositories.changes.list(),
    ]);

    if (nextThreads.length === 0) {
      const now = new Date().toISOString();
      const inbox: Thread = { id: 'inbox-thread', title: 'Inbox', createdAt: now, updatedAt: now };
      await repositories.threads.upsert(inbox);
      nextThreads = [inbox];
    }

    setMeetings(nextMeetings);
    setDecisions(nextDecisions);
    setCommitments(nextCommitments);
    setAssumptions(nextAssumptions);
    setPrivateNotes(nextPrivateNotes);
    setThreads(nextThreads);
    setChangeSets(nextChangeSets);
    setSelectedThreadId((current) => {
      if (current && nextThreads.some((thread) => thread.id === current)) return current;
      return nextThreads[0]?.id ?? null;
    });

    setPendingDraftMeeting(nextMeetings.find((meeting) => meeting.status === 'draft') ?? null);
    const reviewMeeting = nextMeetings.find((meeting) => meeting.status === 'review') ?? null;
    setPendingReviewMeeting(reviewMeeting);
    setPendingReview(reviewMeeting ? await repositories.reviews.get(reviewMeeting.id) : null);
  };

  useEffect(() => { void refresh(); }, []);

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;
  const threadDecisions = decisions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadCommitments = commitments.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadAssumptions = assumptions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadPrivateNotes = privateNotes.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const recentMeetings = meetings.filter((meeting) => !selectedThreadId || meeting.threadId === selectedThreadId).slice(0, 5);
  const counts = {
    decisions: threadDecisions.filter((item) => item.status === 'active').length,
    commitments: threadCommitments.filter((item) => item.status === 'open').length,
    assumptions: threadAssumptions.filter((item) => item.status === 'untested').length,
  };
  const changeSetByMeeting = new Map(changeSets.map((item) => [item.meetingId, item]));

  const createThread = async () => {
    const title = newThreadTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    const thread: Thread = { id: makeId('thread'), title, createdAt: now, updatedAt: now };
    await repositories.threads.upsert(thread);
    setNewThreadTitle('');
    await refresh();
    setSelectedThreadId(thread.id);
  };

  const startCaptureDraft = async (audioUri?: string) => {
    const now = new Date();
    const draft: Meeting = {
      id: makeId('meeting'),
      threadId: selectedThreadId ?? undefined,
      title: `Meeting · ${now.toLocaleDateString()}`,
      startedAt: now.toISOString(),
      durationMs: 0,
      audioUri,
      status: 'draft',
    };
    await repositories.meetings.upsert(draft);
    setCurrentMeeting(draft);
    setPendingDraftMeeting(draft);
  };

  const checkpointCapture = async (audioUri: string | undefined, durationMs: number) => {
    if (!currentMeeting || currentMeeting.status !== 'draft') return;
    const updated: Meeting = {
      ...currentMeeting,
      durationMs,
      audioUri: audioUri ?? currentMeeting.audioUri,
    };
    await repositories.meetings.upsert(updated);
    setCurrentMeeting(updated);
    setPendingDraftMeeting(updated);
  };

  const finishCapture = async (audioUri: string | undefined, durationMs: number) => {
    const now = new Date();
    const base = currentMeeting?.status === 'draft'
      ? currentMeeting
      : {
          id: makeId('meeting'),
          threadId: selectedThreadId ?? undefined,
          title: `Meeting · ${now.toLocaleDateString()}`,
          startedAt: new Date(now.getTime() - durationMs).toISOString(),
          durationMs: 0,
          status: 'draft' as const,
        };
    const meeting: Meeting = {
      ...base,
      endedAt: now.toISOString(),
      durationMs,
      audioUri: audioUri ?? base.audioUri,
      status: 'review',
    };
    await repositories.meetings.upsert(meeting);
    setPendingDraftMeeting(null);
    setCurrentMeeting(meeting);
    setCurrentReview(null);
    setRoute('review');
  };

  const recoverDraft = async (draft: Meeting) => {
    if (!draft.audioUri) return;
    const recovered: Meeting = {
      ...draft,
      endedAt: draft.endedAt ?? new Date().toISOString(),
      status: 'review',
    };
    await repositories.meetings.upsert(recovered);
    setPendingDraftMeeting(null);
    setCurrentMeeting(recovered);
    setCurrentReview(null);
    if (recovered.threadId) setSelectedThreadId(recovered.threadId);
    setRoute('review');
  };

  const discardDraft = async (draft: Meeting) => {
    await repositories.meetings.remove(draft.id);
    if (currentMeeting?.id === draft.id) setCurrentMeeting(null);
    setPendingDraftMeeting(null);
    await refresh();
  };

  const saveReviewProgress = async (review: MeetingReview) => {
    await repositories.reviews.upsert(review);
    if (currentMeeting) {
      const updatedMeeting: Meeting = { ...currentMeeting, transcript: review.transcript, status: 'review' };
      await repositories.meetings.upsert(updatedMeeting);
      setCurrentMeeting(updatedMeeting);
    }
    setCurrentReview(review);
  };

  const loadThreadState = async (threadId: string): Promise<ThreadState> => {
    const [allDecisions, allCommitments, allAssumptions] = await Promise.all([
      repositories.decisions.list(),
      repositories.commitments.list(),
      repositories.assumptions.list(),
    ]);
    return {
      decisions: allDecisions.filter((item) => item.threadId === threadId),
      commitments: allCommitments.filter((item) => item.threadId === threadId),
      assumptions: allAssumptions.filter((item) => item.threadId === threadId),
    };
  };

  const saveReview = async (meeting: Meeting, review: MeetingReview) => {
    const threadId = meeting.threadId ?? selectedThreadId ?? 'inbox-thread';
    const prior = await loadThreadState(threadId);
    const accepted = review.proposals.filter((item) => item.state === 'accepted');
    const now = new Date().toISOString();

    for (const proposal of accepted) {
      if (proposal.kind === 'decision') {
        const decision: Decision = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          rationale: proposal.rationale,
          ownerId: proposal.ownerId,
          status: 'active',
          evidence: proposal.evidence,
          createdAt: now,
        };
        await repositories.decisions.upsert(decision);
      }
      if (proposal.kind === 'commitment') {
        const commitment: Commitment = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          ownerId: proposal.ownerId,
          dueAt: proposal.dueAt,
          status: 'open',
          evidence: proposal.evidence,
          createdAt: now,
          lastUpdatedAt: now,
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
          reviewAt: proposal.reviewAt,
        };
        await repositories.assumptions.upsert(assumption);
      }
    }

    const current = await loadThreadState(threadId);
    const changeSet: MeetingChangeSet = {
      id: meeting.id,
      meetingId: meeting.id,
      threadId,
      changes: buildDecisionDiff(prior, current),
      createdAt: now,
    };

    await repositories.changes.upsert(changeSet);
    await repositories.meetings.upsert({ ...meeting, threadId, transcript: review.transcript, status: 'complete' });
    await repositories.reviews.remove(meeting.id);

    setCurrentMeeting(null);
    setCurrentReview(null);
    setCurrentChangeSet(changeSet);
    setSelectedThreadId(threadId);
    setRoute('changes');
    await refresh();
    setSelectedThreadId(threadId);
  };

  const resumeReview = async () => {
    if (!pendingReviewMeeting) return;
    setCurrentMeeting(pendingReviewMeeting);
    setCurrentReview(pendingReview);
    if (pendingReviewMeeting.threadId) setSelectedThreadId(pendingReviewMeeting.threadId);
    setRoute('review');
  };

  const openChanges = async (meetingId: string) => {
    const existing = changeSetByMeeting.get(meetingId) ?? await repositories.changes.get(meetingId);
    if (!existing) return;
    setCurrentChangeSet(existing);
    setSelectedThreadId(existing.threadId);
    setRoute('changes');
  };

  const updateDecision = async (decision: Decision) => {
    await repositories.decisions.upsert(decision);
    await refresh();
  };

  const updateCommitment = async (commitment: Commitment) => {
    await repositories.commitments.upsert(commitment);
    await refresh();
  };

  const updateAssumption = async (assumption: Assumption) => {
    await repositories.assumptions.upsert(assumption);
    await refresh();
  };

  const createPrivateNote = async (body: string) => {
    if (!selectedThreadId) return;
    const now = new Date().toISOString();
    const note: PrivateNote = {
      id: makeId('private-note'),
      threadId: selectedThreadId,
      body,
      createdAt: now,
      updatedAt: now,
    };
    await repositories.privateNotes.upsert(note);
    await refresh();
  };

  const promoteNote = async (note: PrivateNote) => {
    await repositories.privateNotes.upsert(promotePrivateNote(note));
    await refresh();
  };

  const makeNotePrivate = async (note: PrivateNote) => {
    await repositories.privateNotes.upsert(returnPrivateNoteToSidecar(note));
    await refresh();
  };

  const deletePrivateNote = async (note: PrivateNote) => {
    await repositories.privateNotes.remove(note.id);
    await refresh();
  };

  if (route === 'capture') {
    return (
      <CaptureScreen
        onCancel={() => { setRoute('home'); void refresh(); }}
        onStarted={startCaptureDraft}
        onCheckpoint={checkpointCapture}
        onFinished={finishCapture}
      />
    );
  }

  if (route === 'review' && currentMeeting) {
    return (
      <ReviewScreen
        meeting={currentMeeting}
        providers={mockProviders}
        initialReview={currentReview}
        onProgress={saveReviewProgress}
        onDone={saveReview}
      />
    );
  }

  if (route === 'changes' && currentChangeSet) {
    const threadTitle = threads.find((thread) => thread.id === currentChangeSet.threadId)?.title ?? 'Meeting thread';
    return <WhatChangedScreen changeSet={currentChangeSet} threadTitle={threadTitle} onBack={() => setRoute('home')} />;
  }

  if (route === 'decisions') {
    return (
      <DecisionLedgerScreen
        decisions={threadDecisions}
        threadTitle={selectedThread?.title ?? 'Meeting thread'}
        onUpdate={updateDecision}
        onBack={() => setRoute('home')}
      />
    );
  }

  if (route === 'commitments') {
    return (
      <CommitmentRadarScreen
        commitments={threadCommitments}
        threadTitle={selectedThread?.title ?? 'Meeting thread'}
        onUpdate={updateCommitment}
        onBack={() => setRoute('home')}
      />
    );
  }

  if (route === 'assumptions') {
    return (
      <AssumptionRegisterScreen
        assumptions={threadAssumptions}
        threadTitle={selectedThread?.title ?? 'Meeting thread'}
        onUpdate={updateAssumption}
        onBack={() => setRoute('home')}
      />
    );
  }

  if (route === 'private-notes') {
    return (
      <PrivateSidecarScreen
        notes={threadPrivateNotes}
        threadTitle={selectedThread?.title ?? 'Meeting thread'}
        onCreate={createPrivateNote}
        onPromote={promoteNote}
        onReturnPrivate={makeNotePrivate}
        onDelete={deletePrivateNote}
        onBack={() => setRoute('home')}
      />
    );
  }

  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <Header
        eyebrow="CONVOWEAVE"
        title="Your meetings should remember each other."
        body="Capture into a thread, confirm the important memory, and see exactly what changed from one meeting to the next."
      />

      {pendingDraftMeeting ? (
        <View style={styles.draftCard}>
          <Text style={styles.draftLabel}>UNFINISHED CAPTURE</Text>
          <Text style={styles.draftTitle}>{pendingDraftMeeting.title}</Text>
          <Text style={styles.draftBody}>Checkpointed at {Math.round(pendingDraftMeeting.durationMs / 1000)} seconds. {pendingDraftMeeting.audioUri ? 'A local recording reference is available.' : 'No recoverable recording reference is available yet.'}</Text>
          <View style={styles.draftActions}>
            {pendingDraftMeeting.audioUri ? (
              <Pressable style={styles.recoverButton} onPress={() => recoverDraft(pendingDraftMeeting)}>
                <Text style={styles.recoverText}>Review recovered draft</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.discardButton} onPress={() => discardDraft(pendingDraftMeeting)}>
              <Text style={styles.discardText}>Discard draft</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {pendingReviewMeeting ? (
        <Pressable style={styles.resume} onPress={resumeReview}>
          <Text style={styles.resumeLabel}>UNFINISHED REVIEW</Text>
          <Text style={styles.resumeTitle}>Resume {pendingReviewMeeting.title}</Text>
          <Text style={styles.resumeBody}>Your transcript and proposal decisions are saved locally.</Text>
        </Pressable>
      ) : null}

      <Text style={styles.section}>Meeting thread</Text>
      <View style={styles.threadWrap}>
        {threads.map((thread) => (
          <Pressable
            key={thread.id}
            onPress={() => setSelectedThreadId(thread.id)}
            style={[styles.threadChip, selectedThreadId === thread.id && styles.threadChipSelected]}
          >
            <Text style={[styles.threadChipText, selectedThreadId === thread.id && styles.threadChipTextSelected]}>{thread.title}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.newThreadRow}>
        <TextInput
          value={newThreadTitle}
          onChangeText={setNewThreadTitle}
          placeholder="New thread name"
          placeholderTextColor={colors.muted}
          style={styles.newThreadInput}
        />
        <Pressable style={styles.addThreadButton} onPress={createThread}>
          <Text style={styles.addThreadText}>Add</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={!selectedThreadId || Boolean(pendingDraftMeeting)}
        style={[styles.capture, (!selectedThreadId || Boolean(pendingDraftMeeting)) && styles.disabled]}
        onPress={() => { setCurrentMeeting(null); setRoute('capture'); }}
      >
        <View style={styles.captureDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.captureTitle}>Start a meeting</Text>
          <Text style={styles.captureBody}>{pendingDraftMeeting ? 'Resolve the unfinished capture first.' : `Recording into ${selectedThread?.title ?? 'your selected thread'}.`}</Text>
        </View>
      </Pressable>

      <View style={styles.metrics}>
        <Metric value={counts.decisions} label="active decisions" />
        <Metric value={counts.commitments} label="open commitments" />
        <Metric value={counts.assumptions} label="assumptions" />
      </View>

      <FeatureLink
        title="Decision Ledger"
        body="Review active, disputed, reversed, and superseded decisions with source proof."
        onPress={() => setRoute('decisions')}
      />
      <FeatureLink
        title="Commitment Radar"
        body="See promises that are open, due soon, overdue, completed, or cancelled."
        onPress={() => setRoute('commitments')}
      />
      <FeatureLink
        title="Assumption Register"
        body="Keep unverified beliefs visible until they are supported, disproven, or expired."
        onPress={() => setRoute('assumptions')}
      />
      <FeatureLink
        title="Private Sidecar"
        body={`${threadPrivateNotes.filter((note) => !note.promotedAt).length} private notes excluded from shared context.`}
        onPress={() => setRoute('private-notes')}
      />

      <Text style={styles.section}>Recent meetings</Text>
      {recentMeetings.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.empty}>No meetings in this thread yet. The first recording will create a durable local draft.</Text>
        </View>
      ) : recentMeetings.map((meeting) => {
        const hasChanges = changeSetByMeeting.has(meeting.id);
        return (
          <View key={meeting.id} style={screenStyles.card}>
            <Text style={styles.meetingTitle}>{meeting.title}</Text>
            <Text style={styles.meetingMeta}>{meeting.status.toUpperCase()} · {Math.round(meeting.durationMs / 1000)} sec</Text>
            <Text style={styles.meetingMeta}>{new Date(meeting.startedAt).toLocaleString()}</Text>
            {hasChanges ? (
              <Pressable style={styles.changeLink} onPress={() => openChanges(meeting.id)}>
                <Text style={styles.changeLinkText}>View what changed</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <View style={styles.privateNote}>
        <Text style={styles.privateTitle}>Private by design</Text>
        <Text style={styles.privateBody}>Raw audio, saved reviews, and unpromoted Sidecar notes stay outside shared AI context. Provider uploads remain disabled in the current alpha.</Text>
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

function FeatureLink({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  return (
    <Pressable style={styles.featureLink} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
      <Text style={styles.featureArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  draftCard: { backgroundColor: colors.redSoft, borderRadius: 18, padding: 17, marginBottom: 14, borderWidth: 1, borderColor: '#E7BBB7' },
  draftLabel: { color: colors.red, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  draftTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 6 },
  draftBody: { color: colors.ink, lineHeight: 20, marginTop: 5 },
  draftActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  recoverButton: { backgroundColor: colors.forest, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  recoverText: { color: 'white', fontWeight: '800' },
  discardButton: { backgroundColor: colors.paper, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  discardText: { color: colors.red, fontWeight: '800' },
  resume: { backgroundColor: colors.amberSoft, borderRadius: 18, padding: 17, marginBottom: 22, borderWidth: 1, borderColor: '#E7C49F' },
  resumeLabel: { color: colors.amber, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  resumeTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 6 },
  resumeBody: { color: colors.muted, lineHeight: 20, marginTop: 5 },
  section: { color: colors.ink, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  threadWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  threadChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 9, paddingHorizontal: 13 },
  threadChipSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  threadChipText: { color: colors.ink, fontWeight: '700' },
  threadChipTextSelected: { color: 'white' },
  newThreadRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  newThreadInput: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, color: colors.ink },
  addThreadButton: { backgroundColor: colors.forestSoft, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16 },
  addThreadText: { color: colors.forest, fontWeight: '900' },
  capture: { backgroundColor: colors.forest, borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  disabled: { opacity: 0.5 },
  captureDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF' },
  captureTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  captureBody: { color: '#E5F0E9', marginTop: 5, lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metric: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 12 },
  metricValue: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  featureLink: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  featureBody: { color: colors.muted, lineHeight: 19, marginTop: 4 },
  featureArrow: { color: colors.forest, fontSize: 28, marginLeft: 10 },
  empty: { color: colors.muted, lineHeight: 21 },
  meetingTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 7 },
  meetingMeta: { color: colors.muted, lineHeight: 19 },
  changeLink: { alignSelf: 'flex-start', backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11, marginTop: 12 },
  changeLinkText: { color: colors.forest, fontWeight: '800', fontSize: 12 },
  privateNote: { backgroundColor: colors.forestSoft, borderRadius: 18, padding: 18, marginTop: 18 },
  privateTitle: { color: colors.forest, fontWeight: '900', marginBottom: 6 },
  privateBody: { color: colors.ink, lineHeight: 21 },
});
