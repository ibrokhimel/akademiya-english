import { useCallback,useLayoutEffect,useMemo,useState } from "react";
import { Pressable,View } from "react-native";
import { Gesture,GestureDetector } from "react-native-gesture-handler";
import Animated,{ useAnimatedStyle,useSharedValue,withTiming,type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { defaultSections,moveSection,toggleSection } from "../../../../core/showcase.js";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { RowGroup } from "../../components/customize/RowGroup";
import { ToggleRow } from "../../components/customize/ToggleRow";
import { Txt,useTheme,violet } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { profileSections } from "../../data/cosmetics";
import { useProfile,type Profile } from "../../lib/store";

type Section = Profile["look"]["sections"][number];

/** The ⋮⋮ grip: two columns of three dots. */
function Grip() {
  const d = useDesignScale(), c = useTheme();
  const dot = <View style={{ width: d(3.5), height: d(3.5), borderRadius: d(2), backgroundColor: c.muted }} />;
  const column = <View style={{ gap: d(3) }}>{dot}{dot}{dot}</View>;
  return <View style={{ flexDirection: "row", gap: d(3) }}>{column}{column}</View>;
}

/**
 * One row. While a row is dragged (`from` is its index), it follows the finger and the rows between its old and new place
 * slide one row up or down to make room; on release the list takes the new order (moveSection).
 */
function SectionRow({ section, label, index, count, rowH, from, dy, onToggle, onMove, onDrag, onMeasure }: {
  section: Section;
  label: string;
  index: number;
  count: number;
  rowH: number;
  from: SharedValue<number>;
  dy: SharedValue<number>;
  onToggle: (on: boolean) => void;
  onMove: (from: number, to: number) => void;
  onDrag: (dragging: boolean) => void;
  /** the row's natural height (bigger text makes it taller); every row takes the tallest, so a drag moves by whole rows */
  onMeasure: (height: number) => void;
}) {
  const c = useTheme(), d = useDesignScale();
  const style = useAnimatedStyle(() => {
    const f = from.get();
    if (f === index) return { zIndex: 2, transform: [{ translateY: dy.get() }, { scale: 1.02 }] };
    if (f < 0) return { zIndex: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    const to = Math.max(0, Math.min(count - 1, Math.round(f + dy.get() / rowH)));
    const shift = f < index && index <= to ? -rowH : to <= index && index < f ? rowH : 0;
    return { zIndex: 0, transform: [{ translateY: withTiming(shift, { duration: 120 }) }, { scale: 1 }] };
  });
  const drag = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .onStart(() => { from.set(index); dy.set(0); scheduleOnRN(onDrag, true); })
    .onUpdate((e) => { dy.set(Math.max(-index * rowH, Math.min((count - 1 - index) * rowH, e.translationY))); })
    .onEnd(() => { scheduleOnRN(onMove, index, Math.round(index + dy.get() / rowH)); })
    .onFinalize(() => { scheduleOnRN(onDrag, false); }), [index, count, rowH, from, dy, onMove, onDrag]);
  const handle = (
    <GestureDetector gesture={drag}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label}: tartibi`}
        accessibilityActions={[{ name: "increment", label: "Yuqoriga" }, { name: "decrement", label: "Pastga" }]}
        onAccessibilityAction={(e) => onMove(index, e.nativeEvent.actionName === "increment" ? index - 1 : index + 1)}
        hitSlop={{ top: d(8), bottom: d(8), left: d(10), right: d(6) }}
        style={{ height: rowH, justifyContent: "center" }}
      >
        <Grip />
      </View>
    </GestureDetector>
  );
  return (
    <Animated.View style={[{ height: rowH, justifyContent: "center", backgroundColor: c.card }, style]}>
      <View onLayout={(e) => onMeasure(e.nativeEvent.layout.height)}>
        <ToggleRow label={label} value={section.shown} onChange={onToggle} dimWhenOff left={handle} />
      </View>
    </Animated.View>
  );
}

/**
 * Nimalar ko'rinsin (screen VgCJ2): a switch per part of the Profile tab and the ⋮⋮ handle to drag it to another place.
 * ASLIGA QAYTARISH puts back the default order and switches. Which numbers show is chosen in Statistika.
 */
export default function SectionsEditor() {
  const d = useDesignScale(), c = useTheme(), { profile, setProfile } = useProfile();
  const [sections, setSections] = useState<Section[]>(profile.look.sections);
  const [dragging, setDragging] = useState(false);
  const [rowH, setRowH] = useState(d(52));
  const measure = useCallback((h: number) => setRowH((r) => (h > r + 0.5 ? h : r)), []);
  const from = useSharedValue(-1), dy = useSharedValue(0);
  // the rows stop sliding once the new order is drawn, so nothing jumps back for a frame
  useLayoutEffect(() => { from.set(-1); dy.set(0); }, [sections, from, dy]);
  const move = useCallback((a: number, b: number) => {
    if (a === b || b < 0 || b >= sections.length) { from.set(-1); dy.set(0); return; }
    setSections((list) => moveSection(list, a, b));
  }, [sections.length, from, dy]);
  return (
    <EditorScreen title="Nimalar ko'rinsin" scrollEnabled={!dragging} onSave={() => setProfile((p) => ({ ...p, look: { ...p.look, sections } }))}>
      <Txt style={{ fontSize: d(13), lineHeight: d(18), color: c.muted, fontFamily: "Nunito_700Bold" }}>Ko&apos;rsatish yoki yashirish uchun bosing. Tartibini o&apos;zgartirish uchun ⋮⋮ ni torting.</Txt>
      <RowGroup>
        {sections.map((s, i) => (
          <SectionRow
            key={s.id}
            section={s}
            label={profileSections.find((x) => x.id === s.id)?.label ?? s.id}
            index={i}
            count={sections.length}
            rowH={rowH}
            from={from}
            dy={dy}
            onToggle={(on) => setSections((list) => toggleSection(list, s.id, on))}
            onMove={move}
            onDrag={setDragging}
            onMeasure={measure}
          />
        ))}
      </RowGroup>
      <Pressable accessibilityRole="button" onPress={() => setSections(defaultSections())} style={{ alignSelf: "center", paddingVertical: d(10), paddingHorizontal: d(16) }}>
        <Txt style={{ fontSize: d(14), letterSpacing: d(0.6), color: violet, fontFamily: "Nunito_900Black" }}>ASLIGA QAYTARISH</Txt>
      </Pressable>
    </EditorScreen>
  );
}
