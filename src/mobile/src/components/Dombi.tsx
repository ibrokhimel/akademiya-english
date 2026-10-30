import { useCallback, useState, type RefObject } from "react";
import { Image, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { animates, rigFor, stillPoseFor } from "../../../core/dombi.js";
import { dombiPoses } from "../data/dombiPoses";
import { useDombiLevel } from "../lib/dombiLevel";
import { useApp } from "../lib/store";
import { Actor, type Rig } from "./Actor";

export type DombiMoment =
  | "idle" | "guide" | "glad" | "night" | "onboarding" | "emptyTab" | "yourTurn" | "explaining"
  | "correct" | "notYet" | "helpOffer" | "helpSheet" | "mistakes" | "lessonResult" | "levelUp"
  | "activityEnd" | "talking" | "listening" | "sceneGuide" | "micOff" | "waiting" | "speakTab" | "offline" | "error"
  | "welcome" | "onboardingIdle" | "thanks" | "confidenceUp";

/**
 * Dombi at one moment of the app (docs/superpowers/specs/2026-10-26-dombi-moment-map.md).
 * Plays the Rive rig when this phone's level animates the moment, otherwise shows the still pose.
 */
export function Dombi({ moment, size, awake = false, rigRef, mood, outfit }: { moment: DombiMoment; size: number; awake?: boolean; rigRef?: RefObject<Rig | null>; /** a screen-specific face for the rig, e.g. the confidence survey */ mood?: string; /** an outfit that is not saved yet (the Dombi editor's preview) */ outfit?: string }) {
  const level = useDombiLevel();
  const reduce = useReducedMotion();
  const { isDark } = useApp();
  // The rig a still-picture phone woke for; the picture stays on top until it draws, so he never blinks out.
  const [drawn, setDrawn] = useState(false);
  const markDrawn = useCallback(() => setDrawn(true), []);
  const pose = stillPoseFor(moment);
  const source = dombiPoses[isDark ? pose + "-dark" : pose] ?? dombiPoses[pose];
  const picture = (style?: object) => <Image source={source} style={{ width: size, height: size, ...style }} resizeMode="contain" accessibilityIgnoresInvertColors />;
  const animated = animates(moment, level);
  if (!animated && drawn && !awake) setDrawn(false);
  // awake: the learner is touching him, so a still-picture phone shows the rig while he plays (owner, 2026-10-27).
  if (animated || (awake && !reduce)) {
    const rig = { ...rigFor(moment), ...(mood ? { mood } : null) } as { mood: string; gesture?: string; trigger?: string; talking?: boolean; listening?: boolean };
    const actor = <Actor size={size} mood={rig.mood} gesture={rig.gesture} trigger={rig.trigger} talking={rig.talking} listening={rig.listening} rigRef={rigRef} onReady={animated ? undefined : markDrawn} outfit={outfit} />;
    if (animated) return actor;
    return <View style={{ width: size, height: size }}>{actor}{drawn ? null : picture({ position: "absolute" })}</View>;
  }
  return picture();
}
