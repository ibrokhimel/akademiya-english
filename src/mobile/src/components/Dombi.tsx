import type { RefObject } from "react";
import { Image } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { animates, rigFor, stillPoseFor } from "../../../core/dombi.js";
import { dombiPoses } from "../data/dombiPoses";
import { useDombiLevel } from "../lib/dombiLevel";
import { useApp } from "../lib/store";
import { Actor, type Rig } from "./Actor";

export type DombiMoment =
  | "idle" | "guide" | "glad" | "night" | "onboarding" | "emptyTab" | "yourTurn" | "explaining"
  | "correct" | "notYet" | "helpOffer" | "helpSheet" | "mistakes" | "lessonResult" | "levelUp"
  | "activityEnd" | "talking" | "listening" | "sceneGuide" | "micOff" | "waiting" | "speakTab" | "offline" | "error";

/**
 * Dombi at one moment of the app (docs/superpowers/specs/2026-10-26-dombi-moment-map.md).
 * Plays the Rive rig when this phone's level animates the moment, otherwise shows the still pose.
 */
export function Dombi({ moment, size, awake = false, rigRef }: { moment: DombiMoment; size: number; awake?: boolean; rigRef?: RefObject<Rig | null> }) {
  const level = useDombiLevel();
  const reduce = useReducedMotion();
  const { settings } = useApp();
  // awake: the learner is touching him, so a still-picture phone shows the rig while he plays (owner, 2026-10-27).
  if (animates(moment, level) || (awake && !reduce)) {
    const rig = rigFor(moment) as { mood: string; gesture?: string; trigger?: string; talking?: boolean; listening?: boolean };
    return <Actor size={size} mood={rig.mood} gesture={rig.gesture} trigger={rig.trigger} talking={rig.talking} listening={rig.listening} rigRef={rigRef} />;
  }
  const pose = stillPoseFor(moment);
  const source = dombiPoses[settings.dark ? pose + "-dark" : pose] ?? dombiPoses[pose];
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />;
}
