import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { PrivateNote } from '../../models/domain';
import { colors } from '../../theme';

export function PrivateSidecarScreen({
  notes,
  threadTitle,
  onCreate,
  onPromote,
  onReturnPrivate,
  onDelete,
  onBack,
}: {
  notes: PrivateNote[];
  threadTitle: string;
  onCreate: (body: string) => Promise<void>;
  onPromote: (note: PrivateNote) => Promise<void>;
  onReturnPrivate: (note: PrivateNote) => Promise<void>;
  onDelete: (note: PrivateNote) => Promise<void>;
  onBack: () => void;
}) {
  const [body, setBody] = useState('');

  const create = async () => {
    const value = body.trim();
    if (!value) return;
    await onCreate(value);
    setBody('');
  };

  return (
    <Screen>
      <Header
        eyebrow="PRIVATE SIDECAR"
        title={threadTitle}
        body="Personal thoughts stay outside shared meeting context unless you explicitly promote a note. Promotion is reversible and auditable."
      />

      <View style={screenStyles.card}>
        <Text style={styles.label}>NEW PRIVATE NOTE</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="Write something only you should see…"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable style={styles.saveButton} onPress={create}>
          <Text style={styles.saveText}>Save privately</Text>
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <View style={screenStyles.card}>
          <Text style={styles.emptyTitle}>No private notes yet.</Text>
          <Text style={styles.body}>Sidecar notes are stored separately from decisions, commitments, assumptions, and shared AI context.</Text>
        </View>
      ) : notes.map((note) => (
        <View key={note.id} style={[screenStyles.card, note.promotedAt ? styles.promotedCard : undefined]}>
          <View style={styles.row}>
            <Text style={[styles.state, { color: note.promotedAt ? colors.forest : colors.plum }]}>
              {note.promotedAt ? 'PROMOTED' : 'PRIVATE'}
            </Text>
            <Text style={styles.date}>{new Date(note.updatedAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.note}>{note.body}</Text>
          <Text style={styles.body}>
            {note.promotedAt
              ? 'Eligible for future shared context. The local alpha still sends this nowhere.'
              : 'Excluded from shared context and AI provider inputs.'}
          </Text>
          <View style={styles.actions}>
            {note.promotedAt ? (
              <Pressable style={styles.privateButton} onPress={() => onReturnPrivate(note)}>
                <Text style={styles.privateButtonText}>Return to private</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.promoteButton} onPress={() => onPromote(note)}>
                <Text style={styles.promoteText}>Promote explicitly</Text>
              </Pressable>
            )}
            <Pressable style={styles.deleteButton} onPress={() => onDelete(note)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to meetings</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.plum, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 },
  input: { minHeight: 92, color: colors.ink, fontSize: 16, lineHeight: 22, textAlignVertical: 'top', padding: 0 },
  saveButton: { alignSelf: 'flex-start', backgroundColor: colors.plum, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginTop: 14 },
  saveText: { color: 'white', fontWeight: '800' },
  promotedCard: { borderLeftWidth: 4, borderLeftColor: colors.forest },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  state: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  date: { color: colors.muted, fontSize: 11, flexShrink: 1, textAlign: 'right' },
  note: { color: colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  body: { color: colors.muted, lineHeight: 20, marginTop: 7 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  promoteButton: { backgroundColor: colors.forestSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  promoteText: { color: colors.forest, fontWeight: '800' },
  privateButton: { backgroundColor: colors.plumSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  privateButtonText: { color: colors.plum, fontWeight: '800' },
  deleteButton: { backgroundColor: colors.redSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  deleteText: { color: colors.red, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: 7 },
});
