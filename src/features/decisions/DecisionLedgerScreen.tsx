import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { SourceProof } from '../../components/SourceProof';
import type { Decision } from '../../models/domain';
import { colors } from '../../theme';
import { disputeDecision, restoreDecision, reverseDecision } from './decisionLineage';

export function DecisionLedgerScreen({
  decisions,
  threadTitle,
  onUpdate,
  onBack,
}: {
  decisions: Decision[];
  threadTitle: string;
  onUpdate: (decision: Decision) => Promise<void>;
  onBack: () => void;
}) {
  const ordered = [...decisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <Header
        eyebrow="DECISION LEDGER"
        title={threadTitle}
        body="Decisions are durable, versioned records. Reversal and dispute change status without erasing what was previously agreed."
      />

      {ordered.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No decisions yet.</Text>
          <Text style={styles.body}>Accepted decisions from reviewed meetings will appear here with rationale and source evidence.</Text>
        </View>
      ) : ordered.map((decision) => {
        const tone = statusTone(decision.status);
        return (
          <View key={decision.id} style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: tone.color }]}>
            <View style={styles.row}>
              <Text style={[styles.status, { color: tone.color }]}>{tone.label}</Text>
              <Text style={styles.date}>{new Date(decision.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={styles.title}>{decision.statement}</Text>
            {decision.rationale ? <Text style={styles.body}>Why: {decision.rationale}</Text> : null}
            {decision.ownerId ? <Text style={styles.body}>Owner: {decision.ownerId}</Text> : null}
            {decision.supersedesDecisionId ? <Text style={styles.lineage}>Supersedes {decision.supersedesDecisionId}</Text> : null}
            {decision.supersededByDecisionId ? <Text style={styles.lineage}>Superseded by {decision.supersededByDecisionId}</Text> : null}
            <SourceProof evidence={decision.evidence} />

            <View style={styles.actions}>
              {decision.status === 'active' ? (
                <>
                  <Pressable style={styles.disputeButton} onPress={() => onUpdate(disputeDecision(decision))}>
                    <Text style={styles.disputeText}>Mark disputed</Text>
                  </Pressable>
                  <Pressable style={styles.reverseButton} onPress={() => onUpdate(reverseDecision(decision))}>
                    <Text style={styles.reverseText}>Reverse</Text>
                  </Pressable>
                </>
              ) : decision.status !== 'superseded' ? (
                <Pressable style={styles.restoreButton} onPress={() => onUpdate(restoreDecision(decision))}>
                  <Text style={styles.restoreText}>Restore active</Text>
                </Pressable>
              ) : null}
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

function statusTone(status: Decision['status']) {
  if (status === 'active') return { label: 'ACTIVE', color: colors.forest };
  if (status === 'superseded') return { label: 'SUPERSEDED', color: colors.muted };
  if (status === 'reversed') return { label: 'REVERSED', color: colors.red };
  return { label: 'DISPUTED', color: colors.amber };
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  status: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  date: { color: colors.muted, fontSize: 11, flexShrink: 1, textAlign: 'right' },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  lineage: { color: colors.plum, fontSize: 12, fontWeight: '700', marginTop: 7 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  disputeButton: { backgroundColor: colors.amberSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  disputeText: { color: colors.amber, fontWeight: '800' },
  reverseButton: { backgroundColor: colors.redSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  reverseText: { color: colors.red, fontWeight: '800' },
  restoreButton: { backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  restoreText: { color: colors.forest, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
