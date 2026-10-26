import { useEffect, useRef } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { levelForFps, levelFrom } from "../../../core/dombi.js";
import { useApp } from "./store";
import { useFrameMeter } from "./useFrameMeter";

export type DombiLevel = "full" | "light" | "still";

/** The level Dombi plays at now: the measured level, the "Kamroq harakat" switch and the phone's Reduce Motion. */
export function useDombiLevel(): DombiLevel {
  const { settings } = useApp();
  const reduceMotion = useReducedMotion();
  return levelFrom({ measured: settings.dombiLevel, lessMotion: settings.lessMotion, reduceMotion }) as DombiLevel;
}

/** Runs quietly while onboarding shows Dombi: after a few seconds of frames, stores the phone's level. No screen, no waiting. */
export function useMeasureDombiLevel(active: boolean) {
  const { set } = useApp();
  const { fps } = useFrameMeter();
  const samples = useRef<number[]>([]);
  const done = useRef(false);
  useEffect(() => {
    if (!active || done.current || fps <= 0) return;
    samples.current.push(fps);
    if (samples.current.length < 5) return;
    done.current = true;
    const sorted = [...samples.current].sort((a, b) => a - b);
    set({ dombiLevel: levelForFps(sorted[Math.floor(sorted.length / 2)]) as DombiLevel });
  }, [active, fps, set]);
}
