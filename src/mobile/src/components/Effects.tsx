import {
Fit,
RiveView,
useRive,
useViewModelInstance,
type RiveFile,
} from "@rive-app/react-native";
import { useEffect } from "react";
import { View,type StyleProp,type ViewStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useActorFile } from "./Actor";

export function Effect({
  board,
  trigger = "fire",
  color = "#FFC93C",
  delay = 0,
  repeat,
  style,
  lit,
}: {
  board:
    | "Pop"
    | "Confetti"
    | "Embers"
    | "Frost"
    | "Dust"
    | "Rings"
    | "Twinkle"
    | "Voice"
    | "Streak Flame";
  trigger?: string | null;
  color?: string;
  delay?: number;
  repeat?: number;
  style: StyleProp<ViewStyle>;
  lit?: boolean;
}) {
  const file = useActorFile(),
    reduced = useReducedMotion();
  if (!file || reduced) return null;
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      <LoadedEffect
        file={file}
        board={board === "Streak Flame" ? board : "FX " + board}
        trigger={trigger}
        color={color}
        delay={delay}
        repeat={repeat}
        lit={lit}
      />
    </View>
  );
}
function LoadedEffect({
  file,
  board,
  trigger,
  color,
  delay,
  repeat,
  lit,
}: {
  file: RiveFile;
  board: string;
  trigger: string | null;
  color: string;
  delay: number;
  repeat?: number;
  lit?: boolean;
}) {
  const { instance } = useViewModelInstance(file, {
    artboardName: board,
    async: true,
  });
  const { riveViewRef, setHybridRef } = useRive();
  useEffect(() => {
    if (!instance || !riveViewRef) return;
    if (["FX Pop", "FX Rings", "FX Twinkle"].includes(board))
      instance
        .colorProperty("color")
        ?.set(parseInt("FF" + color.replace("#", ""), 16));
    if (board === "Streak Flame") instance.booleanProperty("lit")?.set(!!lit);
    const fire = () => {
      if (trigger) instance.triggerProperty(trigger)?.trigger();
      riveViewRef.playIfNeeded();
    };
    let interval: ReturnType<typeof setInterval> | undefined;
    const timer = setTimeout(() => {
      fire();
      if (repeat) interval = setInterval(fire, repeat);
    }, delay + 60);
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [instance, riveViewRef, board, trigger, color, delay, repeat, lit]);
  return instance ? (
    <RiveView
      file={file}
      hybridRef={setHybridRef}
      artboardName={board}
      stateMachineName="State Machine 1"
      dataBind={instance}
      fit={Fit.Contain}
      autoPlay
      style={{ flex: 1 }}
    />
  ) : null;
}
