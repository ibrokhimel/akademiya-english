import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dombi } from "../../components/Dombi";
import { RaisedPressable } from "../../components/RaisedPressable";
import { type } from "../../components/system";
import { TabHeader, useDs } from "../../components/TabChrome";
import { Icon, Txt, useTheme } from "../../components/ui";
import { useHomeBack } from "../../lib/navigation";
import { showProblem } from "../../lib/problem";
import { useApp } from "../../lib/store";

// Speak tab: "Speak · Final" (DOKlj) and "Speak · First time" (V4Uh5). The conversations are not built in v1,
// so every start opens the owner's "Bu bo'lim hali yaratilmoqda" page.
const notReady = () => void showProblem("not-ready");

export default function Speak() {
  useHomeBack();
  const { progress: p, settings } = useApp(), ds = useDs(), c = useTheme(), { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2), d = (n: number) => n * scale;
  const firstTime = Object.keys(p.done).length === 0;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: ds.surface }}>
      <TabHeader title="Gapirish" />
      {firstTime ? <FirstTime d={d} /> : (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: d(18), paddingHorizontal: d(28) }}>
            <View style={{ width: d(260), height: d(260), alignItems: "center", justifyContent: "center" }}>
              {[[260, 0.1], [208, 0.16], [161.2, 0.26]].map(([size, opacity]) => (
                <View key={size} style={{ position: "absolute", width: d(size), height: d(size), borderRadius: d(size / 2), backgroundColor: c.accent, opacity }} />
              ))}
              <Dombi moment="speakTab" size={d(150)} />
            </View>
            <Txt style={{ ...type("heading", d), color: ds.ink, textAlign: "center" }}>{settings.profile.dombi.name} bilan gaplashing</Txt>
            <Txt style={{ ...type("body", d), color: ds.muted, textAlign: "center" }}>Mavzu tanlang yoki shunchaki gapiring.</Txt>
            <View style={{ flexDirection: "row", gap: d(8), justifyContent: "center" }}>
              {["Bugungi kun", "Ovqat", "Sayohat"].map((topic) => (
                <Pressable key={topic} accessibilityRole="button" onPress={notReady} style={{ backgroundColor: ds.paper, borderRadius: d(12), paddingVertical: d(6), paddingHorizontal: d(12) }}>
                  <Txt style={{ ...type("small", d), color: ds.ink }}>{topic}</Txt>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: d(8), paddingBottom: d(20), paddingHorizontal: d(36) }}>
            <CallButton d={d} label="Vaziyat" icon="speak-bubble" size={60} fill={ds.paper} />
            <CallButton d={d} label="Gapirish" icon="glyph-mic-white" size={84} fill={c.accent} />
            <CallButton d={d} label="Tovush" icon="glyph-speaker-violet" size={60} fill={ds.paper} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function CallButton({ d, label, icon, size, fill }: { d: (n: number) => number; label: string; icon: string; size: number; fill: string }) {
  const ds = useDs();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={notReady} style={{ alignItems: "center", gap: d(6) }}>
      <View style={{ width: d(size), height: d(size), borderRadius: d(size / 2), backgroundColor: fill, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={d(size > 60 ? 36 : 28)} />
      </View>
      <Txt style={{ ...type("label", d), color: ds.muted }}>{label}</Txt>
    </Pressable>
  );
}

function FirstTime({ d }: { d: (n: number) => number }) {
  const ds = useDs(), c = useTheme();
  const row = (icon: string, title: string, note: string) => (
    <View key={title} style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderRadius: d(18), backgroundColor: ds.paper, borderWidth: 2, borderColor: ds.line }}>
      <View style={{ width: d(52), height: d(52), borderRadius: d(14), backgroundColor: ds.line, alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={d(28)} /></View>
      <View style={{ flex: 1, gap: d(2) }}>
        <Txt style={{ ...type("body", d), fontFamily: "Nunito_900Black", color: ds.muted }}>{title}</Txt>
        <Txt style={{ ...type("small", d), color: ds.muted }}>{note}</Txt>
      </View>
      <Icon name="glyph-lock-grey" size={d(22)} />
    </View>
  );
  return (
    <ScrollView contentContainerStyle={{ paddingTop: d(4), paddingHorizontal: d(20), paddingBottom: d(16), gap: d(14) }}>
      <View style={{ alignItems: "center", gap: d(12), paddingVertical: d(12) }}>
        <Dombi moment="onboarding" size={d(150)} />
        <Txt style={{ ...type("heading", d), color: ds.ink, textAlign: "center" }}>Inglizcha hali gapirmaganmisiz?</Txt>
        <Txt style={{ ...type("body", d), color: ds.muted, textAlign: "center" }}>Hechqisi yo&apos;q. Men savol beraman, siz tayyor gaplardan birini aytasiz.</Txt>
      </View>
      <RaisedPressable accessibilityRole="button" onPress={notReady} radius={d(16)} depth={d(4)} backgroundColor={c.accent} edgeColor={c.accentLip} faceStyle={{ height: d(52), alignItems: "center", justifyContent: "center" }}>
        <Txt style={{ ...type("button", d), color: "#FFFFFF" }}>YORDAM BILAN BOSHLASH</Txt>
      </RaisedPressable>
      <Txt style={{ ...type("label", d), color: ds.muted }}>VAZIYATLAR</Txt>
      {row("hand-wave", "Ko'cha", "1-darsdan keyin ochiladi")}
      {row("coffee-kafeda", "Kafe", "2-bo'limda ochiladi")}
    </ScrollView>
  );
}
