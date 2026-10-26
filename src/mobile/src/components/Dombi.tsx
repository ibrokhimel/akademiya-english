import { Image } from "react-native";
import { animates, rigFor, stillPoseFor } from "../../../core/dombi.js";
import { dombiPoses } from "../data/dombiPoses";
import { useDombiLevel } from "../lib/dombiLevel";
import { useApp } from "../lib/store";
import { Actor } from "./Actor";

export type DombiMoment =
  | "idle" | "guide" | "glad" | "night" | "onboarding" | "emptyTab" | "yourTurn" | "explaining"
  | "correct" | "notYet" | "helpOffer" | "helpSheet" | "mistakes" | "lessonResult" | "levelUp"
  | "activityEnd" | "talking" | "listening" | "sceneGuide" | "micOff" | "waiting" | "speakTab";

/**
 * Dombi at one moment of the app (docs/superpowers/specs/2026-10-26-dombi-moment-map.md).
 * Plays the Rive rig when this phone's level animates the moment, otherwise shows the still pose.
 */
export function Dombi({ moment, size }: { moment: DombiMoment; size: number }) {
  const level = useDombiLevel();
  const { settings } = useApp();
  if (animates(moment, level)) {
    const rig = rigFor(moment) as { mood: string; gesture?: string; trigger?: string; talking?: boolean; listening?: boolean };
    return <Actor size={size} mood={rig.mood} gesture={rig.gesture} trigger={rig.trigger} talking={rig.talking} listening={rig.listening} />;
  }
  const pose = stillPoseFor(moment);
  const source = dombiPoses[settings.dark ? pose + "-dark" : pose] ?? dombiPoses[pose];
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />;
}
