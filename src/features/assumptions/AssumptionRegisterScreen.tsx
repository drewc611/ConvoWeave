import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { SourceProof } from '../../components/SourceProof';
import type { Assumption, Decision } from '../../models/domain';
import { colors } from '../../theme';
import { DecisionDependencyEditor } from '../decisions/DecisionDependencyEditor';

export function AssumptionRegisterScreen({
  assumptions,
  decisions,
  threadTitle,
  onUpdate,
  onBack,
}: {
  assumptions: Assumption[];
  decisions: Decision[];
  threadTitle: string;
  onUpdate: (assumption: Assumption) => Promise<void>;
  onBack: () => void;
}) {
  const transition = async (assumption: Assumption, status: Assumption['status']) => {
    await onUpdate({ ...assumption, status });
  };

  return (
    <Screen>
      <Header
        eyebrow="ASSUMPTION REGISTER"
        title={threadTitle}
        body="Keep unverified beliefs separate from facts and decisions. An assumption stays visible until it is supported, disproven, or expired."
      />

      {assumptions.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No assumptions tracked yet.</Text>
          <Text style={styles.body}>Accepted assumptions from reviewed meetings will appear here with their evidence and review state.</Text>
        </View>
      ) : assumptions.map((assumption) => {
        const tone = statusTone(assumption.status);
        return (
          <View key={assumption.id} style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: tone.color }]}>
            <View style={styles.row}>
              <Text style={[styles.status, { color: tone.color }]}>{tone.label}</Text>
              {assumption.reviewAt ? <Text style={styles.review}>Review {new Date(assumption.reviewAt).toLocaleDateString()}</Text> : null}
            </View>
            <Text style={styles.title}>{assumption.statement}</Text>
            <SourceProof evidence={assumption.evidence} compact />

            {assumption.status === 'untested' ? (
              <DecisionDependencyEditor
                decisions={decisions}
                selectedDecisionIds={assumption.dependsOnDecisionIds}
                onChange={(dependsOnDecisionIds) => { void onUpdate({ ...assumption, dependsOnDecisionIds }); }}
              />
            ) : null}

            <View style={styles.actions}>
              <Pressable style={styles.supportButton} onPress={() => transition(assumption, 'supported')}>
                <Text style={styles.supportText}>Supported</Text>
              </Pressable>
              <Pressable style={styles.disproveButton} onPress={() => transition(assumption, 'disproven')}>
                <Text style={styles.disproveText}>Disproven</Text>
              </Pressable>
              <Pressable style={styles.expireButton} onPress={() => transition(assumption, 'expired')}>
                <Text style={styles.expireText}>Expire</Text>
              </Pressable>
              {assumption.status !== 'untested' ? (
                <Pressable style={styles.resetButton} onPress={() => transition(assumption, 'untested')}>
                  <Text style={styles.resetText}>Reopen</Text>
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

function statusTone(status: Assumption['status']) {
  if (status === 'supported') return { label: 'SUPPORTED', color: colors.forest };
  if (status === 'disproven') return { label: 'DISPROVEN', color: colors.red };
  if (status === 'expired') return { label: 'EXPIRED', color: colors.muted };
  return { label: 'UNTESTED', color: colors.plum };
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  status: { fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  review: { color: colors.muted, fontSize: 12 },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  supportButton: { backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  supportText: { color: colors.forest, fontWeight: '800' },
  disproveButton: { backgroundColor: colors.redSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  disproveText: { color: colors.red, fontWeight: '800' },
  expireButton: { backgroundColor: colors.canvas, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  expireText: { color: colors.muted, fontWeight: '800' },
  resetButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  resetText: { color: colors.ink, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
