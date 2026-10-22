import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated,{ interpolateColor,useAnimatedStyle,useReducedMotion,useSharedValue,withTiming } from "react-native-reanimated";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { useDesignScale } from "./useDesignScale";

export function ToggleControl({ label, value, onChange, offColor }: { label: string; value: boolean; onChange: (on: boolean) => void; offColor: string }) {
  const d = useDesignScale(), reduced = useReducedMotion();
  const { settings } = useApp();
  const position = useSharedValue(value ? 1 : 0);
  useEffect(() => { position.set(withTiming(value ? 1 : 0, { duration: reduced ? 0 : 180 })); }, [value, position, reduced]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(position.get(), [0, 1], [offColor, "#7B5CFF"]) }));
  const travel = d(20);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() * travel }, { scaleX: reduced ? 1 : 1 + Math.sin(position.get() * Math.PI) * .18 }, { scaleY: reduced ? 1 : 1 - Math.sin(position.get() * Math.PI) * .08 }] }));
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} hitSlop={d(6)} onPress={() => { sound(value ? "switch-off" : "switch-on", settings.sound); onChange(!value); }}>
    <Animated.View style={[{ width: d(52), height: d(32), borderRadius: d(16), padding: d(3) }, track]}><Animated.View style={[{ width: d(26), height: d(26), borderRadius: d(13), backgroundColor: "#FFFFFF" }, knob]} /></Animated.View>
  </Pressable>;
}
