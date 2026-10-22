import { useFocusEffect } from "expo-router";
import {
useCallback,
useEffect,
useRef,
useState,
type ReactNode,
} from "react";
import {
Text,
View,
useWindowDimensions,
type StyleProp,
type TextStyle,
type ViewStyle,
} from "react-native";
import Animated,{
Easing,
FadeInDown,
FadeOut,
LinearTransition,
ReduceMotion,
SlideInDown,
ZoomIn,
cancelAnimation,
useAnimatedStyle,
useReducedMotion,
useSharedValue,
withDelay,
withRepeat,
withSequence,
withSpring,
withTiming,
} from "react-native-reanimated";
import { useApp } from "../lib/store";

// Three springs for everything that moves: things overshoot a little and settle,
// instead of stopping dead at the end of a fixed timing.
// gentle: cards and panels arriving · snappy: presses and small state changes · bouncy: pops and rewards
export const spring = {
  gentle: { mass: 1, stiffness: 170, damping: 18, reduceMotion: ReduceMotion.System },
  snappy: { mass: 1, stiffness: 520, damping: 26, reduceMotion: ReduceMotion.System },
  bouncy: { mass: 1, stiffness: 380, damping: 13, reduceMotion: ReduceMotion.System },
} as const;
// Gap between items in a staggered entrance.
export const STAGGER = 45;

export const closeGap = LinearTransition.springify()
  .mass(1).stiffness(spring.gentle.stiffness).damping(spring.gentle.damping)
  .reduceMotion(ReduceMotion.System);
// Entrances for one-off views (feedback panels, badges, sheets content).
export const arriveIn = FadeInDown.springify()
  .mass(1).stiffness(spring.gentle.stiffness).damping(spring.gentle.damping)
  .reduceMotion(ReduceMotion.System);
export const popIn = ZoomIn.springify()
  .mass(1).stiffness(spring.bouncy.stiffness).damping(spring.bouncy.damping)
  .reduceMotion(ReduceMotion.System);
export const panelIn = SlideInDown.springify()
  .mass(1).stiffness(spring.gentle.stiffness).damping(spring.gentle.damping + 4)
  .reduceMotion(ReduceMotion.System);
