import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { SourceProof } from '../../components/SourceProof';
import type { Question } from '../../models/domain';
import { colors } from '../../theme';

export function OpenQuestionsScreen({
  questions,
  threadTitle,
  onUpdate,
  onBack,
}: {
  questions: Question[];
  threadTitle: string;
  onUpdate: (question: Question) => Promise<void>;
  onBack: () => void;
}) {
  const transition = async (question: Question, status: Question['status']) => {
    await onUpdate({
      ...question,
      status,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined,
    });
  };

  const ordered = [...questions].sort((left, right) => {
    if (left.status !== right.status) return left.status === 'open' ? -1 : 1;
    return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  });

  return (
    <Screen>
      <Header
        eyebrow="OPEN QUESTIONS"
        title={threadTitle}
        body="Keep unresolved questions visible until the team explicitly closes them. Questions stay source-backed and are never treated as decisions or facts."
      />

      {ordered.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No questions tracked yet.</Text>
          <Text style={styles.body}>Accepted questions from reviewed meetings will appear here with their source evidence.</Text>
        </View>
      ) : ordered.map((question) => {
        const open = question.status === 'open';
        return (
          <View key={question.id} style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: open ? colors.blue : colors.muted }]}>
            <View style={styles.row}>
              <Text style={[styles.status, { color: open ? colors.blue : colors.muted }]}>{open ? 'OPEN' : 'RESOLVED'}</Text>
              <Text style={styles.created}>{new Date(question.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.title}>{question.statement}</Text>
            <SourceProof evidence={question.evidence} compact />

            <View style={styles.actions}>
              {open ? (
                <Pressable style={styles.resolveButton} onPress={() => transition(question, 'resolved')}>
                  <Text style={styles.resolveText}>Resolve</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.reopenButton} onPress={() => transition(question, 'open')}>
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  status: { fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  created: { color: colors.muted, fontSize: 12 },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 15 },
  resolveButton: { backgroundColor: colors.blueSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  resolveText: { color: colors.blue, fontWeight: '800' },
  reopenButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  reopenText: { color: colors.ink, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
