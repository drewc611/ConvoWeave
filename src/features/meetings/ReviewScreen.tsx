import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { Meeting, MeetingProposal } from '../../models/domain';
import type { ProviderBundle } from '../../services/providers';
import { colors } from '../../theme';

export function ReviewScreen({ meeting, providers, onDone }: { meeting: Meeting; providers: ProviderBundle; onDone: (meeting: Meeting, proposals: MeetingProposal[]) => Promise<void> }) {
  const [proposals, setProposals] = useState<MeetingProposal[]>([]);
  const [transcript, setTranscript] = useState('Processing transcript…');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await providers.transcription.transcribe(meeting);
      const extracted = await providers.extraction.extract(meeting, result);
      if (!mounted) return;
      setTranscript(result.segments.map((segment) => segment.text).join('\n'));
      setProposals(extracted);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [meeting, providers]);

  const patch = (id: string, update: Partial<MeetingProposal>) => {
    setProposals((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  };

  return (
    <Screen>
      <Header eyebrow="MEETING REVIEW" title="Confirm what matters." body="AI suggestions stay proposals until you accept them. Evidence remains attached to every important claim." />

      <View style={screenStyles.card}>
        <Text style={styles.label}>TRANSCRIPT</Text>
        <Text style={styles.transcript}>{transcript}</Text>
      </View>

      <Text style={styles.section}>Proposed memory</Text>
      {loading ? <Text style={styles.muted}>Extracting decisions, commitments, and assumptions…</Text> : null}
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
            <Pressable style={styles.smallButton} onPress={() => patch(proposal.id, { state: 'accepted' })}><Text style={styles.smallButtonText}>Accept</Text></Pressable>
            <Pressable style={styles.smallButtonLight} onPress={() => patch(proposal.id, { state: 'proposed' })}><Text style={styles.smallButtonLightText}>Keep proposed</Text></Pressable>
            <Pressable style={styles.rejectButton} onPress={() => patch(proposal.id, { state: 'rejected' })}><Text style={styles.rejectText}>Reject</Text></Pressable>
          </View>
        </View>
      ))}

      <Pressable disabled={loading} style={[screenStyles.button, loading && { opacity: 0.5 }]} onPress={() => onDone(meeting, proposals)}>
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
