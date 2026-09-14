import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../../theme';
import { useMeetingRecorder } from './useMeetingRecorder';

function time(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

type CaptureScreenProps = {
  threadTitle?: string;
  onCancel: () => void;
  onStarted: (audioUri: string | undefined, captureNotes: string) => Promise<void> | void;
  onCheckpoint: (audioUri: string | undefined, durationMs: number, captureNotes: string) => Promise<void> | void;
  onFinished: (audioUri: string | undefined, durationMs: number, captureNotes: string) => Promise<void> | void;
};

export function CaptureScreen({ threadTitle, onCancel, onStarted, onCheckpoint, onFinished }: CaptureScreenProps) {
  const recorder = useMeetingRecorder();
  const { width } = useWindowDimensions();
  const desktop = width >= 920;
  const active = recorder.captureState === 'recording' || recorder.captureState === 'paused';
  const lastCheckpoint = useRef(-1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!active) return;
    const bucket = Math.floor(recorder.durationMs / 5000);
    if (bucket === lastCheckpoint.current) return;
    lastCheckpoint.current = bucket;
    void onCheckpoint(recorder.audioUri, recorder.durationMs, notes);
  }, [active, notes, onCheckpoint, recorder.audioUri, recorder.durationMs]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      void onCheckpoint(recorder.audioUri, recorder.durationMs, notes);
    }, 450);
    return () => clearTimeout(timer);
  }, [active, notes, onCheckpoint, recorder.audioUri, recorder.durationMs]);

  useEffect(() => {
    if (recorder.captureState === 'interrupted') {
      void onCheckpoint(recorder.audioUri, recorder.durationMs, notes);
    }
  }, [notes, onCheckpoint, recorder.audioUri, recorder.captureState, recorder.durationMs]);

  const start = async () => {
    const started = await recorder.start();
    if (!started) return;
    lastCheckpoint.current = 0;
    await onStarted(recorder.audioUri, notes);
  };

  const finish = async () => {
    const uri = await recorder.stop();
    await onFinished(uri ?? recorder.audioUri, recorder.durationMs, notes);
  };

  const recorderPanel = (
    <View style={styles.controlColumn}>
      <View style={styles.recorderCard}>
        <View style={styles.recorderTopline}>
          <View style={[styles.liveDotWrap, active && styles.liveDotWrapActive]}><View style={[styles.liveDot, active && styles.liveDotActive]} /></View>
          <Text style={styles.captureState}>{recorder.captureState.toUpperCase()}</Text>
        </View>
        <Text style={styles.timer}>{time(recorder.durationMs)}</Text>
        <Text style={styles.timerHint}>{active ? 'Draft checkpoints save automatically.' : 'Ready when everyone has been informed.'}</Text>

        {recorder.captureState === 'idle' || recorder.captureState === 'denied' ? (
          <Pressable style={styles.primaryButton} onPress={start}>
            <View style={styles.primaryRecordDot} />
            <Text style={styles.primaryButtonText}>Start recording</Text>
          </Pressable>
        ) : null}

        {recorder.captureState === 'recording' ? (
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={recorder.pause}><Text style={styles.secondaryButtonText}>Pause</Text></Pressable>
            <Pressable style={styles.finishButton} onPress={finish}><Text style={styles.finishButtonText}>Finish</Text></Pressable>
          </View>
        ) : null}

        {recorder.captureState === 'paused' ? (
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={recorder.resume}><Text style={styles.secondaryButtonText}>Resume</Text></Pressable>
            <Pressable style={styles.finishButton} onPress={finish}><Text style={styles.finishButtonText}>Finish</Text></Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeKicker}>RECORDING NOTICE</Text>
        <Text style={styles.noticeTitle}>Keep consent explicit.</Text>
        <Text style={styles.noticeBody}>ConvoWeave only records after you press Start. You are responsible for obtaining any consent required where you are.</Text>
      </View>

      <View style={styles.nextCard}>
        <Text style={styles.nextKicker}>AFTER THE MEETING</Text>
        <Text style={styles.nextTitle}>Review before memory changes.</Text>
        <Text style={styles.nextBody}>Your notes become the starting context. Decisions, commitments and assumptions are not added to durable memory until you confirm them.</Text>
      </View>
    </View>
  );

  const notesPanel = (
    <View style={styles.notesCard}>
      <View style={styles.notesHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.notesKicker}>MY NOTES</Text>
          <Text style={styles.notesTitle}>Write what matters.</Text>
        </View>
        <View style={styles.savedPill}><View style={styles.savedDot} /><Text style={styles.savedText}>Saved with draft</Text></View>
      </View>
      <Text style={styles.notesGuidance}>Use this like a normal notepad during the conversation. Capture decisions, names, numbers, concerns, or questions in your own words.</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
        placeholder="Start typing meeting notes…"
        placeholderTextColor={colors.muted}
        style={styles.notesInput}
        autoCorrect
      />
      <View style={styles.notesFooter}>
        <Text style={styles.notesFooterText}>{notes.trim() ? `${notes.trim().length} characters` : 'Private draft context until review'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topbar}>
        {!active ? <Pressable style={styles.backButton} onPress={onCancel}><Text style={styles.backText}>‹</Text></Pressable> : <View style={styles.backPlaceholder} />}
        <View style={styles.topbarMain}>
          <Text style={styles.topbarKicker}>LIVE CAPTURE</Text>
          <Text style={styles.topbarTitle}>{threadTitle ?? 'Meeting thread'}</Text>
        </View>
        <View style={styles.localPill}><View style={styles.localDot} /><Text style={styles.localText}>Local draft</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>CONVOWEAVE LIVE</Text>
          <Text style={styles.heroTitle}>Stay in the conversation.</Text>
          <Text style={styles.heroBody}>Record in the background, write only what you care about, and turn it into source-backed memory after the meeting.</Text>
        </View>

        {recorder.captureState === 'denied' ? <View style={styles.errorCard}><Text style={styles.errorText}>Microphone permission was denied. Enable microphone access in system settings to record.</Text></View> : null}
        {recorder.captureState === 'interrupted' ? <View style={styles.errorCard}><Text style={styles.errorText}>Recording was interrupted by the operating system. Your latest audio and note checkpoint has been preserved.</Text></View> : null}
        {recorder.error ? <View style={styles.errorCard}><Text style={styles.errorText}>{recorder.error}</Text></View> : null}

        {desktop ? (
          <View style={styles.desktopGrid}>{notesPanel}{recorderPanel}</View>
        ) : (
          <View style={styles.mobileStack}>{recorderPanel}{notesPanel}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  topbar: { minHeight: 68, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  backPlaceholder: { width: 38, height: 38 },
  backText: { color: colors.ink, fontSize: 28, lineHeight: 30, marginTop: -2 },
  topbarMain: { flex: 1 },
  topbarKicker: { color: colors.forest, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  topbarTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 2 },
  localPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.mintSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.forest },
  localText: { color: colors.forestDark, fontSize: 10, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 46 },
  hero: { maxWidth: 720, marginBottom: 20 },
  heroEyebrow: { color: colors.forest, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  heroTitle: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -0.9 },
  heroBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  desktopGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  mobileStack: { gap: 14 },
  notesCard: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18, minHeight: 520 },
  notesHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notesKicker: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  notesTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  savedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.canvas, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  savedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest },
  savedText: { color: colors.mutedDark, fontSize: 9, fontWeight: '800' },
  notesGuidance: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 14, maxWidth: 620 },
  notesInput: { flex: 1, minHeight: 350, color: colors.ink, fontSize: 16, lineHeight: 25, padding: 0, borderWidth: 0 },
  notesFooter: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 11, marginTop: 12 },
  notesFooterText: { color: colors.muted, fontSize: 10 },
  controlColumn: { width: 320, maxWidth: '100%', gap: 12 },
  recorderCard: { backgroundColor: colors.ink, borderRadius: 20, padding: 18 },
  recorderTopline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDotWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#313833', alignItems: 'center', justifyContent: 'center' },
  liveDotWrapActive: { backgroundColor: '#49302F' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.muted },
  liveDotActive: { backgroundColor: '#FF756D' },
  captureState: { color: '#B9C2BC', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  timer: { color: colors.paper, fontSize: 44, lineHeight: 52, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 1, marginTop: 15 },
  timerHint: { color: '#B9C2BC', fontSize: 11, lineHeight: 17, marginTop: 4, marginBottom: 17 },
  primaryButton: { minHeight: 46, backgroundColor: colors.mint, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryRecordDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ink },
  primaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 8 },
  secondaryButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#2A332D', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.paper, fontSize: 12, fontWeight: '800' },
  finishButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  noticeCard: { backgroundColor: colors.amberSoft, borderWidth: 1, borderColor: '#EBD7B8', borderRadius: 17, padding: 15 },
  noticeKicker: { color: colors.amber, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  noticeTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: 5 },
  noticeBody: { color: colors.mutedDark, fontSize: 11, lineHeight: 17, marginTop: 5 },
  nextCard: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 17, padding: 15 },
  nextKicker: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  nextTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: 5 },
  nextBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  errorCard: { backgroundColor: colors.redSoft, borderWidth: 1, borderColor: '#E6C8C5', borderRadius: 13, padding: 12, marginBottom: 12 },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
