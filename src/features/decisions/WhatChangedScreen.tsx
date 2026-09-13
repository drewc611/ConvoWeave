import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { MeetingChangeSet, MemoryChange } from '../../models/domain';
import { colors } from '../../theme';

export function WhatChangedScreen({ changeSet, threadTitle, onBack }: { changeSet: MeetingChangeSet; threadTitle: string; onBack: () => void }) {
  return (
    <Screen>
      <Header
        eyebrow="WHAT CHANGED?"
        title={threadTitle}
        body="A deterministic comparison of accepted memory before and after this meeting. No model is needed to reconstruct the delta."
      />

      {changeSet.changes.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No durable memory changed.</Text>
          <Text style={styles.body}>The meeting was saved, but it did not add, change, supersede, cancel, or leave overdue tracked memory.</Text>
        </View>
      ) : changeSet.changes.map((change, index) => (
        <ChangeCard key={`${change.kind}-${change.id}-${change.change}-${index}`} change={change} />
      ))}

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to meetings</Text>
      </Pressable>
    </Screen>
  );
}

function ChangeCard({ change }: { change: MemoryChange }) {
  const tone = toneFor(change);
  return (
    <View style={[screenStyles.card, { borderLeftWidth: 4, borderLeftColor: tone.color }]}>
      <View style={styles.row}>
        <Text style={[styles.change, { color: tone.color }]}>{tone.label}</Text>
        <Text style={styles.kind}>{change.kind.toUpperCase()}</Text>
      </View>
      <Text style={styles.title}>{change.label}</Text>
      <Text style={styles.body}>{tone.description}</Text>
    </View>
  );
}

function toneFor(change: MemoryChange) {
  switch (change.change) {
    case 'new':
      return { label: 'NEW', description: 'This entered durable meeting memory in this meeting.', color: colors.forest };
    case 'changed':
      return { label: 'CHANGED', description: 'An existing tracked item changed without being erased.', color: colors.amber };
    case 'superseded':
      return { label: 'SUPERSEDED', description: 'A previous item remains in history but is no longer the active state.', color: colors.red };
    case 'removed':
      return { label: 'REMOVED', description: 'This item is no longer present in the current tracked state.', color: colors.red };
    case 'unresolved':
      return { label: 'UNRESOLVED', description: 'This tracked commitment remains open beyond its expected date.', color: colors.amber };
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  change: { fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  kind: { color: colors.muted, fontSize: 11, letterSpacing: 1, fontWeight: '800' },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
