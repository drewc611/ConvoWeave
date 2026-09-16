import { useEffect, useMemo, useState } from 'react';
import { AssumptionRegisterScreen } from './features/assumptions/AssumptionRegisterScreen';
import { CommitmentRadarScreen } from './features/commitments/CommitmentRadarScreen';
import { contradictionFromProposal } from './features/contradictions/contradictionProposal';
import { ContradictionReviewScreen } from './features/contradictions/ContradictionReviewScreen';
import { buildDecisionDiff, type ThreadState } from './features/decisions/decisionDiff';
import { buildDecisionImpacts } from './features/decisions/decisionImpact';
import { DecisionImpactScreen } from './features/decisions/DecisionImpactScreen';
import { DecisionLedgerScreen } from './features/decisions/DecisionLedgerScreen';
import { supersedeDecision } from './features/decisions/decisionLineage';
import { WhatChangedScreen } from './features/decisions/WhatChangedScreen';
import { CaptureScreen } from './features/meetings/CaptureScreen';
import { ReviewScreen } from './features/meetings/ReviewScreen';
import { PrivateSidecarScreen } from './features/private-notes/PrivateSidecarScreen';
import { promotePrivateNote, returnPrivateNoteToSidecar } from './features/private-notes/privateContext';
import { OpenQuestionsScreen } from './features/questions/OpenQuestionsScreen';
import { MeetingWorkspaceScreen } from './features/suite/MeetingWorkspaceScreen';
import { SuiteHomeScreen } from './features/suite/SuiteHomeScreen';
import type {
  Assumption,
  Commitment,
  Contradiction,
  Decision,
  Meeting,
  MeetingChangeSet,
  MeetingReview,
  PrivateNote,
  Question,
  Thread,
} from './models/domain';
import { mockProviders } from './services/mockProviders';
import {
  AssumptionRepository,
  CommitmentRepository,
  ContradictionRepository,
  DecisionRepository,
  MeetingChangeSetRepository,
  MeetingRepository,
  MeetingReviewRepository,
  PrivateNoteRepository,
  QuestionRepository,
  ThreadRepository,
} from './storage/repositories';

