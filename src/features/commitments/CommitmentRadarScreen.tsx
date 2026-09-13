import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { Commitment } from '../../models/domain';
import { colors } from '../../theme';
import { getCommitmentRisk, sortCommitmentsByAttention } from './commitmentRisk';

export function CommitmentRadarScreen({
  commitments,
  threadTitle,
  onUpdate,
  onBack,
}: {
  commitments: Commitment[];
  threadTitle: string;
  onUpdate: (commitment: Commitment) => Promise<void>;
  onBack: () => void;
}) {
  const ordered = sortCommitmentsByAttention(commitments);
  const openCount = commitments.filter((item) => item.status === 'open').length;
  const riskCount = commitments.filter((item) => {
    const risk = getCommitmentRisk(item);
    return risk === 'overdue' || risk === 'due-soon';
  }).length;

  const patchStatus = async (commitment: Commitment, status: Commitment['status']) => {
    await onUpdate({ ...commitment, status, lastUpdatedAt: new Date().toISOString() });
  };

  return (
    <Screen>
      <Header
        eyebrow="COMMITMENT RADAR"
        title={threadTitle}
        body="Promises survive the meeting where they were made. Overdue and due-soon items rise to the top deterministically."
      />

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{openCount}</Text>
          <Text style={styles.summaryLabel}>open</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, riskCount > 0 && { color: colors.red }]}>{riskCount}</Text>
          <Text style={styles.summaryLabel}>needs attention</Text>
        </View>
      </View>

      {ordered.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No commitments yet.</Text>
          <Text style={styles.body}>Accepted commitments from reviewed meetings will appear here and remain until completed, cancelled, or superseded.</Text>
        </View>
      ) : ordered.map((commitment) => {
        const risk = getCommitmentRisk(commitment);
        const tone = riskTone(risk);
        return (
          <View key={commitment.id} style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: tone.color }]}>
            <View style={styles.row}>
              <Text style={[styles.risk, { color: tone.color }]}>{tone.label}</Text>
              <Text style={styles.status}>{commitment.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.title}>{commitment.statement}</Text>
            <Text style={styles.body}>
              {commitment.ownerId ? `Owner: ${commitment.ownerId}` : 'Owner not confirmed'}
              {commitment.dueAt ? ` · Due ${new Date(commitment.dueAt).toLocaleString()}` : ' · No due date confirmed'}
            </Text>
            <Text style={styles.source}>{commitment.evidence[0]?.quote ? `Source: “${commitment.evidence[0].quote}”` : 'Source evidence retained with commitment'}</Text>

            <View style={styles.actions}>
              {commitment.status === 'open' ? (
                <>
                  <Pressable style={styles.doneButton} onPress={() => patchStatus(commitment, 'done')}>
                    <Text style={styles.doneText}>Complete</Text>
                  </Pressable>
                  <Pressable style={styles.cancelButton} onPress={() => patchStatus(commitment, 'cancelled')}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.reopenButton} onPress={() => patchStatus(commitment, 'open')}>
                  <Text style={styles.reopenText}>Reopen</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to meetings</Text>
      </Pressable>
    </Screen>
  );
}

function riskTone(risk: ReturnType<typeof getCommitmentRisk>) {
  if (risk === 'overdue') return { label: 'OVERDUE', color: colors.red };
  if (risk === 'due-soon') return { label: 'DUE SOON', color: colors.amber };
  if (risk === 'closed') return { label: 'CLOSED', color: colors.muted };
  return { label: 'OPEN', color: colors.forest };
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  summaryItem: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  summaryValue: { color: colors.ink, fontSize: 27, fontWeight: '900' },
  summaryLabel: { color: colors.muted, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  risk: { fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  status: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  source: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 15 },
  doneButton: { backgroundColor: colors.forest, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  doneText: { color: 'white', fontWeight: '800' },
  cancelButton: { backgroundColor: colors.redSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  cancelText: { color: colors.red, fontWeight: '800' },
  reopenButton: { backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  reopenText: { color: colors.forest, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
