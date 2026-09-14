import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { loadRuntimeConfig } from '../../config/runtime';
import type { Decision, EvidenceRef, Meeting, MeetingProposal, MeetingReview, ProposalKind, Transcript } from '../../models/domain';
import type { ProviderBundle } from '../../services/providers';
import {
  buildPreviewRemoteReview,
  canUsePreviewRemoteProcessing,
  describeRemoteProcessingError,
} from '../../services/previewRemoteReview';
import { colors } from '../../theme';

type ReviewScreenProps = {
  meeting: Meeting;
  providers: ProviderBundle;
  initialReview?: MeetingReview | null;
  priorDecisions?: Decision[];
  onProgress: (review: MeetingReview) => Promise<void>;
  onDone: (meeting: Meeting, review: MeetingReview) => Promise<void>;
};

type DraftProposal = MeetingProposal & {
  dueInput?: string;
  reviewInput?: string;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function parseOptionalDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function transcriptFor(meeting: Meeting, text: string): Transcript {
  return {
    meetingId: meeting.id,
    segments: [{
      id: `${meeting.id}:manual-notes`,
      meetingId: meeting.id,
      speakerId: 'manual-entry',
      startMs: 0,
      endMs: meeting.durationMs,
      text: text.trim() || 'Manual structured meeting memory.',
    }],
  };
}

function evidenceFor(meeting: Meeting, statement: string): EvidenceRef[] {
  return [{
    meetingId: meeting.id,
    segmentIds: [`${meeting.id}:manual-notes`],
    speakerId: 'manual-entry',
    startMs: 0,
    endMs: meeting.durationMs,
    quote: statement.trim() || 'Manual entry',
  }];
}

function isManualEvidence(evidence: EvidenceRef[]): boolean {
  return evidence.length === 0 || evidence.every((item) => item.speakerId === 'manual-entry');
}

function hasRemoteEvidence(transcript: Transcript | undefined): transcript is Transcript {
  return Boolean(transcript?.segments.some((segment) => segment.speakerId !== 'manual-entry'));
}

function notesFromTranscript(transcript: Transcript | undefined): string {
  if (!transcript) return '';
  const manual = [...transcript.segments].reverse().find((segment) => segment.speakerId === 'manual-entry');
  if (manual) return manual.text;
  return transcript.segments.map((segment) => segment.text).join('\n');
}

function manualText(notes: string, proposals: DraftProposal[]): string {
  const parts = [notes.trim()];
  for (const proposal of proposals) {
    if (!isManualEvidence(proposal.evidence)) continue;
    const statement = proposal.statement.trim();
    if (statement && !parts.some((part) => part.includes(statement))) parts.push(statement);
  }
  return parts.filter(Boolean).join('\n');
}

export function ReviewScreen({ meeting, providers: _providers, initialReview, priorDecisions = [], onProgress, onDone }: ReviewScreenProps) {
  const runtimeConfig = useMemo(() => {
    try {
      return loadRuntimeConfig();
    } catch {
      return null;
    }
  }, []);
  const remotePreviewEnabled = runtimeConfig?.environment === 'preview' && runtimeConfig.processingMode === 'remote';
  const persistedTranscript = initialReview?.transcript ?? meeting.transcript;
  const [sourceTranscript, setSourceTranscript] = useState<Transcript | null>(hasRemoteEvidence(persistedTranscript) ? persistedTranscript : null);
  const [notes, setNotes] = useState(notesFromTranscript(persistedTranscript) || meeting.captureNotes || '');
  const [proposals, setProposals] = useState<DraftProposal[]>(initialReview?.proposals ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAccessToken, setPreviewAccessToken] = useState('');
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<string | null>(null);

  const transcriptForReview = (nextNotes: string, nextProposals: DraftProposal[]): Transcript => {
    const nextManualText = manualText(nextNotes, nextProposals);
    if (!sourceTranscript) return transcriptFor(meeting, nextManualText);

    const sourceSegments = sourceTranscript.segments.filter((segment) => segment.speakerId !== 'manual-entry');
    const sourceText = sourceSegments.map((segment) => segment.text).join('\n').trim();
    const hasManualProposal = nextProposals.some((proposal) => isManualEvidence(proposal.evidence));
    const needsManualSegment = hasManualProposal || nextNotes.trim() !== sourceText;
    const manualSegment = transcriptFor(meeting, nextManualText).segments[0];
    return {
      meetingId: meeting.id,
      segments: needsManualSegment && manualSegment
        ? [...sourceSegments, manualSegment]
        : sourceSegments,
    };
  };

  const buildReview = (nextNotes = notes, nextProposals = proposals): MeetingReview => ({
    id: meeting.id,
    meetingId: meeting.id,
    transcript: transcriptForReview(nextNotes, nextProposals),
    proposals: nextProposals.map(({ dueInput: _dueInput, reviewInput: _reviewInput, ...proposal }) => proposal),
    updatedAt: new Date().toISOString(),
  });

  const persist = (nextNotes = notes, nextProposals = proposals) => {
    void onProgress(buildReview(nextNotes, nextProposals));
  };

  const changeNotes = (value: string) => {
    setNotes(value);
    persist(value, proposals);
  };

  const addProposal = (kind: ProposalKind) => {
    const next: DraftProposal[] = [...proposals, {
      id: makeId(kind),
      kind,
      statement: '',
      confidence: 1,
      evidence: evidenceFor(meeting, ''),
      state: 'accepted',
    }];
    setProposals(next);
    persist(notes, next);
  };

  const patch = (id: string, update: Partial<DraftProposal>) => {
    const next = proposals.map((proposal) => {
      if (proposal.id !== id) return proposal;
      const updated = { ...proposal, ...update };
      return {
        ...updated,
        evidence: isManualEvidence(proposal.evidence) ? evidenceFor(meeting, updated.statement) : proposal.evidence,
      };
    });
    setProposals(next);
    persist(notes, next);
  };

  const remove = (id: string) => {
    const next = proposals.filter((proposal) => proposal.id !== id);
    setProposals(next);
    persist(notes, next);
  };

  const processRemotely = async () => {
    if (!runtimeConfig) return;
    setRemoteBusy(true);
    setError(null);
    setRemoteStatus('Uploading the approved recording and waiting for the preview backend…');
    try {
      const review = await buildPreviewRemoteReview(runtimeConfig, meeting, previewAccessToken);
      const nextNotes = review.transcript.segments.map((segment) => segment.text).join('\n');
      const nextProposals: DraftProposal[] = review.proposals.map((proposal) => ({ ...proposal }));
      setSourceTranscript(review.transcript);
      setNotes(nextNotes);
      setProposals(nextProposals);
      await onProgress(review);
      setRemoteStatus('Remote draft loaded. Review the transcript and explicitly accept, reject, or edit each proposed memory item.');
    } catch (cause) {
      setError(`${describeRemoteProcessingError(cause)} Manual review is still available below.`);
      setRemoteStatus(null);
    } finally {
      setRemoteBusy(false);
    }
  };

  const finish = async () => {
    const meaningful = proposals.filter((proposal) => proposal.statement.trim());
    if (!notes.trim() && meaningful.length === 0) {
      setError('Add meeting notes or at least one decision, commitment, or assumption.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const normalized: DraftProposal[] = meaningful.map((proposal) => ({
        ...proposal,
        statement: proposal.statement.trim(),
        evidence: isManualEvidence(proposal.evidence) ? evidenceFor(meeting, proposal.statement) : proposal.evidence,
        dueAt: proposal.kind === 'commitment' ? parseOptionalDate(proposal.dueInput ?? '') ?? proposal.dueAt : proposal.dueAt,
        reviewAt: proposal.kind === 'assumption' ? parseOptionalDate(proposal.reviewInput ?? '') ?? proposal.reviewAt : proposal.reviewAt,
      }));
      await onDone(meeting, buildReview(notes, normalized));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Meeting memory could not be saved.');
      setSaving(false);
    }
  };

  const activePriorDecisions = priorDecisions.filter((decision) => decision.status === 'active');
  const canProcessRemotely = runtimeConfig ? canUsePreviewRemoteProcessing(runtimeConfig, meeting, previewAccessToken) : false;

  return (
    <Screen>
      <Header
        eyebrow={initialReview ? 'RESUMED REVIEW' : 'REAL MEETING MEMORY'}
        title="Save what actually happened."
        body={remotePreviewEnabled
          ? 'Manual review remains available. Preview remote processing runs only after you explicitly approve this meeting upload, and every generated item still requires human review.'
          : 'Enter or paste the real notes, then capture the decisions, commitments, and assumptions you want ConvoWeave to remember.'}
      />

      {remotePreviewEnabled ? (
        <View style={[screenStyles.card, styles.remoteCard]}>
          <Text style={styles.label}>PREVIEW REMOTE PROCESSING</Text>
          <Text style={styles.remoteBody}>Nothing leaves this device until you press the approval button below. The access token is held in memory only and is not saved with the meeting.</Text>
          <TextInput
            value={previewAccessToken}
            onChangeText={setPreviewAccessToken}
            placeholder="Preview access token"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.metaInput}
          />
          {!meeting.audioUri ? <Text style={styles.error}>No local recording is available for remote processing.</Text> : null}
          <Pressable
            disabled={!canProcessRemotely || remoteBusy}
            style={[screenStyles.button, (!canProcessRemotely || remoteBusy) && styles.disabledButton]}
            onPress={processRemotely}
          >
            <Text style={screenStyles.buttonText}>{remoteBusy ? 'Processing…' : 'Approve audio upload & process'}</Text>
          </Pressable>
          {remoteStatus ? <Text style={styles.remoteStatus}>{remoteStatus}</Text> : null}
        </View>
      ) : null}

      <View style={screenStyles.card}>
        <Text style={styles.label}>MEETING NOTES</Text>
        <TextInput
          multiline
          value={notes}
          onChangeText={changeNotes}
          placeholder="Paste notes, a transcript, or a concise meeting recap here…"
          placeholderTextColor={colors.muted}
          style={styles.notesInput}
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.section}>Structured memory</Text>
      <Text style={styles.help}>Manual items are immediately accepted. Remote items arrive as proposed and must be explicitly accepted before they become durable thread memory.</Text>

      <View style={styles.addRow}>
        <AddButton label="+ Decision" onPress={() => addProposal('decision')} />
        <AddButton label="+ Commitment" onPress={() => addProposal('commitment')} />
        <AddButton label="+ Assumption" onPress={() => addProposal('assumption')} />
      </View>

      {proposals.map((proposal) => (
        <View key={proposal.id} style={screenStyles.card}>
          <View style={styles.row}>
            <Text style={styles.kind}>{proposal.kind.toUpperCase()} · {proposal.state.toUpperCase()}</Text>
            <Pressable onPress={() => remove(proposal.id)}><Text style={styles.remove}>Remove</Text></Pressable>
          </View>

          {proposal.state !== 'accepted' ? (
            <View style={styles.stateRow}>
              <Pressable style={styles.acceptButton} onPress={() => patch(proposal.id, { state: 'accepted' })}><Text style={styles.acceptText}>Accept</Text></Pressable>
              <Pressable style={styles.rejectButton} onPress={() => patch(proposal.id, { state: 'rejected' })}><Text style={styles.rejectText}>Reject</Text></Pressable>
            </View>
          ) : (
            <Pressable style={styles.proposedButton} onPress={() => patch(proposal.id, { state: 'proposed' })}><Text style={styles.proposedText}>Return to proposed</Text></Pressable>
          )}

          <TextInput
            multiline
            value={proposal.statement}
            onChangeText={(statement) => patch(proposal.id, { statement })}
            placeholder={proposal.kind === 'decision' ? 'What was decided?' : proposal.kind === 'commitment' ? 'What was promised?' : 'What assumption needs to remain visible?'}
            placeholderTextColor={colors.muted}
            style={styles.statementInput}
          />

          {proposal.kind === 'decision' ? (
            <>
              <TextInput value={proposal.rationale ?? ''} onChangeText={(rationale) => patch(proposal.id, { rationale })} placeholder="Why was this decision made? (optional)" placeholderTextColor={colors.muted} style={styles.metaInput} />
              {activePriorDecisions.length > 0 ? (
                <View style={styles.supersedeBlock}>
                  <Text style={styles.label}>REPLACES AN EARLIER DECISION?</Text>
                  <Pressable style={[styles.option, !proposal.supersedesDecisionId && styles.optionSelected]} onPress={() => patch(proposal.id, { supersedesDecisionId: undefined })}>
                    <Text style={styles.optionText}>No. Keep as a separate decision.</Text>
                  </Pressable>
                  {activePriorDecisions.map((decision) => (
                    <Pressable key={decision.id} style={[styles.option, proposal.supersedesDecisionId === decision.id && styles.optionSelected]} onPress={() => patch(proposal.id, { supersedesDecisionId: decision.id })}>
                      <Text style={styles.optionText}>{decision.statement}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          {proposal.kind === 'commitment' ? (
            <>
              <TextInput value={proposal.ownerId ?? ''} onChangeText={(ownerId) => patch(proposal.id, { ownerId })} placeholder="Owner (optional)" placeholderTextColor={colors.muted} style={styles.metaInput} />
              <TextInput value={proposal.dueInput ?? proposal.dueAt ?? ''} onChangeText={(dueInput) => patch(proposal.id, { dueInput })} placeholder="Due date/time, e.g. 2026-09-18 17:00 (optional)" placeholderTextColor={colors.muted} style={styles.metaInput} />
            </>
          ) : null}

          {proposal.kind === 'assumption' ? (
            <TextInput value={proposal.reviewInput ?? proposal.reviewAt ?? ''} onChangeText={(reviewInput) => patch(proposal.id, { reviewInput })} placeholder="Review date, e.g. 2026-09-20 (optional)" placeholderTextColor={colors.muted} style={styles.metaInput} />
          ) : null}
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable disabled={saving} style={[screenStyles.button, saving && { opacity: 0.5 }]} onPress={finish}>
        <Text style={screenStyles.buttonText}>{saving ? 'Saving…' : 'Save meeting memory'}</Text>
      </Pressable>
    </Screen>
  );
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={styles.addButton} onPress={onPress}><Text style={styles.addButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  label: { color: colors.forest, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginBottom: 9 },
  notesInput: { minHeight: 160, color: colors.ink, fontSize: 16, lineHeight: 23, padding: 0 },
  section: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 6, marginBottom: 4 },
  help: { color: colors.muted, lineHeight: 20, marginBottom: 12 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  addButton: { backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  addButtonText: { color: colors.forest, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { color: colors.forest, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  remove: { color: colors.red, fontWeight: '700', fontSize: 12 },
  statementInput: { color: colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '700', marginTop: 12, padding: 0 },
  metaInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 11, color: colors.ink, marginTop: 10 },
  supersedeBlock: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.line },
  option: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 10, marginTop: 7 },
  optionSelected: { backgroundColor: colors.forestSoft, borderColor: colors.forest },
  optionText: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  error: { color: colors.red, lineHeight: 20, marginBottom: 12, marginTop: 8 },
  remoteCard: { borderColor: colors.forest, borderWidth: 1 },
  remoteBody: { color: colors.muted, lineHeight: 20 },
  remoteStatus: { color: colors.forest, lineHeight: 20, marginTop: 10, fontWeight: '700' },
  disabledButton: { opacity: 0.45 },
  stateRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptButton: { backgroundColor: colors.forestSoft, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 11 },
  acceptText: { color: colors.forest, fontWeight: '800' },
  rejectButton: { backgroundColor: '#FCE8E6', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 11 },
  rejectText: { color: colors.red, fontWeight: '800' },
  proposedButton: { alignSelf: 'flex-start', marginTop: 10 },
  proposedText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
});
