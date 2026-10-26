import * as Haptics from "expo-haptics";
import { useEffect,useState } from "react";
import { Pressable,View } from "react-native";
import { Gesture,GestureDetector } from "react-native-gesture-handler";
import Animated,{ interpolate,useAnimatedStyle,useSharedValue,withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { spring } from "./Motion";
import { Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";

// Same mechanism as the tab bar: one square whose place is `position` (fractions sit between
// options). Tapping springs it over; holding the selected square and sliding drags it, and
// letting go picks the nearest option.
export function SegmentControl({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (key: string) => void }) {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp();
  const count = options.length;
  const selected = Math.max(0, options.findIndex(option => option.key === value));
  const [boxes, setBoxes] = useState<{ x: number; width: number }[]>([]);
  const position = useSharedValue(selected), grabbed = useSharedValue(0), dragging = useSharedValue(false);
  const touchIndex = useSharedValue(-1), hoverShared = useSharedValue(selected), active = useSharedValue(selected);
  const xs = useSharedValue<number[]>([]), ws = useSharedValue<number[]>([]);
  const [hover, setHover] = useState(-1);
  const shown = hover >= 0 ? hover : selected;
  const ready = boxes.length === count && boxes.every(Boolean);

  useEffect(() => { if (ready) { xs.set(boxes.map(box => box.x)); ws.set(boxes.map(box => box.width)); } }, [ready, boxes, xs, ws]);
  useEffect(() => {
    active.set(selected);
    if (dragging.get()) return;
    position.set(withSpring(selected, spring.gentle));
  }, [selected, active, dragging, position]);

  const choose = (index: number) => { if (options[index].key !== value) { sound("seg", settings.sound); onChange(options[index].key); } };
  const pickUp = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  const tick = (index: number) => { setHover(index); void Haptics.selectionAsync().catch(() => {}); };
  const release = (index: number) => { setHover(-1); choose(index); };

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-24, 24])
    .onBegin(event => {
      const x = xs.get(), w = ws.get();
      touchIndex.set(x.findIndex((left, index) => event.x >= left && event.x < left + w[index]));
    })
    .onStart(() => {
      if (touchIndex.get() !== active.get()) return;
      dragging.set(true);
      hoverShared.set(active.get());
      grabbed.set(withSpring(1, spring.snappy));
      scheduleOnRN(pickUp);
    })
    .onUpdate(event => {
      const x = xs.get(), w = ws.get();
      if (!dragging.get() || x.length !== count) return;
      // The square's centre follows the finger, measured between the options' centres.
      const centres = x.map((left, index) => left + w[index] / 2);
      let next = 0;
      if (event.x >= centres[count - 1]) next = count - 1;
      else for (let index = 0; index < count - 1; index++) {
        if (event.x < centres[index + 1]) { next = index + Math.max(0, (event.x - centres[index]) / (centres[index + 1] - centres[index])); break; }
      }
      position.set(next);
      const nearest = Math.round(next);
      if (nearest !== hoverShared.get()) { hoverShared.set(nearest); scheduleOnRN(tick, nearest); }
    })
    .onEnd(() => {
      if (!dragging.get()) return;
      const target = Math.round(position.get());
      position.set(withSpring(target, spring.gentle));
      scheduleOnRN(release, target);
    })
    .onFinalize(() => {
      if (!dragging.get()) return;
      dragging.set(false);
      grabbed.set(withSpring(0, spring.snappy));
    });

  const thumb = useAnimatedStyle(() => {
    const x = xs.get(), w = ws.get();
    if (x.length !== count) return { opacity: 0 };
    const steps = x.map((_, index) => index);
    const width = count > 1 ? interpolate(position.get(), steps, w) : w[0];
    return { opacity: 1, width, transform: [{ translateX: count > 1 ? interpolate(position.get(), steps, x) : x[0] }, { scale: 1 + grabbed.get() * 0.1 }] };
  });

  return <GestureDetector gesture={pan}>
    <View style={{ flexDirection: "row", gap: d(4), padding: d(4), backgroundColor: c.surface, borderRadius: d(14) }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: d(4), bottom: d(4), borderRadius: d(10), backgroundColor: c.card, borderWidth: d(2), borderColor: c.line }, thumb]} />
      {options.map((option, index) => <Pressable key={option.key} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: value === option.key }}
        onLayout={event => { const { x, width } = event.nativeEvent.layout; setBoxes(old => { if (old[index]?.x === x && old[index]?.width === width) return old; const next = [...old]; next[index] = { x, width }; return next; }); }}
        onPress={() => choose(index)} style={{ paddingHorizontal: d(8), paddingVertical: d(7) }}>
        <Txt style={{ fontSize: d(13), fontFamily: "Nunito_800ExtraBold", color: shown === index ? c.text : c.muted }}>{option.label}</Txt>
      </Pressable>)}
    </View>
  </GestureDetector>;
}
