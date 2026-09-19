import { useEffect, useMemo, useState } from 'react';
import { File } from 'expo-file-system';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen, screenStyles } from '../../components/Screen';
import type { AudioRetentionPolicy, PrivacySettings } from '../../models/domain';
import { colors } from '../../theme';
import { MeetingRepository, PrivacySettingsRepository } from '../../storage/repositories';
import { UpcomingMeetingsScreen } from '../calendar/UpcomingMeetingsScreen';
import { DEFAULT_PRIVACY_SETTINGS, eligibleCompletedAudio, withoutLocalAudio } from './retentionPolicy';

const OPTIONS: { value: AudioRetentionPolicy; label: string; body: string }[] = [
  { value: 'forever', label: 'Keep forever', body: 'Do not automatically select any completed meeting audio for cleanup.' },
  { value: '90d', label: '90 days', body: 'Eligible completed recordings older than 90 days can be removed when you apply retention.' },
  { value: '30d', label: '30 days', body: 'Eligible completed recordings older than 30 days can be removed when you apply retention.' },
  { value: '7d', label: '7 days', body: 'Eligible completed recordings older than 7 days can be removed when you apply retention.' },
];

export function PrivacySettingsScreen({
  onBack,
  onDataChanged,
}: {
  onBack: () => void;
  onDataChanged: () => Promise<void> | void;
}) {
  const settingsRepository = useMemo(() => new PrivacySettingsRepository(), []);
  const meetingRepository = useMemo(() => new MeetingRepository(), []);
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const refreshPreview = async (nextSettings = settings) => {
    const meetings = await meetingRepository.list();
    setEligibleCount(eligibleCompletedAudio(meetings, nextSettings.audioRetention).length);
  };

  useEffect(() => {
    void (async () => {
      const stored = await settingsRepository.get('privacy-settings');
      const next = stored ?? DEFAULT_PRIVACY_SETTINGS;
      setSettings(next);
      await refreshPreview(next);
    })();
  }, []);

  const choose = async (audioRetention: AudioRetentionPolicy) => {
    const next: PrivacySettings = {
      id: 'privacy-settings',
      audioRetention,
      updatedAt: new Date().toISOString(),
    };
    await settingsRepository.upsert(next);
    setSettings(next);
    setMessage('Retention preference saved locally. No recordings were removed.');
    await refreshPreview(next);
  };

  const applyRetention = async () => {
    if (settings.audioRetention === 'forever') {
      setMessage('Keep forever is selected. Nothing was removed.');
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const meetings = await meetingRepository.list();
      const eligible = eligibleCompletedAudio(meetings, settings.audioRetention);
      let cleaned = 0;
      let failed = 0;

      for (const meeting of eligible) {
        if (!meeting.audioUri) continue;
        try {
          const file = new File(meeting.audioUri);
          if (file.exists) file.delete();
          await meetingRepository.upsert(withoutLocalAudio(meeting));
          cleaned += 1;
        } catch {
          failed += 1;
        }
      }

      await onDataChanged();
      await refreshPreview(settings);
      setMessage(failed > 0
        ? `Removed ${cleaned} local recording${cleaned === 1 ? '' : 's'}. ${failed} could not be removed and remain referenced.`
        : `Removed ${cleaned} local recording${cleaned === 1 ? '' : 's'}. Structured memory and transcripts were preserved.`);
    } finally {
      setBusy(false);
    }
  };

  if (showCalendar) return <UpcomingMeetingsScreen onBack={() => setShowCalendar(false)} />;

  return (
    <Screen>
      <Header
        eyebrow="SETTINGS · PRIVACY & RETENTION"
        title="Local data controls"
        body="Raw recording retention is separate from trusted meeting memory. Nothing is deleted silently."
      />

      <View style={screenStyles.card}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        <Text style={styles.body}>Device calendar access is optional, read-only and requested only when you open the calendar integration.</Text>
        <Pressable style={styles.integrationButton} onPress={() => setShowCalendar(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.integrationTitle}>Upcoming device calendar</Text>
            <Text style={styles.optionBody}>See the next seven days and explicitly link events to ConvoWeave threads.</Text>
          </View>
          <Text style={styles.integrationArrow}>›</Text>
        </Pressable>
      </View>

      <View style={screenStyles.card}>
        <Text style={styles.sectionTitle}>Completed-meeting audio</Text>
        <Text style={styles.body}>Choose how long local raw audio should remain eligible for storage. Changing this preference only saves the policy. Cleanup happens only when you press Apply retention now.</Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = settings.audioRetention === option.value;
            return (
              <Pressable key={option.value} onPress={() => { void choose(option.value); }} style={[styles.option, selected && styles.optionSelected]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{option.label}</Text>
                  <Text style={styles.optionBody}>{option.body}</Text>
                </View>
                <Text style={[styles.state, selected && styles.stateSelected]}>{selected ? 'SELECTED' : 'CHOOSE'}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewValue}>{eligibleCount}</Text>
          <Text style={styles.previewText}>completed local recording{eligibleCount === 1 ? '' : 's'} currently eligible under this policy</Text>
        </View>

        <Pressable disabled={busy || settings.audioRetention === 'forever'} onPress={() => { void applyRetention(); }} style={[styles.cleanupButton, (busy || settings.audioRetention === 'forever') && styles.disabled]}>
          <Text style={styles.cleanupText}>{busy ? 'Applying retention…' : 'Apply retention now'}</Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      <View style={screenStyles.card}>
        <Text style={styles.sectionTitle}>Privacy boundaries</Text>
        <Boundary title="Remote processing" body="Still requires explicit approval per meeting. This screen does not enable remote upload by default." />
        <Boundary title="Private Sidecar" body="Private notes remain excluded from shared AI context, exports, connectors and team search until you explicitly promote them." />
        <Boundary title="Durable memory" body="Audio cleanup preserves transcripts, decisions, commitments, assumptions, questions, contradictions and thread history." />
        <Boundary title="Unfinished work" body="Draft and review-stage recordings are never eligible for retention cleanup." />
      </View>

      <Pressable style={screenStyles.button} onPress={onBack}>
        <Text style={screenStyles.buttonText}>Back to meetings</Text>
      </Pressable>
    </Screen>
  );
}

function Boundary({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.boundary}>
      <Text style={styles.boundaryTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: 7 },
  body: { color: colors.muted, lineHeight: 20 },
  integrationButton: { borderTopWidth: 1, borderTopColor: colors.lineSoft, marginTop: 13, paddingTop: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  integrationTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  integrationArrow: { color: colors.muted, fontSize: 24 },
  options: { gap: 8, marginTop: 16 },
  option: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 13, flexDirection: 'row', gap: 12, alignItems: 'center' },
  optionSelected: { backgroundColor: colors.mintSoft, borderColor: colors.forest },
  optionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  optionTitleSelected: { color: colors.forestDark },
  optionBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  state: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  stateSelected: { color: colors.forest },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, backgroundColor: colors.canvas, borderRadius: 12 },
  previewValue: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  previewText: { color: colors.mutedDark, fontSize: 12, lineHeight: 17, flex: 1 },
  cleanupButton: { marginTop: 14, backgroundColor: colors.ink, borderRadius: 11, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  cleanupText: { color: colors.paper, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  message: { color: colors.forestDark, fontSize: 12, lineHeight: 18, marginTop: 10 },
  boundary: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingVertical: 12 },
  boundaryTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', marginBottom: 4 },
});
