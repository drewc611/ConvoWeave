import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { SourceProof } from '../../components/SourceProof';
import { colors } from '../../theme';
import type { DecisionImpact } from './decisionImpact';

export function DecisionImpactScreen({
  impacts,
  threadTitle,
  onBack,
}: {
  impacts: DecisionImpact[];
  threadTitle: string;
  onBack: () => void;
}) {
  return (
    <Screen>
      <Header
        eyebrow="DECISION IMPACT ALERTS"
        title={threadTitle}
        body="Only work you explicitly linked to a decision appears here. A changed decision never silently changes dependent work."
      />

      {impacts.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No decision impacts need review.</Text>
          <Text style={styles.body}>Link open commitments, assumptions, or questions to decisions. If a linked decision is later superseded, reversed, or disputed, affected work will appear here.</Text>
        </View>
      ) : impacts.map((impact) => (
        <View key={impact.id} style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: statusColor(impact.decisionStatus) }]}>
          <View style={styles.row}>
            <Text style={styles.kind}>{impact.kind.toUpperCase()} IMPACT</Text>
            <Text style={[styles.status, { color: statusColor(impact.decisionStatus) }]}>{impact.decisionStatus.toUpperCase()}</Text>
          </View>

          <Text style={styles.title}>{impact.itemStatement}</Text>
          <Text style={styles.sectionLabel}>DEPENDENT WORK SOURCE</Text>
          <SourceProof evidence={impact.itemEvidence} compact />

          <View style={styles.decisionBlock}>
            <Text style={styles.sectionLabel}>CHANGED DECISION</Text>
            <Text style={styles.decisionTitle}>{impact.decisionStatement}</Text>
            <SourceProof evidence={impact.decisionEvidence} compact />
          </View>
        </View>
      ))}

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to meetings</Text>
      </Pressable>
    </Screen>
  );
}

function statusColor(status: DecisionImpact['decisionStatus']) {
  if (status === 'reversed') return colors.red;
  if (status === 'disputed') return colors.amber;
  return colors.muted;
}

const styles = StyleSheet.create({
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
  body: { color: colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  kind: { color: colors.plum, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  status: { fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  sectionLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.05, marginTop: 12, marginBottom: 3 },
  decisionBlock: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  decisionTitle: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '800' },
});
