import { Image } from "expo-image";
import { ImageManipulator,type ImageRef } from "expo-image-manipulator";
import { router,useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect,useMemo,useState } from "react";
import { ActivityIndicator,Pressable,View,useWindowDimensions } from "react-native";
import { Gesture,GestureDetector } from "react-native-gesture-handler";
import Animated,{ useAnimatedStyle,useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { cropBase,cropRect } from "../../../../core/customize.js";
import { Txt,gold } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { cropMasks,cropped,saveCrop,type CropTarget } from "../../lib/media";
import { useBack } from "../../lib/navigation";

const MAX_ZOOM = 5;

/**
 * Crop (screens cK8ON, AsDjx without its trim bar — Ruling 7): a dark screen, the picture under a fixed mask
 * (a circle for the avatar, a wide strip for the banner, a tall box for the background). Pan and pinch; TAYYOR crops, shrinks and saves it,
 * then hands it back to the editor that opened this route.
 */
export default function Crop() {
  const params = useLocalSearchParams<{ target?: string; key?: string; uri?: string }>();
  const target: CropTarget = params.target === "banner" || params.target === "background" ? params.target : "avatar";
  const mask = cropMasks[target];
  const d = useDesignScale(), { width } = useWindowDimensions();
  const back = useBack("/customize");
  const [picture, setPicture] = useState<ImageRef | null>(null);
  const [area, setArea] = useState(0);
  const [busy, setBusy] = useState(false);
  const maskW = d(mask.w), maskH = d(mask.h);

  useEffect(() => {
    let live = true;
    if (!params.uri) { router.back(); return; }
    // loading through the manipulator gives the true size (EXIF turns included) and a picture that crops without a reload
    ImageManipulator.manipulate(params.uri).renderAsync()
      .then((ref) => { if (live) setPicture(ref); })
      .catch(() => { if (live) router.back(); });
    return () => { live = false; };
  }, [params.uri]);

  // the full-size picture is native memory: let it go when it is replaced or the screen closes
  useEffect(() => () => picture?.release(), [picture]);

  const base = picture ? cropBase({ imageW: picture.width, imageH: picture.height, viewW: width, maskW, maskH }) : 1;
  const shownW = picture ? picture.width * base : 0, shownH = picture ? picture.height * base : 0;
  const scale = useSharedValue(1), startScale = useSharedValue(1);
  const x = useSharedValue(0), y = useSharedValue(0), startX = useSharedValue(0), startY = useSharedValue(0);

  const gesture = useMemo(() => {
    // the same limits as clampPan in src/core/customize.js, run on the UI thread
    const keepInside = () => {
      "worklet";
      const mx = Math.max(0, (shownW * scale.get() - maskW) / 2), my = Math.max(0, (shownH * scale.get() - maskH) / 2);
      x.set(Math.min(mx, Math.max(-mx, x.get())));
      y.set(Math.min(my, Math.max(-my, y.get())));
    };
    const pan = Gesture.Pan()
      .onStart(() => { startX.set(x.get()); startY.set(y.get()); })
      .onUpdate((e) => { x.set(startX.get() + e.translationX); y.set(startY.get() + e.translationY); keepInside(); });
    const pinch = Gesture.Pinch()
      .onStart(() => { startScale.set(scale.get()); })
      .onUpdate((e) => { scale.set(Math.min(MAX_ZOOM, Math.max(1, startScale.get() * e.scale))); keepInside(); });
    return Gesture.Simultaneous(pan, pinch);
  }, [shownW, shownH, maskW, maskH, scale, startScale, x, y, startX, startY]);

  const moved = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }] }));

  const done = async () => {
    if (!picture || busy || !params.key) return;
    setBusy(true);
    try {
      const rect = cropRect({ imageW: picture.width, imageH: picture.height, viewW: width, maskW, maskH, scale: scale.get(), x: x.get(), y: y.get() });
      cropped(params.key, await saveCrop(picture, rect, target));
      router.back();
    } catch {
      setBusy(false);
      router.navigate("/problem?kind=error");
    }
  };

  const edge = 1200;
  const radius = mask.round ? maskW / 2 : d(16);
  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: d(20), height: d(52) }}>
        <Pressable accessibilityRole="button" accessibilityLabel="BEKOR QILISH" hitSlop={d(10)} onPress={back}>
          <Txt style={{ fontSize: d(14), color: "#FFFFFF", fontFamily: "Nunito_900Black" }}>BEKOR QILISH</Txt>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="TAYYOR" accessibilityState={{ disabled: !picture || busy }} disabled={!picture || busy} hitSlop={d(10)} onPress={done}>
          <Txt style={{ fontSize: d(14), color: gold, fontFamily: "Nunito_900Black", opacity: picture && !busy ? 1 : 0.5 }}>TAYYOR</Txt>
        </Pressable>
      </View>
      <GestureDetector gesture={gesture}>
        <View style={{ flex: 1, overflow: "hidden" }} onLayout={(e) => setArea(e.nativeEvent.layout.height)}>
          {picture && area ? (
            <Animated.View style={[{ position: "absolute", width: shownW, height: shownH, left: (width - shownW) / 2, top: (area - shownH) / 2 }, moved]}>
              <Image source={picture} contentFit="fill" style={{ width: "100%", height: "100%" }} accessible={false} />
            </Animated.View>
          ) : (
            <ActivityIndicator color="#FFFFFF" style={{ flex: 1 }} />
          )}
          {area ? (
            <View pointerEvents="none" style={{ position: "absolute", left: (width - maskW) / 2 - edge, top: (area - maskH) / 2 - edge, width: maskW + edge * 2, height: maskH + edge * 2, borderWidth: edge, borderRadius: radius + edge, borderColor: "#00000080" }}>
              <View style={{ flex: 1, borderRadius: radius, borderWidth: d(2), borderColor: "#FFFFFF" }} />
            </View>
          ) : null}
        </View>
      </GestureDetector>
      <Txt style={{ textAlign: "center", fontSize: d(14), color: "#FFFFFF", fontFamily: "Nunito_900Black", paddingVertical: d(18) }}>{mask.hint}</Txt>
    </SafeAreaView>
  );
}
