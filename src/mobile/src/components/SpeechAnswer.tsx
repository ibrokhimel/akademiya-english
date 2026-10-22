import { Pressable,View } from "react-native";
import Animated,{ FadeInDown,ReduceMotion } from "react-native-reanimated";
import { Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";

export function SpeechAnswer({ words, transcript, final, accepted, onReplay }: {
  words: { text: string; ok: boolean }[];
  transcript: string;
  final: boolean;
  accepted: boolean;
  onReplay: () => void;
}) {
  const d = useDesignScale(), c = useTheme();
  const label = { fontSize: d(11), letterSpacing: d(.6), color: c.muted, fontFamily: "Nunito_900Black" };
  return <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} style={{ width: "100%", padding: d(16), borderRadius: d(16), backgroundColor: c.surface, gap: d(10) }}>
    <Txt style={label}>{final ? "ESHITILGAN MATN:" : "ESHITYAPMAN…"}</Txt>
    <Txt accessibilityLiveRegion="polite" style={{ minHeight: d(26), fontSize: d(18), fontFamily: "Nunito_800ExtraBold", color: c.text }}>{transcript || "…"}</Txt>
    {final ? <>
      <Txt style={label}>NAMUNA:</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: d(6) }}>{words.map((word, i) => <Pressable
        key={i}
        accessibilityLabel={`${word.text}: namunani tinglash`}
        onPress={onReplay}
        style={{ paddingVertical: d(4), paddingHorizontal: d(8), borderRadius: d(8), backgroundColor: accepted ? c.good : c.orangeWash }}>
        <Txt style={{ fontSize: d(18), fontFamily: "Nunito_900Black", color: accepted ? "#27A852" : "#C77200" }}>{word.text}</Txt>
      </Pressable>)}</View>
      <Txt style={{ fontSize: d(12), color: c.muted }}>{accepted ? "Ibora mos keldi." : "Ibora tasdiqlanmadi. Namunani bosib tinglang va qayta ayting."}</Txt>
    </> : null}
  </Animated.View>;
}