type Route = 'home' | 'capture' | 'review' | 'workspace' | 'changes' | 'decisions' | 'impacts' | 'commitments' | 'assumptions' | 'questions' | 'contradictions' | 'private-notes';

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
    questions: new QuestionRepository(),
    contradictions: new ContradictionRepository(),
    privateNotes: new PrivateNoteRepository(),
  }), []);

  const [route, setRoute] = useState<Route>('home');
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [workspaceMeeting, setWorkspaceMeeting] = useState<Meeting | null>(null);
  const [currentReview, setCurrentReview] = useState<MeetingReview | null>(null);
  const [currentChangeSet, setCurrentChangeSet] = useState<MeetingChangeSet | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>([]);
  const [changeSets, setChangeSets] = useState<MeetingChangeSet[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [pendingDraftMeeting, setPendingDraftMeeting] = useState<Meeting | null>(null);
  const [pendingReviewMeeting, setPendingReviewMeeting] = useState<Meeting | null>(null);
  const [pendingReview, setPendingReview] = useState<MeetingReview | null>(null);

  const refresh = async () => {
    let [nextMeetings, nextDecisions, nextCommitments, nextAssumptions, nextQuestions, nextContradictions, nextPrivateNotes, nextThreads, nextChangeSets] = await Promise.all([
      repositories.meetings.list(),
      repositories.decisions.list(),
      repositories.commitments.list(),
      repositories.assumptions.list(),
      repositories.questions.list(),
      repositories.contradictions.list(),
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
    setQuestions(nextQuestions);
    setContradictions(nextContradictions);
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
  const threadQuestions = questions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadContradictions = contradictions.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadPrivateNotes = privateNotes.filter((item) => !selectedThreadId || item.threadId === selectedThreadId);
  const threadDecisionImpacts = buildDecisionImpacts(threadDecisions, threadCommitments, threadAssumptions, threadQuestions);

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

  const startCaptureDraft = async (audioUri: string | undefined, captureNotes: string) => {
    const now = new Date();
    const normalizedNotes = captureNotes.trim();
    const draft: Meeting = {
      id: makeId('meeting'),
      threadId: selectedThreadId ?? undefined,
      title: `Meeting · ${now.toLocaleDateString()}`,
      startedAt: now.toISOString(),
      durationMs: 0,
      audioUri,
      captureNotes: normalizedNotes || undefined,
      status: 'draft',
    };
    await repositories.meetings.upsert(draft);
    setCurrentMeeting(draft);
    setPendingDraftMeeting(draft);
  };

  const checkpointCapture = async (audioUri: string | undefined, durationMs: number, captureNotes: string) => {
    if (!currentMeeting || currentMeeting.status !== 'draft') return;
    const normalizedNotes = captureNotes.trim();
    const updated: Meeting = {
      ...currentMeeting,
      durationMs,
      audioUri: audioUri ?? currentMeeting.audioUri,
      captureNotes: normalizedNotes || undefined,
    };
    await repositories.meetings.upsert(updated);
    setCurrentMeeting(updated);
    setPendingDraftMeeting(updated);
  };

  const finishCapture = async (audioUri: string | undefined, durationMs: number, captureNotes: string) => {
    const now = new Date();
    const normalizedNotes = captureNotes.trim();
    const base: Meeting = currentMeeting?.status === 'draft'
      ? currentMeeting
      : {
          id: makeId('meeting'),
          threadId: selectedThreadId ?? undefined,
          title: `Meeting · ${now.toLocaleDateString()}`,
          startedAt: new Date(now.getTime() - durationMs).toISOString(),
          durationMs: 0,
          status: 'draft',
        };
    const meeting: Meeting = {
      ...base,
      endedAt: now.toISOString(),
      durationMs,
      audioUri: audioUri ?? base.audioUri,
      captureNotes: normalizedNotes || base.captureNotes,
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
    const recovered: Meeting = { ...draft, endedAt: draft.endedAt ?? new Date().toISOString(), status: 'review' };
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
        const replacement: Decision = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          rationale: proposal.rationale,
          ownerId: proposal.ownerId,
          status: 'active',
          evidence: proposal.evidence,
          createdAt: now,
          supersedesDecisionId: proposal.supersedesDecisionId,
        };
        if (proposal.supersedesDecisionId) {
          const priorDecision = await repositories.decisions.get(proposal.supersedesDecisionId);
          if (!priorDecision) throw new Error('The decision selected for replacement could not be found. Review the meeting before saving again.');
          const lineage = supersedeDecision(priorDecision, replacement);
          await repositories.decisions.upsert(lineage.prior);
          await repositories.decisions.upsert(lineage.replacement);
        } else {
          await repositories.decisions.upsert(replacement);
        }
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
      if (proposal.kind === 'question') {
        const question: Question = {
          id: proposal.id,
          threadId,
          statement: proposal.statement,
          status: 'open',
          evidence: proposal.evidence,
          createdAt: now,
        };
        await repositories.questions.upsert(question);
      }
      if (proposal.kind === 'contradiction') {
        const contradiction = contradictionFromProposal(proposal, threadId);
        if (contradiction) await repositories.contradictions.upsert(contradiction);
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
    await repositories.meetings.upsert({ ...meeting, threadId, transcript: review.transcript, captureNotes: undefined, status: 'complete' });
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
    const existing = changeSets.find((item) => item.meetingId === meetingId) ?? await repositories.changes.get(meetingId);
    if (!existing) return;
    setCurrentChangeSet(existing);
    setSelectedThreadId(existing.threadId);
    setRoute('changes');
  };

  const openMeetingWorkspace = (meeting: Meeting) => {
    setWorkspaceMeeting(meeting);
    if (meeting.threadId) setSelectedThreadId(meeting.threadId);
    setRoute('workspace');
  };

  const updateDecision = async (decision: Decision) => { await repositories.decisions.upsert(decision); await refresh(); };
  const updateCommitment = async (commitment: Commitment) => { await repositories.commitments.upsert(commitment); await refresh(); };
  const updateAssumption = async (assumption: Assumption) => { await repositories.assumptions.upsert(assumption); await refresh(); };
  const updateQuestion = async (question: Question) => { await repositories.questions.upsert(question); await refresh(); };
  const updateContradiction = async (contradiction: Contradiction) => { await repositories.contradictions.upsert(contradiction); await refresh(); };

  const createPrivateNote = async (body: string) => {
    if (!selectedThreadId) return;
    const now = new Date().toISOString();
    const note: PrivateNote = { id: makeId('private-note'), threadId: selectedThreadId, body, createdAt: now, updatedAt: now };
    await repositories.privateNotes.upsert(note);
    await refresh();
  };
  const promoteNote = async (note: PrivateNote) => { await repositories.privateNotes.upsert(promotePrivateNote(note)); await refresh(); };
  const makeNotePrivate = async (note: PrivateNote) => { await repositories.privateNotes.upsert(returnPrivateNoteToSidecar(note)); await refresh(); };
  const deletePrivateNote = async (note: PrivateNote) => { await repositories.privateNotes.remove(note.id); await refresh(); };

  if (route === 'capture') {
    return <CaptureScreen threadTitle={selectedThread?.title ?? 'Meeting thread'} onCancel={() => { setRoute('home'); void refresh(); }} onStarted={startCaptureDraft} onCheckpoint={checkpointCapture} onFinished={finishCapture} />;
  }
  if (route === 'review' && currentMeeting) {
    return <ReviewScreen meeting={currentMeeting} providers={mockProviders} initialReview={currentReview} priorDecisions={threadDecisions} onProgress={saveReviewProgress} onDone={saveReview} />;
  }
  if (route === 'workspace' && workspaceMeeting) {
    const workspaceThreadId = workspaceMeeting.threadId ?? selectedThreadId;
    const workspaceThreadTitle = threads.find((thread) => thread.id === workspaceThreadId)?.title ?? 'Meeting thread';
    const workspaceChangeSet = changeSets.find((item) => item.meetingId === workspaceMeeting.id);
    return (
      <MeetingWorkspaceScreen
        meeting={workspaceMeeting}
        threadTitle={workspaceThreadTitle}
        decisions={decisions.filter((item) => !workspaceThreadId || item.threadId === workspaceThreadId)}
        commitments={commitments.filter((item) => !workspaceThreadId || item.threadId === workspaceThreadId)}
        assumptions={assumptions.filter((item) => !workspaceThreadId || item.threadId === workspaceThreadId)}
        contradictions={contradictions.filter((item) => !workspaceThreadId || item.threadId === workspaceThreadId)}
        changeSet={workspaceChangeSet}
        onBack={() => setRoute('home')}
        onOpenChanges={() => { void openChanges(workspaceMeeting.id); }}
        onOpenDecisions={() => setRoute('decisions')}
        onOpenCommitments={() => setRoute('commitments')}
        onOpenAssumptions={() => setRoute('assumptions')}
        onOpenContradictions={() => setRoute('contradictions')}
      />
    );
  }
  if (route === 'changes' && currentChangeSet) {
    const threadTitle = threads.find((thread) => thread.id === currentChangeSet.threadId)?.title ?? 'Meeting thread';
    return <WhatChangedScreen changeSet={currentChangeSet} threadTitle={threadTitle} onBack={() => setRoute('home')} />;
  }
  if (route === 'decisions') return <DecisionLedgerScreen decisions={threadDecisions} threadTitle={selectedThread?.title ?? 'Meeting thread'} onUpdate={updateDecision} onBack={() => setRoute('home')} />;
  if (route === 'impacts') return <DecisionImpactScreen impacts={threadDecisionImpacts} threadTitle={selectedThread?.title ?? 'Meeting thread'} onBack={() => setRoute('home')} />;
  if (route === 'commitments') return <CommitmentRadarScreen commitments={threadCommitments} decisions={threadDecisions} threadTitle={selectedThread?.title ?? 'Meeting thread'} onUpdate={updateCommitment} onBack={() => setRoute('home')} />;
  if (route === 'assumptions') return <AssumptionRegisterScreen assumptions={threadAssumptions} decisions={threadDecisions} threadTitle={selectedThread?.title ?? 'Meeting thread'} onUpdate={updateAssumption} onBack={() => setRoute('home')} />;
  if (route === 'questions') return <OpenQuestionsScreen questions={threadQuestions} decisions={threadDecisions} threadTitle={selectedThread?.title ?? 'Meeting thread'} onUpdate={updateQuestion} onBack={() => setRoute('home')} />;
  if (route === 'contradictions') return <ContradictionReviewScreen contradictions={threadContradictions} threadTitle={selectedThread?.title ?? 'Meeting thread'} onUpdate={updateContradiction} onBack={() => setRoute('home')} />;
  if (route === 'private-notes') return <PrivateSidecarScreen notes={threadPrivateNotes} threadTitle={selectedThread?.title ?? 'Meeting thread'} onCreate={createPrivateNote} onPromote={promoteNote} onReturnPrivate={makeNotePrivate} onDelete={deletePrivateNote} onBack={() => setRoute('home')} />;

  return (
    <SuiteHomeScreen
      threads={threads}
      selectedThreadId={selectedThreadId}
      newThreadTitle={newThreadTitle}
      meetings={meetings}
      decisions={decisions}
      commitments={commitments}
      assumptions={assumptions}
      questions={questions}
      contradictions={contradictions}
      privateNotes={privateNotes}
      changeSets={changeSets}
      decisionImpacts={threadDecisionImpacts}
      pendingDraftMeeting={pendingDraftMeeting}
      pendingReviewMeeting={pendingReviewMeeting}
      onSelectThread={setSelectedThreadId}
      onChangeNewThreadTitle={setNewThreadTitle}
      onCreateThread={() => { void createThread(); }}
      onStartCapture={() => { setCurrentMeeting(null); setRoute('capture'); }}
      onRecoverDraft={(meeting) => { void recoverDraft(meeting); }}
      onDiscardDraft={(meeting) => { void discardDraft(meeting); }}
      onResumeReview={() => { void resumeReview(); }}
      onOpenMeeting={openMeetingWorkspace}
      onOpenChanges={(meetingId) => { void openChanges(meetingId); }}
      onOpenDecisions={() => setRoute('decisions')}
      onOpenDecisionImpacts={() => setRoute('impacts')}
      onOpenCommitments={() => setRoute('commitments')}
      onOpenAssumptions={() => setRoute('assumptions')}
      onOpenQuestions={() => setRoute('questions')}
      onOpenContradictions={() => setRoute('contradictions')}
      onOpenPrivateNotes={() => setRoute('private-notes')}
    />
  );
}
