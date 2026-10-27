import { createContext, useEffect, useRef, useState, type RefObject } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { pickSpot } from "../../../core/spots.js";
import type { Space } from "./Blocks";
import type { DombiMoment } from "./Dombi";
import { DombiPlay } from "./DombiPlay";
import { type } from "./system";
import { useDs } from "./TabChrome";
import { Txt } from "./ui";

/** A word tile let go at a screen point: resolves true when it landed on Dombi and he ate it (motion-plan §8, owner 2026-10-27: lesson word tiles). */
export type Feed = (x: number, y: number, word: string) => Promise<boolean>;
/** The lesson fills this with Dombi's feeder; word tiles read it. Outside a lesson it is absent and tiles do not drag. */
export const FeedContext = createContext<RefObject<Feed | null> | null>(null);

/** Where Dombi sits, in the lesson screen's coordinates: his drawn box (80, or 48 when nothing bigger is free). */
export type Spot = { x: number; y: number; size: number };

/**
 * Dombi in a lesson (owner, 2026-10-27): he sits where the exercise shows nothing, nearest to where he was.
 * He starts by the title (top right) and keeps his place from exercise to exercise while it stays free. Thrown or
 * dropped, he lands on the floor of the exercise and stays there; 4 s untouched, he hops to the free place nearest
 * him. A tap opens help, as before.
 * space: the exercise's scroll view and blocks, in lesson coordinates. start/onSpot keep his place while he is hidden
 * behind the answer panel. feedRef: filled with his feeder for word tiles dropped on him.
 */
export function LessonDombi({ space, start, onSpot, moment, line, onPress, feedRef }: { space: Space | null; start: Spot | null; onSpot: (spot: Spot) => void; moment: DombiMoment; line?: string; onPress: () => void; feedRef?: RefObject<Feed | null> }) {
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

  // A tile let go on him: he eats it, and the word shows on him for a moment.
  const bodyRef = useRef<View>(null), eventsRef = useRef<((type: string) => boolean) | null>(null);
  const [eaten, setEaten] = useState<{ word: string; n: number } | null>(null);
  const size = spot?.size ?? big;
  useEffect(() => {
    if (!feedRef) return;
    feedRef.current = (x, y, word) => new Promise((done) => {
      if (!bodyRef.current) return done(false);
      bodyRef.current.measureInWindow((bx, by, w, h) => {
        const half = (size / big) * (w / 2), cx = bx + w / 2, bottom = by + h, pad = 10 * k;
        const hit = x > cx - half - pad && x < cx + half + pad && y > bottom - (size / big) * h - pad && y < bottom + pad;
        const ate = hit && !!eventsRef.current?.("feed");
        if (ate) setEaten((e) => ({ word, n: (e?.n ?? 0) + 1 }));
        done(ate);
      });
    });
    return () => { feedRef.current = null; };
  }, [feedRef, size, big, k]);
  useEffect(() => { if (!eaten) return; const t = setTimeout(() => setEaten(null), 1700); return () => clearTimeout(t); }, [eaten]);

  if (!spot) return null;
  const left = spot.x + size / 2 > width / 2;
  const ground = space ? Math.max(0, space.view.y + space.view.h - (spot.y + size)) : 0;
  return (
    <Animated.View pointerEvents="box-none" style={[{ position: "absolute", left: 0, top: 0, width: big, height: big }, box]}>
      {line ? (
        <View pointerEvents="none" style={{ position: "absolute", bottom: d(24), ...(left ? { right: big / 2 + size / 2 + d(4) } : { left: big / 2 + size / 2 + d(4) }), width: d(210), backgroundColor: ds.surface, borderColor: ds.line, borderWidth: 2, borderRadius: d(18), ...(left ? { borderBottomRightRadius: d(4) } : { borderBottomLeftRadius: d(4) }), paddingVertical: d(10), paddingHorizontal: d(14), boxShadow: `0 ${d(3)}px 0 ${ds.line}` }}>
          <Txt style={{ ...type("small", d), color: ds.ink }}>{line}</Txt>
        </View>
      ) : null}
      <View ref={bodyRef} collapsable={false}>
        <DombiPlay moment={moment} size={big} rule="perch" onTap={onPress} onDrop={drop} scale={size / big} ground={ground} eventsRef={eventsRef} />
      </View>
      {eaten ? (
        <Animated.View key={eaten.n} pointerEvents="none" entering={FadeIn.duration(250)} exiting={FadeOut.duration(400)} style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.35, alignItems: "center" }}>
          <Txt style={{ ...type("small", d), fontFamily: "Nunito_900Black", color: "#FFFFFF" }}>{eaten.word}</Txt>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
