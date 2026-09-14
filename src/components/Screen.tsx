import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <View style={styles.brandMark}><View style={styles.brandMarkInner} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandName}>ConvoWeave</Text>
          <Text style={styles.brandSub}>WORKSPACE</Text>
        </View>
        <View style={styles.localPill}><View style={styles.localDot} /><Text style={styles.localText}>Source-backed</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>{children}</View>
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
  card: { backgroundColor: colors.paper, borderRadius: 16, padding: 17, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  button: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  buttonText: { color: colors.paper, fontWeight: '900', fontSize: 14 },
  secondaryButton: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center' },
  secondaryButtonText: { color: colors.ink, fontWeight: '800' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  topbar: { minHeight: 62, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16 },
  brandMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  brandMarkInner: { width: 10, height: 10, borderRadius: 4, backgroundColor: colors.mint },
  brandName: { color: colors.ink, fontWeight: '900', fontSize: 14, letterSpacing: -0.2 },
  brandSub: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 1 },
  localPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.mintSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  localDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest },
  localText: { color: colors.forestDark, fontSize: 9, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 44 },
  content: { width: '100%', maxWidth: 900, alignSelf: 'center' },
  header: { marginBottom: 20, maxWidth: 760 },
  eyebrow: { fontSize: 10, letterSpacing: 1.35, fontWeight: '900', color: colors.forest, marginBottom: 8 },
  title: { fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -0.75, color: colors.ink },
  body: { marginTop: 9, fontSize: 14, lineHeight: 21, color: colors.muted, maxWidth: 720 },
});
