import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Decision } from '../../models/domain';
import { colors } from '../../theme';

export function DecisionDependencyEditor({
  decisions,
  selectedDecisionIds = [],
  onChange,
}: {
  decisions: Decision[];
  selectedDecisionIds?: string[];
  onChange: (decisionIds: string[]) => void;
}) {
  const selected = new Set(selectedDecisionIds);
  const candidates = decisions.filter((decision) => decision.status === 'active' || selected.has(decision.id));

  if (candidates.length === 0) return null;

  const toggle = (decisionId: string) => {
    const next = new Set(selectedDecisionIds);
    if (next.has(decisionId)) next.delete(decisionId);
    else next.add(decisionId);
    onChange([...next]);
  };

  return (
    <View style={styles.block}>
      <Text style={styles.label}>DEPENDS ON DECISION</Text>
      <Text style={styles.help}>Only explicit links create impact alerts. ConvoWeave does not infer dependencies.</Text>
      <View style={styles.options}>
        {candidates.map((decision) => {
          const isSelected = selected.has(decision.id);
          return (
            <Pressable
              key={decision.id}
              onPress={() => toggle(decision.id)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{decision.statement}</Text>
                <Text style={styles.optionMeta}>{decision.status.toUpperCase()}</Text>
              </View>
              <Text style={[styles.mark, isSelected && styles.markSelected]}>{isSelected ? 'Linked' : 'Link'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.line },
  label: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  help: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  options: { gap: 7, marginTop: 9 },
  option: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionSelected: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  optionTextWrap: { flex: 1 },
  optionTitle: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  optionTitleSelected: { color: colors.ink },
  optionMeta: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 3 },
  mark: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  markSelected: { color: colors.blue },
});
