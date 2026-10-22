import { useState } from "react";
import { Pressable,View } from "react-native";
import { Actor } from "../components/Actor";
import { Effect } from "../components/Effects";
import { Arrive,Count } from "../components/Motion";
import { Button,Icon,Page,Txt,useTheme,violet } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { sound } from "../lib/audio";
import { goHome,useBack } from "../lib/navigation";
import { useApp } from "../lib/store";
import { getVisualAudit } from "../lib/visualAudit";
const FACES = [["face-pleading", "Umuman ishonmayman"], ["face-dizzy", "Biroz qo'rqaman"], ["face-smile", "O'rtacha"], ["face-grin", "Ancha ishonaman"], ["face-starstruck", "Juda ishonaman"]];
export default function Confidence() {
  const back = useBack("/(tabs)"), d = useDesignScale(), c = useTheme(), audit = getVisualAudit();
  const { settings, events, add } = useApp();
  const first = events.find(e => e.type === "onboarding")?.confidence || settings.confidence;
  const [value, setValue] = useState(audit?.selected ?? 0), [done, setDone] = useState(!!audit?.result);
  if (done && value <= first) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return <Page style={{ padding: 0, gap: 0 }}>
    {done ? <View style={{ flex: 1, paddingHorizontal: d(24), alignItems: "center", justifyContent: "center", gap: d(16) }}><Actor size={d(170)} mood="happy" gesture="celebrate" /><Txt style={{ fontSize: d(22), lineHeight: d(27.5), fontFamily: "Nunito_900Black", textAlign: "center" }}>Ishonchingiz oshdi!</Txt><Txt style={{ fontSize: d(14), lineHeight: d(20), color: c.muted, textAlign: "center" }}>2 hafta oldin: “{FACES[first - 1]?.[1]}”. Bugun: “{FACES[value - 1]?.[1]}”.</Txt><View style={{ flexDirection: "row", alignItems: "center", gap: d(14) }}><View style={{ width: d(64), height: d(64), borderRadius: d(20), backgroundColor: c.line, justifyContent: "center", alignItems: "center" }}><Txt style={{ fontSize: d(30), color: c.muted, fontFamily: "Nunito_900Black" }}>{first}</Txt></View><Txt style={{ fontSize: d(28), color: c.muted, fontFamily: "Nunito_900Black" }}>→</Txt><View style={{ width: d(64), height: d(64), borderRadius: d(20), backgroundColor: "#3DCB6C", justifyContent: "center", alignItems: "center" }}><Count value={value} style={{ fontSize: d(30), color: "#FFFFFF" }} /><Effect board="Pop" color="#3DCB6C" style={{ position: "absolute", width: d(160), height: d(160) }} /></View></View></View> : <View style={{ flex: 1, paddingHorizontal: d(20), paddingTop: d(16), paddingBottom: d(12), gap: d(12) }}>
      <View style={{ flexDirection: "row", gap: d(10), alignItems: "flex-end" }}><Actor size={d(80)} mood={value ? ["wink", "smirk", "happy", "happy", "laugh"][value - 1] : "smirk"} /><View style={{ flex: 1, paddingHorizontal: d(14), paddingVertical: d(12), borderRadius: d(18), borderBottomLeftRadius: d(4), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card }}><Txt style={{ fontSize: d(16), lineHeight: d(21), fontFamily: "Nunito_900Black" }}>2 hafta o&apos;tdi! Endi gapirganda o&apos;zingizga qanchalik ishonasiz?</Txt></View></View>
      {FACES.map(([icon, label], i) => <Arrive key={label} index={i + 1}><Pressable accessibilityRole="radio" accessibilityState={{ checked: value === i + 1 }} onPress={() => { setValue(i + 1); sound("pick", settings.sound); }} style={{ width: "100%", borderWidth: d(2), borderColor: value === i + 1 ? violet : c.line, backgroundColor: value === i + 1 ? c.soft : c.bg, borderRadius: d(16), paddingHorizontal: d(14), paddingVertical: d(10), flexDirection: "row", alignItems: "center", gap: d(12), opacity: value && value !== i + 1 ? .55 : 1 }}><Icon name={icon} size={d(32)} /><Txt style={{ flex: 1, fontSize: d(15), fontFamily: "Nunito_900Black", color: value === i + 1 ? violet : c.text }}>{label}</Txt>{first === i + 1 ? <Txt style={{ paddingHorizontal: d(8), paddingVertical: d(3), borderRadius: d(99), backgroundColor: c.surface, color: c.muted, fontSize: d(11), fontFamily: "Nunito_900Black" }}>1-kuni</Txt> : <Txt style={{ color: c.muted, fontSize: d(14), fontFamily: "Nunito_900Black" }}>{i + 1}</Txt>}</Pressable></Arrive>)}
    </View>}
    <View style={{ paddingTop: d(12), paddingHorizontal: d(16), paddingBottom: d(30) }}><Button label={done ? "ZO'R!" : "YUBORISH"} disabled={!done && !value} onPress={() => { if (done) goHome(); else { add({ type: "confidence", value }); sound("sent", settings.sound); if (value <= first) back(); else setDone(true); } }} /></View>
  </Page>;
}
