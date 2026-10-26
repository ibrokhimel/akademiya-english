import * as Haptics from "expo-haptics";
import { useEffect,useState } from "react";
import { Pressable,View,useWindowDimensions } from "react-native";
import { Gesture,GestureDetector } from "react-native-gesture-handler";
import Animated,{ Extrapolation,interpolate,useAnimatedStyle,useSharedValue,withSpring,type SharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { spring } from "./Motion";
import { Icon,Txt,useTheme,violet } from "./ui";

const labels = ["O'rganish", "Natijalar", "Profil"];
const icons = ["tab-home", "tab-progress", "tab-profile"];
const SQUARE_W = 52, SQUARE_H = 40, LIFT = 6;

// One highlight square rides over the row. Its place is one number, `position`:
// 0, 1, 2 sit on a tab, fractions sit between tabs. Tapping a tab springs it over;
// holding the active tab's square and sliding drags it, and letting go picks the nearest tab.
export function AppTabBar({ selected, onPress }: { selected: number; onPress: (index: number) => void }) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2);
  const count = labels.length;
  const position = useSharedValue(selected), itemWidth = useSharedValue(0), grabbed = useSharedValue(0);
  const dragging = useSharedValue(false), touchIndex = useSharedValue(-1), hoverShared = useSharedValue(selected), active = useSharedValue(selected);
  const [hover, setHover] = useState(-1);
  const shown = hover >= 0 ? hover : selected;

  useEffect(() => {
    active.set(selected);
    if (dragging.get()) return;
    position.set(withSpring(selected, spring.gentle));
  }, [selected, active, dragging, position]);

  const pickUp = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  const tick = (index: number) => { setHover(index); void Haptics.selectionAsync().catch(() => {}); };
  const release = (index: number) => { setHover(-1); if (index !== active.get()) onPress(index); };

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-24, 24])
    .onBegin(event => {
      const w = itemWidth.get();
      touchIndex.set(w ? Math.floor(event.x / w) : -1);
    })
    .onStart(() => {
      if (touchIndex.get() !== active.get()) return;
      dragging.set(true);
      hoverShared.set(active.get());
      grabbed.set(withSpring(1, spring.snappy));
      scheduleOnRN(pickUp);
    })
    .onUpdate(event => {
      const w = itemWidth.get();
      if (!dragging.get() || !w) return;
      const next = Math.min(Math.max(event.x / w - 0.5, 0), count - 1);
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

  const square = useAnimatedStyle(() => ({
    opacity: itemWidth.get() ? 1 : 0,
    transform: [
      { translateX: position.get() * itemWidth.get() + (itemWidth.get() - SQUARE_W * scale) / 2 },
      { scale: 1 + grabbed.get() * 0.1 },
    ],
  }));

  return <SafeAreaView edges={["bottom", "left", "right"]} style={{ backgroundColor: c.card, borderTopWidth: 2 * scale, borderColor: c.line }}>
    <View style={{ paddingHorizontal: 24 * scale, paddingTop: 10 * scale, paddingBottom: 22 * scale }}>
      <GestureDetector gesture={pan}>
        <View accessibilityRole="tablist" style={{ flexDirection: "row" }} onLayout={event => itemWidth.set(event.nativeEvent.layout.width / count)}>
          <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width: SQUARE_W * scale, height: SQUARE_H * scale, borderRadius: 14 * scale, borderWidth: 2 * scale, borderColor: c.softLine, backgroundColor: c.soft }, square]} />
          {labels.map((label, index) => <TabItem key={label} index={index} label={label} icon={icons[index]} position={position} scale={scale}
            shown={shown === index} selected={selected === index} onPress={() => onPress(index)} />)}
        </View>
      </GestureDetector>
    </View>
  </SafeAreaView>;
}

function TabItem({ index, label, icon, position, scale, shown, selected, onPress }: {
  index: number; label: string; icon: string; position: SharedValue<number>; scale: number; shown: boolean; selected: boolean; onPress: () => void;
}) {
  const c = useTheme();
  // The tab under the square rises, and hands the lift to its neighbour as the square crosses.
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(Math.abs(position.get() - index), [0, 1], [-LIFT * scale, 0], Extrapolation.CLAMP) }],
  }));
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={{ flex: 1, alignItems: "center" }}>
    <Animated.View style={[{ alignItems: "center" }, lift]}>
      <View style={{ height: SQUARE_H * scale, justifyContent: "center", opacity: shown ? 1 : 0.5 }}>
        <Icon name={icon} size={28 * scale} />
      </View>
      <Txt numberOfLines={1} style={{ marginTop: (LIFT + 4) * scale, fontSize: 12 * scale, fontFamily: "Nunito_800ExtraBold", color: violet, opacity: shown ? 1 : 0 }}>{label}</Txt>
    </Animated.View>
  </Pressable>;
}
