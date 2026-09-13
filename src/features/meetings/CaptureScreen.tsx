import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import { colors } from '../../theme';
import { useMeetingRecorder } from './useMeetingRecorder';

function time(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function CaptureScreen({ onCancel, onFinished }: { onCancel: () => void; onFinished: (audioUri: string | undefined, durationMs: number) => void }) {
  const recorder = useMeetingRecorder();
  const active = recorder.captureState === 'recording' || recorder.captureState === 'paused';

  const finish = async () => {
    const uri = await recorder.stop();
    onFinished(uri ?? undefined, recorder.durationMs);
  };

  return (
    <Screen>
      <Header eyebrow="MEETING CAPTURE" title="Keep the thread." body="ConvoWeave records only after you explicitly start. Confirm everyone present has been informed before recording." />

      <View style={styles.consent}>
        <Text style={styles.consentTitle}>Recording notice</Text>
        <Text style={styles.consentBody}>You are responsible for obtaining any consent required where you are. Audio stays on this device in this alpha.</Text>
      </View>

      <View style={styles.recorderCard}>
        <View style={[styles.dot, active && styles.dotActive]} />
        <Text style={styles.time}>{time(recorder.durationMs)}</Text>
        <Text style={styles.state}>{recorder.captureState.toUpperCase()}</Text>
      </View>

      {recorder.captureState === 'denied' ? <Text style={styles.error}>Microphone permission was denied. Enable microphone access in system settings to record.</Text> : null}
      {recorder.captureState === 'interrupted' ? <Text style={styles.error}>Recording was interrupted by the operating system. Finish this draft and start a new capture.</Text> : null}
      {recorder.error ? <Text style={styles.error}>{recorder.error}</Text> : null}

      {recorder.captureState === 'idle' || recorder.captureState === 'denied' ? (
        <Pressable style={screenStyles.button} onPress={recorder.start}>
          <Text style={screenStyles.buttonText}>Start recording</Text>
        </Pressable>
      ) : null}

      {recorder.captureState === 'recording' ? (
        <View style={styles.actions}>
          <Pressable style={[screenStyles.secondaryButton, styles.action]} onPress={recorder.pause}><Text style={screenStyles.secondaryButtonText}>Pause</Text></Pressable>
          <Pressable style={[screenStyles.button, styles.action]} onPress={finish}><Text style={screenStyles.buttonText}>Finish</Text></Pressable>
        </View>
      ) : null}

      {recorder.captureState === 'paused' ? (
        <View style={styles.actions}>
          <Pressable style={[screenStyles.secondaryButton, styles.action]} onPress={recorder.resume}><Text style={screenStyles.secondaryButtonText}>Resume</Text></Pressable>
          <Pressable style={[screenStyles.button, styles.action]} onPress={finish}><Text style={screenStyles.buttonText}>Finish</Text></Pressable>
        </View>
      ) : null}

      {!active ? (
        <Pressable style={[screenStyles.secondaryButton, { marginTop: 12 }]} onPress={onCancel}>
          <Text style={screenStyles.secondaryButtonText}>Back</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  consent: { backgroundColor: colors.amberSoft, padding: 16, borderRadius: 16, marginBottom: 16 },
  consentTitle: { color: colors.ink, fontWeight: '800', marginBottom: 6 },
  consentBody: { color: colors.ink, lineHeight: 20 },
  recorderCard: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 24, paddingVertical: 40, alignItems: 'center', marginBottom: 18 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.line, marginBottom: 14 },
  dotActive: { backgroundColor: colors.red },
  time: { fontSize: 46, fontWeight: '800', color: colors.ink, letterSpacing: 1 },
  state: { marginTop: 8, fontWeight: '800', color: colors.muted, letterSpacing: 1.2 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  error: { color: colors.red, marginBottom: 14, lineHeight: 20 },
});