export function AudioBars({
  color = "#FFFFFF",
  size = 30,
  count = 3,
}: {
  color?: string;
  size?: number;
  count?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: size / 8,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <AudioBar key={i} index={i} color={color} size={size} />
      ))}
    </View>
  );
}
function AudioBar({
  index,
  color,
  size,
}: {
  index: number;
  color: string;
  size: number;
}) {
  const phase = useSharedValue(0),
    reduced = useReducedMotion();
  useEffect(() => {
    if (!reduced)
      phase.set(
        withDelay(
          index * 70,
          withRepeat(withTiming(1, { duration: 260 + index * 40 }), -1, true),
        ),
      );
    return () => cancelAnimation(phase);
  }, [phase, reduced, index]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.3 + phase.get() * 0.7 }],
  }));
  return (
    <Animated.View
      style={[
        {
          height: size * 0.8,
          width: size / 6,
          borderRadius: size / 12,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
// A card that rises into place on a spring, one after another by index.
// It plays again each time its screen comes into view (switching tabs, coming back),
// without remounting, so scroll position and state are kept.
export function Arrive({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const shown = useSharedValue(reduced ? 1 : 0);
  useFocusEffect(
    useCallback(() => {
      if (reduced) {
        shown.set(1);
        return;
      }
      shown.set(0);
      shown.set(withDelay(index * STAGGER, withSpring(1, spring.gentle)));
      return () => cancelAnimation(shown);
    }, [shown, reduced, index]),
  );
  const motion = useAnimatedStyle(() => ({
    opacity: Math.min(1, shown.get() * 1.6),
    transform: [
      { translateY: (1 - shown.get()) * 18 },
      { scale: 0.97 + shown.get() * 0.03 },
    ],
  }));
  return (
    <Animated.View
      exiting={FadeOut.duration(120)}
      layout={closeGap}
      style={[style, motion]}
    >
      {children}
    </Animated.View>
  );
}
export function Fill({
  value,
  color,
  style,
}: {
  value: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withSpring(Math.max(0, Math.min(1, value)), spring.gentle));
  }, [value, progress]);
  const animated = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, progress.get())) * 100}%`, // the spring may overshoot
  }));
  return (
    <Animated.View
      style={[
        { height: "100%", backgroundColor: color, borderRadius: 10 },
        style,
        animated,
      ]}
    />
  );
}
export function Pulse({
  children,
  style,
  halo = false,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  halo?: boolean;
}) {
  const phase = useSharedValue(0),
    reduced = useReducedMotion();
  useFocusEffect(
    useCallback(() => {
      if (!reduced)
        phase.set(
          withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }),
            -1,
            !halo,
          ),
        );
      return () => cancelAnimation(phase);
    }, [phase, reduced, halo]),
  );
  const motion = useAnimatedStyle(() => ({
    opacity: halo ? 0.7 * (1 - phase.get()) : 1,
    transform: [
      { scale: halo ? 0.92 + phase.get() * 0.38 : 1 + phase.get() * 0.045 },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[style, motion]}>
      {children}
    </Animated.View>
  );
}
export function Bounce({
  children,
  change,
  style,
}: {
  children: ReactNode;
  change: string | number | boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1),
    reduced = useReducedMotion();
  useEffect(() => {
    if (!reduced)
      scale.set(
        withSequence(
          withTiming(1.12, { duration: 90 }),
          withSpring(1, spring.bouncy),
        ),
      );
  }, [change, scale, reduced]);
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}
export function Count({
  value,
  style,
  prefix = "",
  suffix = "",
  format,
  delay = 0,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  format?: (value: number) => string;
  delay?: number;
}) {
  const { settings } = useApp();
  const [shown, setShown] = useState(value),
    previous = useRef(0),
    reduced = useReducedMotion();
  useFocusEffect(
    useCallback(() => {
      let frame = 0;
      const from = previous.current;
      previous.current = value;
      const timer = setTimeout(() => {
        if (reduced || from === value) {
          setShown(value);
          return;
        }
        const start = Date.now();
        const tick = () => {
          const progress = Math.min(1, (Date.now() - start) / 600);
          setShown(
            Math.round(from + (value - from) * (1 - Math.pow(1 - progress, 3))),
          );
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        tick();
      }, delay);
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(frame);
      };
    }, [value, reduced, delay]),
  );
  return (
    <Text
      style={[
        {
          color: settings.dark ? "#F4F4F6" : "#2B2B3C",
          fontFamily: "Nunito_900Black",
          fontSize: 15,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {prefix}
      {format ? format(shown) : shown}
      {suffix}
    </Text>
  );
}
export function Shine() {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(-1),
    reduced = useReducedMotion();
  useFocusEffect(
    useCallback(() => {
      if (!reduced)
        progress.set(
          withDelay(
            350,
            withRepeat(
              withSequence(
                withTiming(1, { duration: 600 }),
                withTiming(-1, { duration: 0 }),
                withDelay(4400, withTiming(-1, { duration: 0 })),
              ),
              -1,
            ),
          ),
        );
      return () => cancelAnimation(progress);
    }, [progress, reduced]),
  );
  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : 0.38,
    transform: [{ translateX: progress.get() * width }, { skewX: "-20deg" }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: "-50%",
          top: "-20%",
          bottom: "-20%",
          width: "34%",
          backgroundColor: "#FFFFFF",
        },
        style,
      ]}
    />
  );
}
export function useAnswerMotion(verdict: boolean | null) {
  const x = useSharedValue(0),
    scale = useSharedValue(1),
    reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || verdict === null) return;
    if (verdict)
      scale.set(
        withSequence(
          withTiming(1.08, { duration: 90 }),
          withSpring(1, spring.bouncy),
        ),
      );
    else
      x.set(
        withSequence(
          withTiming(-8, { duration: 55 }),
          withTiming(8, { duration: 65 }),
          withTiming(-5, { duration: 65 }),
          withTiming(5, { duration: 65 }),
          withTiming(0, { duration: 100 }),
        ),
      );
  }, [verdict, x, scale, reduced]);
  return useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { scale: scale.get() }],
  }));
}
