import { useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { FeedContext } from "./LessonDombi";

/**
 * A word tile you can drag onto Dombi to feed him (owner, 2026-10-27: lesson word tiles). A tap still picks the word:
 * the drag starts only after 10 points. Eaten, the tile is gone for 3.2 s and comes back; let go anywhere else, it
 * springs back. It never counts as an answer. Outside a lesson (no FeedContext) it is a plain tile.
 */
export function FeedDrag({ word, enabled, children }: { word: string; enabled: boolean; children: ReactNode }) {
  const feedRef = useContext(FeedContext);
  const tx = useSharedValue(0), ty = useSharedValue(0), up = useSharedValue(0), shown = useSharedValue(1);
  const back = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (back.current) clearTimeout(back.current); }, []);
  const home = useCallback(() => { tx.set(withSpring(0)); ty.set(withSpring(0)); up.set(0); }, [tx, ty, up]);
  const letGo = useCallback((x: number, y: number) => {
    const feed = feedRef?.current;
    if (!feed) return home();
    void feed(x, y, word).then((ate) => {
      if (!ate) return home();
      shown.set(0); tx.set(0); ty.set(0); up.set(0);
      back.current = setTimeout(() => shown.set(withTiming(1, { duration: 250 })), 3200);
    });
  }, [feedRef, word, home, shown, tx, ty, up]);
  // RNGH registers these callbacks now and invokes them only for later touch
  // events. The compiler's refs rule incorrectly treats registration as a call.
  /* eslint-disable react-hooks/refs */
  const drag = useMemo(() => Gesture.Pan()
    .enabled(enabled && !!feedRef)
    .runOnJS(true)
    .activeOffsetX([-10, 10]).activeOffsetY([-10, 10])
    .onStart(() => up.set(1))
    .onUpdate((e) => { tx.set(e.translationX); ty.set(e.translationY); })
    .onFinalize((e, ok) => { if (ok) letGo(e.absoluteX, e.absoluteY); else home(); }), [enabled, feedRef, letGo, home, tx, ty, up]);
  /* eslint-enable react-hooks/refs */
  const style = useAnimatedStyle(() => ({ opacity: shown.value, zIndex: up.value ? 10 : 0, elevation: up.value ? 10 : 0, transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: up.value ? 1.08 : 1 }] }));
  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}
