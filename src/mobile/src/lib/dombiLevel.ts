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

/**
 * Runs quietly while a screen with Dombi is open (onboarding, or the Learn tab for people who updated the app):
 * five one-second frame samples, then the phone's level is stored once. No screen, no waiting.
 */
export function useMeasureDombiLevel(active: boolean) {
  const { settings, set } = useApp();
  const measuring = active && !settings.dombiMeasured;
  const stats = useFrameMeter(measuring);
  const samples = useRef<number[]>([]);
  useEffect(() => {
    if (!measuring || stats.fps <= 0) return;
    samples.current.push(stats.fps);
    if (samples.current.length < 5) return;
    const sorted = [...samples.current].sort((a, b) => a - b);
    set({ dombiLevel: levelForFps(sorted[Math.floor(sorted.length / 2)]) as DombiLevel, dombiMeasured: true });
  }, [measuring, stats, set]);
}
