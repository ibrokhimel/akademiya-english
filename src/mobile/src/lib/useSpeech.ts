import {
AudioModule,
RecordingPresets,
setAudioModeAsync,
useAudioRecorder,
} from "expo-audio";
import { Directory,File,Paths } from "expo-file-system";
import { useFocusEffect } from "expo-router";
import {
ExpoSpeechRecognitionModule as Speech,
useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback,useEffect,useRef,useState } from "react";
import { AppState,Platform } from "react-native";
import { motion,sound,stopAudio } from "./audio";
import { internalBuild } from "./config";
import { serviceURL } from "./releasePolicy";
import { emptyRecognition,finishedRecognition,recognitionResult,type RecognitionState } from "./recognition";
import { speechOptions } from "./speechOptions";
import { useApp } from "./store";
import { getVisualAudit } from "./visualAudit";

export type SpeechResult = {
  alts: string[];
  ms: number;
  uri?: string;
  error?: string;
};
export function useSpeech() {
  const { settings } = useApp();
  const [listening, setListening] = useState(false),
    [transcript, setTranscript] = useState(""),
    [volume, setVolume] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pending = useRef<{
    resolve: (r: SpeechResult) => void;
    start: number;
    recognition: RecognitionState;
    uri?: string;
    error?: string;
    fallback: boolean;
    stopping?: boolean;
    ms?: number;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preparing = useRef(false);
  const active = useRef(true);
  const settle = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    setListening(false);
    setVolume(0);
    motion({ who: "dombi", talking: false, listening: false });
    const result = finishedRecognition(p.recognition, p.error);
    setTranscript(result.alts[0] || "");
    p.resolve({
      ...result,
      ms: p.ms ?? Date.now() - p.start,
      uri: p.uri,
    });
  }, []);
  useSpeechRecognitionEvent("result", (event) => {
    if (!pending.current) return;
    pending.current.recognition = recognitionResult(pending.current.recognition, event);
    setTranscript(pending.current.recognition.transcript);
  });
  useSpeechRecognitionEvent("volumechange", (event) => {
    if (!pending.current) return;
    const v = Math.min(1, Math.max(0, event.value / 10));
    setVolume(v);
    motion({ who: "dombi", talking: false, listening: true, amp: v * 100 });
  });
  useSpeechRecognitionEvent("audioend", (event) => {
    if (pending.current && event.uri) pending.current.uri = event.uri;
  });
  useSpeechRecognitionEvent("error", (event) => {
    const p = pending.current;
    if (!p) return;
    p.error = event.error;
    setTimeout(() => {
      if (pending.current === p) settle();
    }, 150);
  });
  useSpeechRecognitionEvent("end", () => {
    const p = pending.current;
    if (p && !p.fallback)
      setTimeout(() => {
        if (pending.current === p) settle();
      }, 150);
  });
  const stop = useCallback(async () => {
    const p = pending.current;
    if (!p || p.stopping) return;
    p.stopping = true;
    p.ms = Date.now() - p.start;
    if (!p.fallback) {
      Speech.stop();
      setTimeout(() => {
        if (pending.current === p) settle();
      }, 2500);
      return;
    }
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri || pending.current !== p) {
      settle();
      return;
    }
    p.uri = settings.saveVoice ? uri : undefined;
    try {
      const body = await (await fetch(uri)).blob();
      const controller = new AbortController(),
        timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(settings.speechServer + "/stt", {
          method: "POST",
          body,
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Speech server unavailable");
        const result = await response.json();
        p.recognition = recognitionResult(p.recognition, {
          isFinal: true,
          results: typeof result.text === "string" && result.text.trim() ? [{ transcript: result.text }] : [],
        });
        if (pending.current === p) setTranscript(result.text || "");
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      p.error = "network";
    } finally {
      if (!settings.saveVoice) {
        try {
          new File(uri).delete();
        } catch {}
      }
      if (pending.current === p) settle();
    }
  }, [recorder, settings.saveVoice, settings.speechServer, settle]);
  const listen = useCallback(
    async (fallback = false, prompt = ""): Promise<SpeechResult> => {
      if (pending.current || preparing.current) return { alts: [], ms: 0, error: "busy" };
      stopAudio();
      const available = Speech.isRecognitionAvailable();
      const useFallback = (fallback || !available) && !!serviceURL(settings.speechServer, internalBuild);
      if (!available && !useFallback) return { alts: [], ms: 0, error: "service-not-allowed" };
      preparing.current = true;
      let permission;
      try {
      permission =
        useFallback
          ? await AudioModule.requestRecordingPermissionsAsync()
          : await Speech.requestPermissionsAsync();
      } catch { return { alts: [], ms: 0, error: "service-not-allowed" }; }
      finally { preparing.current = false; }
      if (!active.current || AppState.currentState !== "active") return { alts: [], ms: 0, error: "aborted" };
      if (!permission.granted) return { alts: [], ms: 0, error: "not-allowed" };
      if (pending.current) return { alts: [], ms: 0, error: "busy" };
      setTranscript("");
      setListening(true);
      sound("mic-on", settings.sound);
      return new Promise<SpeechResult>((resolve) => {
        const p = {
          resolve,
          start: Date.now(),
          recognition: emptyRecognition(),
          fallback: useFallback,
        };
        pending.current = p;
        motion({ who: "dombi", talking: false, listening: true });
        const start = async () => {
          try {
            if (p.fallback) {
              await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
              });
              await recorder.prepareToRecordAsync();
              if (pending.current !== p) return;
              recorder.record();
            } else {
              // Use the phone's installed engine; no PC server is required.
              const services = Platform.OS === "android" ? Speech.getSpeechRecognitionServices() : [];
              const preferred = Platform.OS === "android" ? Speech.getDefaultRecognitionService().packageName : undefined;
              const service = preferred && services.includes(preferred) ? preferred : services[0];
              const lang = settings.cast === "uk" ? "en-GB" : "en-US";
              let onDevice = false;
              if (Platform.OS === "android" && Speech.supportsOnDeviceRecognition()) {
                const locales = await Promise.race([
                  Speech.getSupportedLocales({ androidRecognitionServicePackage: service }).catch(() => ({ installedLocales: [] as string[] })),
                  new Promise<{installedLocales: string[]}>(resolve => setTimeout(() => resolve({installedLocales: []}), 1200)),
                ]);
                onDevice = locales.installedLocales.some(value => value.toLowerCase() === lang.toLowerCase());
              }
              if (pending.current !== p) return;
              Speech.start({
                ...speechOptions(Platform.OS, Number(Platform.Version), prompt),
                lang,
                requiresOnDeviceRecognition: onDevice,
                androidRecognitionServicePackage: service,
                recordingOptions: { persist: settings.saveVoice },
                volumeChangeEventOptions: {
                  enabled: true,
                  intervalMillis: 100,
                },
              });
            }
            timer.current = setTimeout(() => {
              if (pending.current === p) void stop();
            }, 14000);
          } catch {
            Object.assign(p, { error: "service-not-allowed" });
            settle();
          }
        };
        void start();
      });
    },
    [recorder, settings.cast, settings.saveVoice, settings.sound, settings.speechServer, settle, stop],
  );
  const abort = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    if (p.fallback) void recorder.stop().catch(() => {});
    else Speech.abort();
    p.error = "aborted";
    settle();
  }, [recorder, settle]);
  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => { active.current = false; abort(); };
  }, [abort]));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") abort();
    });
    return () => {
      sub.remove();
      const p = pending.current;
      if (p) {
        pending.current = null;
        if (timer.current) clearTimeout(timer.current);
        Speech.abort();
        void recorder.stop().catch(() => {});
        p.resolve({ alts: [], ms: 0, error: "aborted" });
      }
    };
  }, [recorder, abort]);
  const audit = getVisualAudit();
  return {
    listening: audit?.listening ?? listening,
    transcript,
    volume: audit?.listening ? 0.5 : volume,
    listen: audit ? async (): Promise<SpeechResult> => ({ alts: [], ms: 0, error: audit.speechError || "aborted" }) : listen,
    stop,
    abort,
  };
}
export async function keepRecording(uri: string, phraseId: string) {
  const directory = new Directory(Paths.document, "voice");
  if (!directory.exists) directory.create();
  const source = new File(uri),
    destination = new File(
      directory,
      `${phraseId}-${Date.now()}.${/\.(wav|m4a|caf|aac|mp3|webm|3gp)$/i.exec(uri)?.[1].toLowerCase() || "m4a"}`,
    );
  await source.copy(destination);
  if (!destination.exists || !destination.size || destination.size !== source.size)
    throw new Error("Recording copy was not completed");
  return destination.uri;
}
