import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { Decision, EvidenceRef, Meeting, MeetingProposal, MeetingReview, ProposalKind, Transcript } from '../../models/domain';
import { colors } from '../../theme';

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function parseOptionalDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function transcriptFor(meeting: Meeting, notes: string): Transcript {
  return {
    meetingId: meeting.id,
    segments: [
      {
        id: `${meeting.id}:manual-notes`,
        meetingId: meeting.id,
        speakerId: 'manual-entry',
        startMs: 0,
        endMs: meeting.durationMs,
        text: notes.trim() || 'Manual structured meeting memory.',
      },
    ],
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

type DraftProposal = MeetingProposal & {
  dueInput?: string;
  reviewInput?: string;
};

type Props = {
  meeting: Meeting;
  initialReview?: MeetingReview | null;
  priorDecisions?: Decision[];
  onProgress: (review: MeetingReview) => Promise<void>;
  onDone: (meeting: Meeting, review: MeetingReview) => Promise<void>;
  onBack: () => void;
};

export function ManualReviewScreen({ meeting, initialReview, priorDecisions = [], onProgress, onDone, onBack }: Props) {
  const initialNotes = initialReview?.transcript.segments.map((segment) => segment.text).join('\n') ?? '';
  const [notes, setNotes] = useState(initialNotes);
  const [proposals, setProposals] = useState<DraftProposal[]>(initialReview?.proposals ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildReview = (nextNotes = notes, nextProposals = proposals): MeetingReview => ({
    id: meeting.id,
    meetingId: meeting.id,
    transcript: transcriptFor(meeting, nextNotes),
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
    const next: DraftProposal[] = [
      ...proposals,
      {
        id: makeId(kind),
        kind,
        statement: '',
        confidence: 1,
        evidence: evidenceFor(meeting, ''),
        state: 'accepted',
      },
    ];
    setProposals(next);
    persist(notes, next);
  };

  const patch = (id: string, update: Partial<DraftProposal>) => {
    const next = proposals.map((proposal) => {
      if (proposal.id !== id) return proposal;
      const updated = { ...proposal, ...update };
      return { ...updated, evidence: evidenceFor(meeting, updated.statement) };
    });
    setProposals(next);
    persist(notes, next);
  };

  const remove = (id: string) => {
    const next = proposals.filter((proposal) => proposal.id !== id);
    setProposals(next);
    persist(notes, next);
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
      const normalized = meaningful.map((proposal) => ({
        ...proposal,
        statement: proposal.statement.trim(),
        evidence: evidenceFor(meeting, proposal.statement),
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

  return (
    <Screen>
      <Header
        eyebrow="REAL MEETING MEMORY"
        title="Save what actually happened."
        body="No fake transcript. Enter or paste the real notes, then capture the decisions, commitments, and assumptions you want ConvoWeave to remember."
      />

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
      <Text style={styles.help}>Anything you add here is treated as user-confirmed memory, not AI-generated output.</Text>

      <View style={styles.addRow}>
        <AddButton label="+ Decision" onPress={() => addProposal('decision')} />
        <AddButton label="+ Commitment" onPress={() => addProposal('commitment')} />
        <AddButton label="+ Assumption" onPress={() => addProposal('assumption')} />
      </View>

      {proposals.map((proposal) => (
        <View key={proposal.id} style={screenStyles.card}>
          <View style={styles.row}>
            <Text style={styles.kind}>{proposal.kind.toUpperCase()}</Text>
            <Pressable onPress={() => remove(proposal.id)}><Text style={styles.remove}>Remove</Text></Pressable>
          </View>

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
              <TextInput
                value={proposal.rationale ?? ''}
                onChangeText={(rationale) => patch(proposal.id, { rationale })}
                placeholder="Why was this decision made? (optional)"
                placeholderTextColor={colors.muted}
                style={styles.metaInput}
              />
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
      <Pressable style={[screenStyles.secondaryButton, { marginTop: 10 }]} onPress={onBack}>
        <Text style={screenStyles.secondaryButtonText}>Back</Text>
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
  error: { color: colors.red, lineHeight: 20, marginBottom: 12 },
});
