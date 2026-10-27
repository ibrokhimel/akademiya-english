import {
createAudioPlayer,
setAudioModeAsync,
type AudioPlayer,
} from "expo-audio";
import { AppState } from "react-native";
import { clipOf } from "../../../core/text.js";
import {
audio,
dombiAudio,
dombiMetadata,
interfaceAudio,
soundMetadata,
sounds,
} from "../data/assets";
import { clips,type Cast,type Voice } from "../data/content";

export type Motion = {
  who: string;
  talking: boolean;
  listening?: boolean;
  amp?: number;
  viseme?: number;
  reaction?: "correct" | "wrong" | "tapped";
};
const listeners = new Set<(event: Motion) => void>();
let microphoneOpen = false;
export function motion(event: Motion) {
  if (event.listening !== undefined) microphoneOpen = event.listening;
  listeners.forEach((listener) => listener(event));
}
export function watchMotion(listener: (event: Motion) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
let live: AudioPlayer | null = null,
  raf = 0,
  cancel: (() => void) | null = null;
let playbackGeneration = 0;
export function stopAudio() {
  playbackGeneration++;
  cancel?.();
  cancel = null;
  cancelAnimationFrame(raf);
  if (live) {
    try {
      live.pause();
      live.remove();
    } catch {}
    live = null;
  }
  for (const who of ["aziz", "malika", "waiter", "seller", "dombi"])
    motion({ who, talking: false, viseme: 0 });
}
AppState.addEventListener("change", (state) => {
  if (state !== "active") {
    stopAudio();
    stopEffects();
  }
});
export async function play(
  voice: Voice,
  text: string,
  cast: Cast,
  slow = false,
  onTick?: (ms: number) => void,
) {
  const key = clipOf(voice, text),
    clip = clips[cast][key],
    part = slow ? clip?.slow : clip;
  const source = audio[`${cast}/${key}${slow ? ".slow" : ""}`];
  if (!source || !part) throw new Error(`Missing lesson audio: ${cast}/${key}`);
  const generation = playbackGeneration;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    allowsRecording: false,
  });
  if (generation !== playbackGeneration) return;
  stopAudio();
  const player = createAudioPlayer(source, { updateInterval: 50 });
  live = player;
  player.volume = Math.min(1, part.volume || 1);
  return new Promise<void>((resolve, reject) => {
    let ended = false,
      shape = -1;
    const complete = (error?: Error) => {
      if (ended) return;
      ended = true;
      clearTimeout(timeout);
      sub.remove();
      if (live === player) {
        live = null;
        cancel = null;
        cancelAnimationFrame(raf);
      }
      motion({ who: voice, talking: false, viseme: 0 });
      motion({ who: "dombi", talking: false, viseme: 0 });
      try {
        player.remove();
      } catch {}
      if (error) reject(error);
      else resolve();
    };
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.error) complete(new Error(status.error));
      else if (status.didJustFinish) complete();
    });
    const timeout = setTimeout(
      () => complete(new Error("Audio playback timed out")),
      part.ms + 15000,
    );
    cancel = () => complete();
    const tick = () => {
      if (ended) return;
      const ms = player.currentTime * 1000;
      let value = 0;
      for (const [at, next] of part.mouth || []) {
        if (at > ms) break;
        value = next;
      }
      if (value !== shape) {
        shape = value;
        for (const who of [voice, "dombi"])
          motion({ who, talking: true, viseme: shape });
      }
      onTick?.(ms);
      raf = requestAnimationFrame(tick);
    };
    player.play();
    tick();
  });
}
export async function playUri(
  uri: string | number,
  volume = 1,
  onTick?: (ms: number) => void,
) {
  const generation = playbackGeneration;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    allowsRecording: false,
  });
  if (generation !== playbackGeneration) return;
  stopAudio();
  const player = createAudioPlayer(uri);
  live = player;
  player.volume = volume;
  return new Promise<void>((resolve, reject) => {
    let ended = false;
    const complete = (error?: Error) => {
      if (ended) return;
      ended = true;
      clearTimeout(timeout);
      sub.remove();
      if (live === player) {
        live = null;
        cancel = null;
        cancelAnimationFrame(raf);
      }
      try {
        player.remove();
      } catch {}
      motion({ who: "dombi", talking: false, viseme: 0 });
      if (error) reject(error);
      else resolve();
    };
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.error) complete(new Error(status.error));
      else if (status.didJustFinish) complete();
    });
    const timeout = setTimeout(
      () => complete(new Error("Audio playback timed out")),
      60000,
    );
    cancel = () => complete();
    player.play();
    if (onTick) {
      const tick = () => {
        if (ended) return;
        onTick(player.currentTime * 1000);
        raf = requestAnimationFrame(tick);
      };
      tick();
    }
  });
}
/** Whether Dombi has a recorded voice for this exact line. */
export const hasDombiVoice = (text: string) => !!dombiMetadata[text];
/** How long Dombi's recorded line runs, from its last mouth shape. */
export const dombiVoiceMs = (text: string) => dombiMetadata[text]?.mouth.at(-1)?.[0] ?? 0;
export async function playDombi(text: string, enabled = true, onTick?: (ms: number) => void) {
  const line = dombiMetadata[text];
  if (!enabled || !line || AppState.currentState !== "active") return;
  let previous = -1;
  await playUri(dombiAudio[line.key], line.volume, (ms) => {
    onTick?.(ms);
    let index = 0;
    while (index + 1 < line.mouth.length && line.mouth[index + 1][0] <= ms)
      index++;
    if (index === previous) return;
    previous = index;
    const [, viseme, amp] = line.mouth[index];
    motion({ who: "dombi", talking: true, viseme, amp: amp * 100 });
  });
}
type Effect = { player: AudioPlayer; ready: Promise<boolean> };
const effects = new Map<string, Effect>();
let effectError = "";
export function audioDiagnostics() {
  return {
    active: AppState.currentState,
    microphoneOpen,
    effectError,
    effects: [...effects].map(([key, { player }]) => ({
      key,
      loaded: player.isLoaded,
      playing: player.playing,
      seconds: player.currentTime,
      duration: player.duration,
    })),
  };
}
let modeReady: Promise<void> | null = null;
let effectVersion = 0;
const variants = new Map<string, number>();
function effectMode() {
  return (modeReady ??= setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    allowsRecording: false,
  }).catch((error) => {
    modeReady = null;
    throw error;
  }));
}
function getEffect(key: string, source: number) {
  const cached = effects.get(key);
  if (cached) return cached;
  const player = createAudioPlayer(source, { updateInterval: 50 });
  const ready = player.isLoaded
    ? Promise.resolve(true)
    : new Promise<boolean>((resolve) => {
        const finish = (loaded: boolean) => {
          clearTimeout(timer);
          sub.remove();
          resolve(loaded);
        };
        const sub = player.addListener("playbackStatusUpdate", (status) => {
          if (status.error) finish(false);
          else if (status.isLoaded) finish(true);
        });
        const timer = setTimeout(() => finish(player.isLoaded), 5000);
      });
  const entry = { player, ready };
  effects.set(key, entry);
  return entry;
}
export function warmSounds(names: string[]) {
  void effectMode().catch(() => {});
  for (const name of names)
    for (const variant of soundMetadata[name] || []) {
      const source = (variant.family ? interfaceAudio : sounds)[variant.key];
      if (source)
        getEffect((variant.family ? "sine/" : "final/") + variant.key, source);
    }
}
export function stopEffects() {
  effectVersion++;
  for (const { player } of effects.values()) {
    try {
      player.pause();
    } catch {}
  }
}
export function cutRewards() {
  for (const [key, { player }] of effects) {
    if (!key.startsWith("final/") || player.duration < 1) continue;
    try {
      player.pause();
    } catch {}
  }
}
export function sound(name: string, enabled = true, maxAgeMs = Infinity) {
  const requestedAt = performance.now();
  if (
    !enabled ||
    (microphoneOpen && name !== "mic-on") ||
    AppState.currentState !== "active"
  )
    return;
  const choices = soundMetadata[name];
  if (!choices?.length) return;
  const next = ((variants.get(name) ?? -1) + 1) % choices.length;
  variants.set(name, next);
  const variant = choices[next];
  const source = (variant.family ? interfaceAudio : sounds)[variant.key];
  if (!source) return;
  const version = effectVersion;
  try {
    const effect = getEffect(
      (variant.family ? "sine/" : "final/") + variant.key,
      source,
    );
    void Promise.all([effect.ready, effectMode()])
      .then(async ([loaded]) => {
        if (
          !loaded ||
          performance.now() - requestedAt > maxAgeMs ||
          version !== effectVersion ||
          (microphoneOpen && name !== "mic-on")
        )
          return;
        effect.player.volume = variant.volume;
        effect.player.shouldCorrectPitch = false;
        effect.player.setPlaybackRate(Math.pow(2, variant.step / 12));
        await effect.player.seekTo(0);
        if (
          version === effectVersion &&
          performance.now() - requestedAt <= maxAgeMs &&
          (!microphoneOpen || name === "mic-on")
        )
          effect.player.play();
      })
      .catch((error) => {
        effectError = name + ": " + String(error);
        console.warn("Sound " + name, error);
      });
  } catch (error) {
    effectError = name + ": " + String(error);
  }
}
