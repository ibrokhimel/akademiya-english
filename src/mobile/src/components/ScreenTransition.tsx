import { useMemo,type ReactNode } from "react";
import { StyleSheet,View,useWindowDimensions } from "react-native";
import Animated,{
Easing,
LayoutAnimationConfig,
ReduceMotion,
useReducedMotion,
useSharedValue,
withTiming,
type SharedValue,
} from "react-native-reanimated";

// Same distances, duration and easing as the approved browser motion kit.
export function ScreenTransition({
  transitionKey,
  direction,
  children,
}: {
  transitionKey: string | number;
  direction?: SharedValue<number>;
  children: ReactNode;
}) {
  const forward = useSharedValue(1);
  const travel = direction ?? forward;
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const distance = reduced ? 0 : Math.min(width / 390, 1.2);
  const entering = useMemo(
    () => () => {
      "worklet";
      return {
        initialValues: {
          opacity: 0,
          transform: [{ translateX: 70 * distance * travel.value }],
        },
        animations: {
          opacity: withTiming(1, {
            duration: 250,
            easing: Easing.bezier(0.2, 0, 0, 1),
            reduceMotion: ReduceMotion.Never,
          }),
          transform: [
            {
              translateX: withTiming(0, {
                duration: 250,
                easing: Easing.bezier(0.2, 0, 0, 1),
                reduceMotion: ReduceMotion.System,
              }),
            },
          ],
        },
      };
    },
    [distance, travel],
  );
  const exiting = useMemo(
    () => () => {
      "worklet";
      return {
        initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
        animations: {
          opacity: withTiming(0, {
            duration: 180,
            easing: Easing.bezier(0.3, 0, 0.8, 0.15),
            reduceMotion: ReduceMotion.Never,
          }),
          transform: [
            {
              translateX: withTiming(-90 * distance * travel.value, {
                duration: 180,
                easing: Easing.bezier(0.3, 0, 0.8, 0.15),
                reduceMotion: ReduceMotion.System,
              }),
            },
          ],
        },
      };
    },
    [distance, travel],
  );

  return (
    <View collapsable={false} style={styles.viewport}>
      <LayoutAnimationConfig skipEntering skipExiting>
        <Animated.View
          key={transitionKey}
          entering={entering}
          exiting={exiting}
          style={styles.scene}
        >
          {children}
        </Animated.View>
      </LayoutAnimationConfig>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: "hidden" },
  // Exiting native views must keep their own frame instead of participating in
  // the incoming scene's flex layout during the overlap.
  scene: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
});
