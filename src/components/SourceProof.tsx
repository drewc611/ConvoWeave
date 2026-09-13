import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EvidenceRef } from '../models/domain';
import { colors } from '../theme';

export function SourceProof({ evidence, compact = false }: { evidence: EvidenceRef[]; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const first = evidence[0];

  if (!first) {
    return <Text style={styles.missing}>No source evidence attached.</Text>;
  }

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.trigger} onPress={() => setExpanded((value) => !value)}>
        <Text style={styles.triggerText}>{expanded ? 'Hide source proof' : `Source proof · ${evidence.length}`}</Text>
        <Text style={styles.triggerIcon}>{expanded ? '−' : '+'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          {evidence.map((item, index) => (
            <View key={`${item.meetingId}-${item.startMs}-${item.endMs}-${index}`} style={[styles.evidence, index > 0 && styles.divider]}>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>MEETING {shortId(item.meetingId)}</Text>
                <Text style={styles.meta}>{formatTime(item.startMs)}–{formatTime(item.endMs)}</Text>
              </View>
              {item.speakerId ? <Text style={styles.speaker}>Speaker: {item.speakerId}</Text> : null}
              {item.quote ? <Text style={styles.quote}>“{item.quote}”</Text> : <Text style={styles.quoteMissing}>Quote unavailable</Text>}
              {!compact && item.segmentIds.length > 0 ? (
                <Text style={styles.segment}>Segments: {item.segmentIds.join(', ')}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function formatTime(ms: number) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function shortId(value: string) {
  return value.length > 14 ? `${value.slice(0, 10)}…` : value;
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 12 },
  trigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.canvas, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  triggerText: { color: colors.forest, fontSize: 12, fontWeight: '900' },
  triggerIcon: { color: colors.forest, fontSize: 18, fontWeight: '700' },
  panel: { backgroundColor: '#FAFAF7', borderRadius: 10, marginTop: 7, padding: 11, borderWidth: 1, borderColor: colors.line },
  evidence: { paddingVertical: 2 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  meta: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  speaker: { color: colors.ink, fontSize: 12, marginTop: 7, fontWeight: '700' },
  quote: { color: colors.ink, lineHeight: 20, marginTop: 7, fontStyle: 'italic' },
  quoteMissing: { color: colors.muted, marginTop: 7 },
  segment: { color: colors.muted, fontSize: 10, marginTop: 7 },
  missing: { color: colors.red, fontSize: 12, marginTop: 10 },
});
