import { useEffect, useMemo, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export type CaptureState = 'idle' | 'recording' | 'paused' | 'interrupted' | 'denied' | 'finished';

export function useMeetingRecorder() {
  const options = useMemo(() => ({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' as const }), []);
  const recorder = useAudioRecorder(options);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void recorder.stop().catch(() => undefined);
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    };
  }, [recorder]);

  const start = async () => {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setCaptureState('denied');
      return false;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync({ directory: 'document' });
    recorder.record();
    setCaptureState('recording');
    return true;
  };

  const pause = () => {
    recorder.pause();
    setCaptureState('paused');
  };

  const resume = () => {
    recorder.record();
    setCaptureState('recording');
  };

  const stop = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      setCaptureState('finished');
      return recorder.uri ?? recorderState.url ?? null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Recording could not be stopped.');
      return null;
    }
  };

  const interrupted = recorderState.mediaServicesDidReset;
  useEffect(() => {
    if (interrupted) setCaptureState('interrupted');
  }, [interrupted]);

  return {
    captureState,
    durationMs: recorderState.durationMillis,
    audioUri: recorder.uri ?? recorderState.url ?? undefined,
    error,
    start,
    pause,
    resume,
    stop,
  };
}
