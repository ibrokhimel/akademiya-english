import {
createContext,
useCallback,
useContext,
useEffect,
useMemo,
useRef,
useState,
type ReactNode,
} from "react";
import {
Modal,
Pressable,
StyleSheet,
useWindowDimensions,
View,
} from "react-native";
import { Gesture,GestureDetector,GestureHandlerRootView,type PanGesture } from "react-native-gesture-handler";
import Animated,{
cancelAnimation,
Easing,
ReduceMotion,
useAnimatedStyle,
useReducedMotion,
useSharedValue,
withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";
const HandleGesture = createContext<PanGesture | null>(null);
export function SheetHandle() {
  const d = useDesignScale(), c = useTheme();
  const gesture = useContext(HandleGesture);
  const handle = <View accessible={false} style={{ height: d(26), marginTop: d(-10), marginBottom: d(-11), width: "100%", alignItems: "center", justifyContent: "center" }}><View style={{ width: d(40), height: d(5), borderRadius: d(3), backgroundColor: c.line }} /></View>;
  return gesture ? <GestureDetector gesture={gesture}>{handle}</GestureDetector> : handle;
}

// The scrim stays fixed. Only the sheet moves, including during dismissal.
export function BottomSheet({
  visible,
  onClose,
  children,
  scrimColor = "#14141E73",
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  scrimColor?: string;
}) {
  const [mounted, setMounted] = useState(visible);
  const [retainedContent, setRetainedContent] = useState(children);
  // Keep the last open content intact throughout the closing animation.
  if (visible && retainedContent !== children) setRetainedContent(children);
  if (visible && !mounted) setMounted(true);
  const open = useRef(visible),
    shown = useRef(false);
  const reveal = useSharedValue(0),
    sheetHeight = useSharedValue(useWindowDimensions().height),
    drag = useSharedValue(0);
  const reduced = useReducedMotion();
  const finishClosing = useCallback(() => {
    if (open.current) return;
    shown.current = false;
    setMounted(false);
  }, []);
  useEffect(() => {
    open.current = visible;
    if (visible) {
      drag.set(0);
      if (shown.current)
        reveal.set(
          withTiming(1, {
            duration: 260,
            easing: Easing.bezier(0.2, 0, 0, 1),
            reduceMotion: ReduceMotion.Never,
          }),
        );
    } else if (mounted) {
      reveal.set(
        withTiming(
          0,
          {
            duration: 180,
            easing: Easing.bezier(0.3, 0, 0.8, 0.15),
            reduceMotion: ReduceMotion.Never,
          },
          (finished) => {
            if (finished) scheduleOnRN(finishClosing);
          },
        ),
      );
    }
  }, [visible, mounted, reveal, finishClosing, drag]);
  useEffect(() => () => cancelAnimation(reveal), [reveal]);
  const handleGesture = useMemo(() => Gesture.Pan().enabled(visible).activeOffsetY(6).failOffsetX([-18, 18])
    .onBegin(() => cancelAnimation(drag))
    .onUpdate(event => drag.set(Math.max(0, event.translationY)))
    .onEnd(event => {
      if (drag.get() > Math.min(100, sheetHeight.get() * 0.25) || event.velocityY > 650) scheduleOnRN(onClose);
      else drag.set(withTiming(0, { duration: 180, reduceMotion: ReduceMotion.System }));
    })
    .onFinalize((_, success) => { if (!success) drag.set(withTiming(0, { duration: 180, reduceMotion: ReduceMotion.System })); }), [visible, drag, sheetHeight, onClose]);
  const backdrop = useAnimatedStyle(() => ({ opacity: reveal.get() * Math.max(0.25, 1 - drag.get() / Math.max(1, sheetHeight.get())) }));
  const sheet = useAnimatedStyle(() => ({
    opacity: reduced ? reveal.get() : 1,
    transform: [
      { translateY: drag.get() + (reduced ? 0 : sheetHeight.get() * (1 - reveal.get())) },
    ],
  }));
  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      onShow={() => {
        shown.current = true;
        if (visible)
          reveal.set(
            withTiming(1, {
              duration: 260,
              easing: Easing.bezier(0.2, 0, 0, 1),
              reduceMotion: ReduceMotion.Never,
            }),
          );
      }}
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: scrimColor }, backdrop]}
        />
        <Pressable
          accessibilityLabel="Yopish"
          disabled={!visible}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          accessibilityViewIsModal
          pointerEvents={visible ? "auto" : "none"}
          onLayout={(event) => sheetHeight.set(event.nativeEvent.layout.height)}
          style={sheet}
        >
          <HandleGesture.Provider value={handleGesture}>{visible ? children : retainedContent}</HandleGesture.Provider>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { backgroundColor: "#14141E73" },
});
