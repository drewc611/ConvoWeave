import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { SourceProof } from '../../components/SourceProof';
import type { Contradiction } from '../../models/domain';
import { colors } from '../../theme';

export function ContradictionReviewScreen({
  contradictions,
  threadTitle,
  onUpdate,
  onBack,
}: {
  contradictions: Contradiction[];
  threadTitle: string;
  onUpdate: (contradiction: Contradiction) => Promise<void>;
  onBack: () => void;
}) {
  const ordered = [...contradictions].sort((a, b) => {
    const statusRank = { proposed: 0, resolved: 1, dismissed: 2 } as const;
    return statusRank[a.status] - statusRank[b.status] || b.confidence - a.confidence;
  });

  return (
    <Screen>
      <Header
        eyebrow="CONTRADICTION REVIEW"
        title={threadTitle}
        body="Potential conflicts stay proposals until a person decides what they mean. Both sides of the conflict keep their original source evidence."
      />

      {ordered.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No contradictions waiting for review.</Text>
          <Text style={styles.body}>A contradiction provider may propose conflicts later, but ConvoWeave will not invent one when evidence is insufficient.</Text>
        </View>
      ) : ordered.map((item) => {
        const tone = statusTone(item.status);
        return (
          <View key={item.id} style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: tone.color }]}>
            <View style={styles.row}>
              <Text style={[styles.status, { color: tone.color }]}>{tone.label}</Text>
              <Text style={styles.confidence}>{Math.round(item.confidence * 100)}% confidence</Text>
            </View>
            <Text style={styles.explanation}>{item.explanation}</Text>

            <Text style={styles.sideLabel}>CURRENT EVIDENCE</Text>
            <SourceProof evidence={[item.currentEvidence]} />
            <Text style={styles.sideLabel}>PRIOR EVIDENCE</Text>
            <SourceProof evidence={[item.priorEvidence]} />

            {item.status === 'proposed' ? (
              <View style={styles.actions}>
                <Pressable style={styles.resolveButton} onPress={() => onUpdate({ ...item, status: 'resolved' })}>
                  <Text style={styles.resolveText}>Resolve</Text>
                </Pressable>
                <Pressable style={styles.dismissButton} onPress={() => onUpdate({ ...item, status: 'dismissed' })}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.reopenButton} onPress={() => onUpdate({ ...item, status: 'proposed' })}>
                <Text style={styles.reopenText}>Reopen review</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to meetings</Text>
      </Pressable>
    </Screen>
  );
}

function statusTone(status: Contradiction['status']) {
  if (status === 'resolved') return { label: 'RESOLVED', color: colors.forest };
  if (status === 'dismissed') return { label: 'DISMISSED', color: colors.muted };
  return { label: 'PROPOSED', color: colors.red };
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  status: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  confidence: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  explanation: { color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '800' },
  sideLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 16 },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  resolveButton: { backgroundColor: colors.forest, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  resolveText: { color: 'white', fontWeight: '800' },
  dismissButton: { backgroundColor: colors.redSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  dismissText: { color: colors.red, fontWeight: '800' },
  reopenButton: { alignSelf: 'flex-start', backgroundColor: colors.canvas, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginTop: 16 },
  reopenText: { color: colors.ink, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
