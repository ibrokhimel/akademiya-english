import { useEffect,useState } from "react";
import { Pressable,View } from "react-native";
import Animated,{ useAnimatedStyle,useReducedMotion,useSharedValue,withTiming } from "react-native-reanimated";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";
export function SegmentControl({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (key: string) => void }) {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp(), reduced = useReducedMotion();
  const [boxes, setBoxes] = useState<Record<string, { x: number; width: number }>>({});
  const left = useSharedValue(0), width = useSharedValue(0);
  useEffect(() => { const box = boxes[value]; if (!box) return; left.set(withTiming(box.x, { duration: reduced ? 0 : 180 })); width.set(withTiming(box.width, { duration: reduced ? 0 : 180 })); }, [boxes, value, left, width, reduced]);
  const thumb = useAnimatedStyle(() => ({ left: left.get(), width: width.get(), opacity: width.get() ? 1 : 0 }));
  return <View style={{ flexDirection: "row", gap: d(4), padding: d(4), backgroundColor: c.surface, borderRadius: d(14) }}><Animated.View style={[{ position: "absolute", top: d(4), bottom: d(4), borderRadius: d(10), backgroundColor: c.card, borderWidth: d(2), borderColor: c.line }, thumb]} />{options.map(option => <Pressable key={option.key} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: value === option.key }} onLayout={event => { const { x, width } = event.nativeEvent.layout; setBoxes(old => old[option.key]?.x === x && old[option.key]?.width === width ? old : { ...old, [option.key]: { x, width } }); }} onPress={() => { if (value !== option.key) { sound("seg", settings.sound); onChange(option.key); } }} style={{ paddingHorizontal: d(8), paddingVertical: d(7) }}><Txt style={{ fontSize: d(13), fontFamily: "Nunito_800ExtraBold", color: value === option.key ? c.text : c.muted }}>{option.label}</Txt></Pressable>)}</View>;
}
