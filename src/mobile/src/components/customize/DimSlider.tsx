import { useEffect,useMemo,useRef,useState } from "react";
import { View } from "react-native";
import { Gesture,GestureDetector } from "react-native-gesture-handler";
import { DIM_MAX,clampDim,dimAt } from "../../../../core/showcase.js";
import { Txt,useTheme } from "../ui";
import { useDesignScale } from "../useDesignScale";

/**
 * FON XIRALIGI (screen OPgwZ): "Kam" at the left, "Ko'p" at the right, a violet fill up to the knob. Tap the track or drag
 * the knob; the value moves in steps of 0.05 between 0 and 0.8 (dimAt). Screen readers swipe it up and down.
 */
export function DimSlider({ value, onChange }: { value: number; onChange: (dim: number) => void }) {
  const d = useDesignScale(), c = useTheme();
  const [width, setWidth] = useState(0);
  const knob = d(28);
  // RNGH keeps the callbacks and calls them on later touches; they read the latest width and value through a ref.
  const latest = useRef({ width, value, onChange, knob });
  useEffect(() => { latest.current = { width, value, onChange, knob }; });
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(() => {
    const at = (x: number) => {
      const { width: w, value: v, onChange: change, knob: k } = latest.current;
      if (!w) return;
      const next = dimAt((x - k / 2) / Math.max(1, w - k));
      if (next !== v) { latest.current.value = next; change(next); }
    };
    return Gesture.Simultaneous(
      Gesture.Tap().runOnJS(true).onEnd((e) => at(e.x)),
      Gesture.Pan().runOnJS(true).activeOffsetX([-4, 4]).failOffsetY([-10, 10]).onUpdate((e) => at(e.x)),
    );
  }, []);
  /* eslint-enable react-hooks/refs */
  const left = width ? (value / DIM_MAX) * (width - knob) : 0;
  const step = (by: number) => onChange(clampDim(Math.round((value + by) * 20) / 20));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}>
      <Txt style={{ fontSize: d(13), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>Kam</Txt>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Fon xiraligi"
          accessibilityValue={{ min: 0, max: Math.round(DIM_MAX * 100), now: Math.round(value * 100) }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 0.05 : -0.05)}
          style={{ flex: 1, height: knob + d(8), justifyContent: "center" }}
        >
          <View style={{ height: d(8), borderRadius: d(4), backgroundColor: c.line, marginHorizontal: knob / 2 }}>
            <View style={{ width: left, height: "100%", borderRadius: d(4), backgroundColor: c.accent }} />
          </View>
          <View style={{ position: "absolute", left, width: knob, height: knob, borderRadius: knob / 2, backgroundColor: c.card, borderWidth: d(3), borderColor: c.accent }} />
        </View>
      </GestureDetector>
      <Txt style={{ fontSize: d(13), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>Ko&apos;p</Txt>
    </View>
  );
}
