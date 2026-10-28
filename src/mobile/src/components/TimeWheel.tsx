import * as Haptics from "expo-haptics";
import { memo,useCallback,useEffect,useMemo,useRef,useState } from "react";
import {
TextInput,
useWindowDimensions,
View,
type TextInputProps,
} from "react-native";
import {
Gesture,
GestureDetector,
GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated,{
cancelAnimation,
interpolateColor,
ReduceMotion,
useAnimatedProps,
useAnimatedReaction,
useAnimatedStyle,
useDerivedValue,
useReducedMotion,
useSharedValue,
withTiming,
type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { sound,warmSounds } from "../lib/audio";
import { useApp } from "../lib/store";
import { useTheme } from "./ui";

const times = Array.from(
  { length: 48 },
  (_, i) => String(i >> 1).padStart(2, "0") + ":" + (i % 2 ? "30" : "00"),
);
const ANGLE = (26 * Math.PI) / 180;
const SLOTS = 8;
const AnimatedNumber = Animated.createAnimatedComponent(TextInput);
function wrap(value: number) {
  "worklet";
  return ((value % 48) + 48) % 48;
}
function glide(
  position: SharedValue<number>,
  to: number,
  tau: number,
  onSettled: (index: number) => void,
) {
  "worklet";
  const distance = Math.abs(to - position.get());
  if (distance < 0.005) {
    position.set(to);
    onSettled(wrap(to));
    return;
  }
  const duration = Math.min(
    2400,
    Math.max(100, tau * Math.log(distance / 0.005)),
  );
  const end = 1 - Math.exp(-duration / tau);
  position.set(
    withTiming(
      to,
      {
        duration,
        easing: (t) => {
          "worklet";
          return (1 - Math.exp((-t * duration) / tau)) / end;
        },
        reduceMotion: ReduceMotion.System,
      },
      (finished) => {
        if (finished) onSettled(wrap(to));
      },
    ),
  );
}

export function TimeWheel({
  initialValue,
  onChange,
}: {
  initialValue: string;
  onChange: (value: string) => void;
}) {
  const c = useTheme();
  const { settings } = useApp();
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2),
    row = 44 * scale,
    radius = row / ANGLE,
    height = 232 * scale;
  // React receives committed selections; it never writes an older value back
  // over the position being dragged or animated on the UI thread.
  const [initialIndex] = useState(() =>
    Math.max(0, times.indexOf(initialValue)),
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const position = useSharedValue(initialIndex);
  const origin = useSharedValue(0),
    dragging = useSharedValue(false),
    feedbackAt = useSharedValue(0);
  const reduced = useReducedMotion();
  const lastCommitted = useRef(initialIndex),
    alive = useRef(true),
    lastFeedbackAt = useRef(0);
  const commit = useCallback(
    (index: number) => {
      if (!alive.current) return;
      setSelectedIndex(index);
      if (index === lastCommitted.current) return;
      lastCommitted.current = index;
      onChange(times[index]);
    },
    [onChange],
  );
  const feedback = useCallback(
    (index: number) => {
      if (!alive.current) return;
      setSelectedIndex(index);
      const now = performance.now();
      if (now - lastFeedbackAt.current < 45) return;
      lastFeedbackAt.current = now;
      sound("tick", settings.sound, 90);
      void Haptics.selectionAsync().catch(() => {});
    },
    [settings.sound],
  );
  useAnimatedReaction(
    () => wrap(Math.round(position.get())),
    (index, previous) => {
      if (previous !== null && index !== previous) {
        const now = performance.now();
        if (now - feedbackAt.get() >= 45) {
          feedbackAt.set(now);
          scheduleOnRN(feedback, index);
        }
      }
    },
  );
  useEffect(() => {
    alive.current = true;
    warmSounds(["tick"]);
    return () => {
      alive.current = false;
      cancelAnimation(position);
    };
  }, [position]);

  // RNGH registers these callbacks now and invokes them only for later touch
  // events. The compiler's refs rule incorrectly treats registration as a call.
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(() => {
    const settled = (index: number) => {
      "worklet";
      scheduleOnRN(commit, index);
    };
    const settle = (target: number, tau: number) => {
      "worklet";
      // The release target is available immediately if Save is pressed while
      // the wheel is still coasting. A completed snap confirms that same value.
      scheduleOnRN(commit, wrap(target));
      glide(position, target, tau, settled);
    };
    const pan = Gesture.Pan()
      .minDistance(3)
      .onBegin(() => {
        cancelAnimation(position);
        position.set(wrap(position.get()));
        origin.set(position.get());
        scheduleOnRN(commit, wrap(Math.round(position.get())));
      })
      .onStart(() => dragging.set(true))
      .onUpdate((event) => {
        position.set(origin.get() - event.translationY / row);
      })
      .onEnd((event) => {
        const velocity = Math.max(-35, Math.min(35, -event.velocityY / row));
        const flick = Math.abs(velocity) > 1.5 && !reduced;
        settle(
          Math.round(position.get() + (flick ? velocity * 0.24 : 0)),
          flick ? 240 : 80,
        );
      })
      .onFinalize((_, success) => {
        if (!success && dragging.get()) settle(Math.round(position.get()), 80);
        dragging.set(false);
      });
    const tap = Gesture.Tap()
      .maxDistance(3)
      .maxDuration(10000)
      .onEnd((event, success) => {
        if (!success) return;
        const current = position.get(),
          center = Math.round(current);
        let target = center,
          best = Infinity;
        for (let offset = -3; offset <= 3; offset++) {
          const angle = (center + offset - current) * ANGLE;
          const z = radius * (Math.cos(angle) - 1);
          const y = (radius * Math.sin(angle)) / (1 - z / (480 * scale));
          const distance = Math.abs(event.y - height / 2 - y);
          if (distance < best) {
            best = distance;
            target = center + offset;
          }
        }
        settle(target, 100);
      });
    return Gesture.Race(pan, tap);
  }, [position, origin, dragging, row, reduced, radius, height, scale, commit]);
  /* eslint-enable react-hooks/refs */
  return (
    <GestureHandlerRootView
      unstable_forceActive
      style={{ height, width: "100%" }}
    >
      <GestureDetector gesture={gesture}>
        <View
          testID="time-wheel"
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Eslatma vaqti"
          accessibilityValue={{
            min: 0,
            max: 47,
            now: selectedIndex,
            text: times[selectedIndex],
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={({ nativeEvent }) => {
            if (!["increment", "decrement"].includes(nativeEvent.actionName))
              return;
            cancelAnimation(position);
            const target =
              Math.round(position.get()) +
              (nativeEvent.actionName === "increment" ? 1 : -1);
            commit(wrap(target));
            glide(position, target, 100, (index) => {
              "worklet";
              scheduleOnRN(commit, index);
            });
          }}
          style={{
            height,
            width: "100%",
            borderRadius: 20 * scale,
            backgroundColor: c.surface,
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 12 * scale,
              right: 12 * scale,
              top: 92 * scale,
              height: 48 * scale,
              borderRadius: 12 * scale,
              backgroundColor: c.card,
              borderWidth: 2 * scale,
              borderColor: c.accent,
            }}
          />
          <View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            style={{ flex: 1 }}
          >
            {Array.from({ length: SLOTS }, (_, slot) => (
              <WheelNumber
                key={slot}
                slot={slot}
                initialIndex={initialIndex}
                position={position}
                scale={scale}
                muted={c.muted}
                accent={c.accent}
              />
            ))}
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
// Eight reusable labels cover the visible cylinder. A label changes its text
// only while hidden on the back, instead of transforming all 48 time labels.
const WheelNumber = memo(function WheelNumber({
  slot,
  initialIndex,
  position,
  scale,
  muted,
  accent,
}: {
  slot: number;
  initialIndex: number;
  position: SharedValue<number>;
  scale: number;
  muted: string;
  accent: string;
}) {
  const labelIndex = useDerivedValue(
    () => slot + Math.round((position.get() - slot) / SLOTS) * SLOTS,
  );
  const text = useAnimatedProps<TextInputProps & { text: string }>(() => {
    const value = times[wrap(labelIndex.get())];
    return { text: value, defaultValue: value };
  });
  const motion = useAnimatedStyle(() => {
    const current = position.get(),
      index = slot + Math.round((current - slot) / SLOTS) * SLOTS,
      delta = index - current,
      distance = Math.abs(delta);
    if (distance > 3.3)
      return {
        opacity: 0,
        transform: [
          {
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 500 * scale, 0, 1],
          },
        ],
      };
    const angle = delta * ANGLE,
      radius = (44 * scale) / ANGLE;
    const y = radius * Math.sin(angle),
      z = radius * (Math.cos(angle) - 1);
    const size = Math.max(0.42, 1 - distance * 0.18);
    const cos = Math.cos(angle),
      sin = Math.sin(angle),
      perspective = 480 * scale;
    return {
      opacity: Math.max(0, 1 - distance * 0.29),
      // Same perspective, depth, rotation and scale as the approved demo.
      transform: [
        {
          matrix: [
            size,
            0,
            0,
            0,
            0,
            size * cos,
            -size * sin,
            (size * sin) / perspective,
            0,
            size * sin,
            size * cos,
            (-size * cos) / perspective,
            0,
            y,
            z,
            1 - z / perspective,
          ],
        },
      ],
    };
  });
  const ink = useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.min(1, Math.abs(labelIndex.get() - position.get()) / 0.85),
      [0, 1],
      [accent, muted],
    ),
  }));
  return (
    <Animated.View
      collapsable={false}
      pointerEvents="none"
      renderToHardwareTextureAndroid
      style={[
        {
          position: "absolute",
          top: 94 * scale,
          left: 0,
          right: 0,
          height: 44 * scale,
        },
        motion,
      ]}
    >
      <AnimatedNumber
        animatedProps={text}
        defaultValue={
          times[wrap(slot + Math.round((initialIndex - slot) / SLOTS) * SLOTS)]
        }
        editable={false}
        caretHidden
        contextMenuHidden
        showSoftInputOnFocus={false}
        underlineColorAndroid="transparent"
        accessible={false}
        pointerEvents="none"
        style={[
          {
            width: "100%",
            height: 44 * scale,
            lineHeight: 44 * scale,
            textAlign: "center",
            textAlignVertical: "center",
            padding: 0,
            includeFontPadding: false,
            fontFamily: "Nunito_900Black",
            fontSize: 24 * scale,
            fontVariant: ["tabular-nums"],
          },
          ink,
        ]}
      />
    </Animated.View>
  );
});
