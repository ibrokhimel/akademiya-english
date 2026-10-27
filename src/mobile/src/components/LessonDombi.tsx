import { useEffect, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { pickSpot } from "../../../core/spots.js";
import type { Space } from "./Blocks";
import type { DombiMoment } from "./Dombi";
import { DombiPlay } from "./DombiPlay";
import { type } from "./system";
import { useDs } from "./TabChrome";
import { Txt } from "./ui";

/** Where Dombi sits, in the lesson screen's coordinates: his drawn box (80, or 48 when nothing bigger is free). */
export type Spot = { x: number; y: number; size: number };

/**
 * Dombi in a lesson (owner, 2026-10-27): he sits where the exercise shows nothing, nearest to where he was.
 * He starts by the title (top right) and keeps his place from exercise to exercise while it stays free. Thrown or
 * dropped, he lands on the floor of the exercise and stays there; 4 s untouched, he hops to the free place nearest
 * him. A tap opens help, as before.
 * space: the exercise's scroll view and blocks, in lesson coordinates. start/onSpot keep his place while he is hidden
 * behind the answer panel.
 */
export function LessonDombi({ space, start, onSpot, moment, line, onPress }: { space: Space | null; start: Spot | null; onSpot: (spot: Spot) => void; moment: DombiMoment; line?: string; onPress: () => void }) {
  const { width } = useWindowDimensions(), ds = useDs(), reduce = useReducedMotion();
  const k = Math.min(width / 390, 1.2), d = (n: number) => n * k, big = d(80);
  const pick = (target: { x: number; y: number }) => space && pickSpot({ area: space.view, blocks: space.blocks, target, sizes: [big, d(48)], gap: d(8) });

  // A new exercise (or a change in this one) may cover his place: he moves to the nearest free one.
  const [spot, setSpot] = useState<Spot | null>(start);
  const [seen, setSeen] = useState<Space | null>(null);
  if (space !== seen) {
    setSeen(space);
    const next = pick(spot ? { x: spot.x + spot.size / 2, y: spot.y + spot.size / 2 } : { x: space ? space.view.x + space.view.w : 0, y: space?.view.y ?? 0 });
    if (next && (!spot || next.x !== spot.x || next.y !== spot.y || next.size !== spot.size)) setSpot(next);
  }

  // His 80 box is laid out with its feet at the spot's bottom centre; a 48 spot shrinks him there.
  const ox = useSharedValue(0), oy = useSharedValue(0), lift = useSharedValue(0), placed = useRef(false);
  useEffect(() => {
    if (!spot) return;
    onSpot(spot);
    const x = spot.x + spot.size / 2 - big / 2, y = spot.y + spot.size - big;
    if (!placed.current || reduce) { placed.current = true; ox.set(x); oy.set(y); return; }
    const far = Math.hypot(x - ox.get(), y - oy.get()), ms = Math.min(600, 260 + far * 0.6), ease = Easing.inOut(Easing.quad);
    ox.set(withTiming(x, { duration: ms, easing: ease })); oy.set(withTiming(y, { duration: ms, easing: ease }));
    lift.set(withSequence(withTiming(-Math.min(60, 20 + far * 0.15), { duration: ms / 2, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: ms / 2, easing: Easing.in(Easing.quad) })));
  }, [spot, big, reduce, onSpot, ox, oy, lift]);
  const box = useAnimatedStyle(() => ({ transform: [{ translateX: ox.value }, { translateY: oy.value + lift.value }] }));

  // Back from where he landed: he is drawn where he is, then hops to the nearest free place.
  const drop = (dx: number, dy: number) => {
    if (!spot) return;
    ox.set(ox.get() + dx); oy.set(oy.get() + dy);
    setSpot(pick({ x: spot.x + spot.size / 2 + dx, y: spot.y + spot.size / 2 + dy }) ?? { ...spot });
  };

  if (!spot) return null;
  const size = spot.size, left = spot.x + size / 2 > width / 2;
  const ground = space ? Math.max(0, space.view.y + space.view.h - (spot.y + size)) : 0;
  return (
    <Animated.View pointerEvents="box-none" style={[{ position: "absolute", left: 0, top: 0, width: big, height: big }, box]}>
      {line ? (
        <View pointerEvents="none" style={{ position: "absolute", bottom: d(24), ...(left ? { right: big / 2 + size / 2 + d(4) } : { left: big / 2 + size / 2 + d(4) }), width: d(210), backgroundColor: ds.surface, borderColor: ds.line, borderWidth: 2, borderRadius: d(18), ...(left ? { borderBottomRightRadius: d(4) } : { borderBottomLeftRadius: d(4) }), paddingVertical: d(10), paddingHorizontal: d(14), boxShadow: `0 ${d(3)}px 0 ${ds.line}` }}>
          <Txt style={{ ...type("small", d), color: ds.ink }}>{line}</Txt>
        </View>
      ) : null}
      <DombiPlay moment={moment} size={big} rule="perch" onTap={onPress} onDrop={drop} scale={size / big} ground={ground} />
    </Animated.View>
  );
}
