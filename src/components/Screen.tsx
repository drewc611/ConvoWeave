import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Header({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

export const screenStyles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line, marginBottom: 12 },
  button: { backgroundColor: colors.forest, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16 },
  secondaryButton: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center' },
  secondaryButtonText: { color: colors.ink, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 22 },
  eyebrow: { fontSize: 12, letterSpacing: 1.3, fontWeight: '800', color: colors.forest, marginBottom: 8 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', color: colors.ink },
  body: { marginTop: 10, fontSize: 16, lineHeight: 23, color: colors.muted },
});
