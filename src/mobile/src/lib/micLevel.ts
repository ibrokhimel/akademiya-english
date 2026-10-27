import { File } from "expo-file-system";
import { getRecordingPermissionsAsync, RecordingPresets, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * The mic's loudness (0–100) while Dombi is held, for talking to him and blowing at him (motion-plan §8; owner,
 * 2026-10-27: the mic is on only while a finger holds him). It never asks for permission: without it, start does
 * nothing. The take is thrown away on stop.
 */
export function useMicLevel() {
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const run = useRef<{ poll: ReturnType<typeof setInterval> | null; on: boolean }>({ poll: null, on: false });

  const stop = useCallback(() => {
    const r = run.current;
    if (!r.on) return;
    r.on = false;
    if (r.poll) clearInterval(r.poll);
    r.poll = null;
    void (async () => {
      try {
        await recorder.stop();
        if (recorder.uri) new File(recorder.uri).delete();
      } catch { /* nothing was recording */ }
      // The whole mode, as audio.ts sets it: a partial one would turn iOS silent-mode playback off for the app's sounds.
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, allowsRecording: false }).catch(() => {});
    })();
  }, [recorder]);

  const start = useCallback((onLevel: (level: number) => void) => {
    const r = run.current;
    if (r.on) return;
    r.on = true;
    void (async () => {
      try {
        if (!(await getRecordingPermissionsAsync()).granted || !r.on) { r.on = false; return; }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (!r.on) return;
        recorder.record();
        r.poll = setInterval(() => {
          const db = recorder.getStatus().metering;
          if (db !== undefined) onLevel(Math.max(0, Math.min(100, ((db + 60) / 60) * 100)));
        }, 50);
      } catch { r.on = false; }
    })();
  }, [recorder]);

  useEffect(() => stop, [stop]);
  return useMemo(() => ({ start, stop }), [start, stop]);
}
