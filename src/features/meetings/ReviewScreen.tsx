import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { Meeting, MeetingProposal, MeetingReview, Transcript } from '../../models/domain';
import type { ProviderBundle } from '../../services/providers';
import { colors } from '../../theme';

type ReviewScreenProps = {
  meeting: Meeting;
  providers: ProviderBundle;
  initialReview?: MeetingReview | null;
  onProgress: (review: MeetingReview) => Promise<void>;
  onDone: (meeting: Meeting, review: MeetingReview) => Promise<void>;
};

export function ReviewScreen({ meeting, providers, initialReview, onProgress, onDone }: ReviewScreenProps) {
  const [proposals, setProposals] = useState<MeetingProposal[]>(initialReview?.proposals ?? []);
  const [transcript, setTranscript] = useState<Transcript | null>(initialReview?.transcript ?? meeting.transcript ?? null);
  const [loading, setLoading] = useState(!initialReview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialReview) return;
    let mounted = true;

    (async () => {
      try {
        const result = await providers.transcription.transcribe(meeting);
        const extracted = await providers.extraction.extract(meeting, result);
        if (!mounted) return;

        const review: MeetingReview = {
          id: meeting.id,
          meetingId: meeting.id,
          transcript: result,
          proposals: extracted,
          updatedAt: new Date().toISOString(),
        };

        setTranscript(result);
        setProposals(extracted);
        await onProgress(review);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Meeting review could not be prepared.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [initialReview, meeting, providers, onProgress]);

  const persist = (next: MeetingProposal[]) => {
    if (!transcript) return;
    void onProgress({
      id: meeting.id,
      meetingId: meeting.id,
      transcript,
      proposals: next,
      updatedAt: new Date().toISOString(),
    });
  };

  const patch = (id: string, update: Partial<MeetingProposal>) => {
    setProposals((current) => {
      const next = current.map((item) => item.id === id ? { ...item, ...update } : item);
      persist(next);
      return next;
    });
  };

  const finish = async () => {
    if (!transcript) return;
    await onDone(meeting, {
      id: meeting.id,
      meetingId: meeting.id,
      transcript,
      proposals,
      updatedAt: new Date().toISOString(),
    });
  };

  const transcriptText = transcript?.segments.map((segment) => segment.text).join('\n') ?? 'Processing transcript…';

  return (
    <Screen>
      <Header
        eyebrow={initialReview ? 'RESUMED REVIEW' : 'MEETING REVIEW'}
        title="Confirm what matters."
        body="AI suggestions stay proposals until you accept them. Your review state is saved locally as you work."
      />

      <View style={screenStyles.card}>
        <Text style={styles.label}>TRANSCRIPT</Text>
        <Text style={styles.transcript}>{transcriptText}</Text>
      </View>

      <Text style={styles.section}>Proposed memory</Text>
      {loading ? <Text style={styles.muted}>Extracting decisions, commitments, and assumptions…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {proposals.map((proposal) => (
        <View key={proposal.id} style={[screenStyles.card, proposal.state === 'rejected' && styles.rejected]}>
          <View style={styles.row}>
            <Text style={styles.kind}>{proposal.kind.toUpperCase()}</Text>
            <Text style={styles.confidence}>{Math.round(proposal.confidence * 100)}%</Text>
          </View>
          <TextInput
            editable={proposal.state !== 'rejected'}
            multiline
            style={styles.input}
            value={proposal.statement}
            onChangeText={(statement) => patch(proposal.id, { statement })}
          />
          <Text style={styles.evidence}>Source: {proposal.evidence[0]?.quote ?? 'No quote available'}</Text>
          <View style={styles.rowActions}>
            <Pressable style={styles.smallButton} onPress={() => patch(proposal.id, { state: 'accepted' })}>
              <Text style={styles.smallButtonText}>Accept</Text>
            </Pressable>
            <Pressable style={styles.smallButtonLight} onPress={() => patch(proposal.id, { state: 'proposed' })}>
              <Text style={styles.smallButtonLightText}>Keep proposed</Text>
            </Pressable>
            <Pressable style={styles.rejectButton} onPress={() => patch(proposal.id, { state: 'rejected' })}>
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable disabled={loading || !transcript} style={[screenStyles.button, (loading || !transcript) && { opacity: 0.5 }]} onPress={finish}>
        <Text style={screenStyles.buttonText}>Save meeting memory</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: colors.forest, marginBottom: 9 },
  transcript: { color: colors.ink, lineHeight: 22 },
  section: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 10, marginBottom: 12 },
  muted: { color: colors.muted, marginBottom: 12 },
  error: { color: colors.red, marginBottom: 12, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { fontSize: 11, letterSpacing: 1.1, fontWeight: '900', color: colors.forest },
  confidence: { color: colors.muted, fontWeight: '700' },
  input: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.ink, marginTop: 12, padding: 0 },
  evidence: { marginTop: 12, color: colors.muted, fontSize: 13, lineHeight: 18 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  smallButton: { backgroundColor: colors.forest, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },
  smallButtonText: { color: 'white', fontWeight: '800', fontSize: 12 },
  smallButtonLight: { backgroundColor: colors.forestSoft, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },
  smallButtonLightText: { color: colors.forest, fontWeight: '800', fontSize: 12 },
  rejectButton: { backgroundColor: colors.redSoft, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },
  rejectText: { color: colors.red, fontWeight: '800', fontSize: 12 },
  rejected: { opacity: 0.55 },
});
