import type { ReactNode } from "react";
import {
Pressable,
View,
type PressableProps,
type StyleProp,
type ViewStyle,
} from "react-native";
import Animated,{
Easing,
useAnimatedStyle,
useReducedMotion,
useSharedValue,
withSpring,
withTiming,
} from "react-native-reanimated";
import { useAuditBox } from "../audit/layout";
import { spring } from "./Motion";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";

type Props = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  backgroundColor: string;
  edgeColor: string;
  radius: number;
  depth: number;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  soundName?: string | false;
};

// The approved .p3d component: a complete rounded face above a separate base.
// Only the face moves; the touch target and surrounding layout stay in place.
export function RaisedPressable({
  children,
  backgroundColor,
  edgeColor,
  radius,
  depth,
  style,
  faceStyle,
  onPressIn,
  onPressOut,
  soundName = "button",
  ...props
}: Props) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();
  const { settings } = useApp();
  const auditBox = useAuditBox(props, { backgroundColor, edgeColor, radius, depth, faceStyle });
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      accessibilityState={{ ...props.accessibilityState, disabled: !!props.disabled }}
      {...auditBox}
      onPressIn={(event) => {
        if (soundName) sound(soundName, settings.sound);
        pressed.set(
          withTiming(depth, {
            duration: reduced ? 0 : 60,
            easing: Easing.bezier(0.05, 0.7, 0.1, 1),
          }),
        );
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // Springs back up and settles, like the face is on a rubber base.
        pressed.set(reduced ? 0 : withSpring(0, spring.snappy));
        onPressOut?.(event);
      }}
      style={[{ paddingBottom: depth }, style]}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: depth,
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: radius,
          backgroundColor: edgeColor,
        }}
      />
      <Animated.View
        style={[
          { backgroundColor, borderRadius: radius, overflow: "hidden" },
          faceStyle,
          motion,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
