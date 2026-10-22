import { getNetworkStateAsync } from "expo-network";
import { useState } from "react";
import { Linking,Pressable,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ProblemChoice,ProblemKind } from "../lib/problem";
import { Actor } from "./Actor";
import { BottomSheet,SheetHandle } from "./BottomSheet";
import { Arrive } from "./Motion";
import { Button,Icon,LinkButton,Page,Txt,useTheme,violet } from "./ui";
import { useDesignScale } from "./useDesignScale";
export function ProblemContent({ kind, onChoice, onHome, onReport }: { kind: ProblemKind; onChoice: (choice: ProblemChoice) => void; onHome: () => void; onReport: () => void }) {
  const d = useDesignScale(), c = useTheme(), [busy, setBusy] = useState(false);
  const blocked = kind === "mic-blocked", sheet = blocked || kind === "speech-unavailable", notReady = kind === "not-ready" || kind === "not-found";
  const heading = (text: string, size = 22) => <Txt style={{ width: "100%", textAlign: "center", fontSize: d(size), lineHeight: d(size === 26 ? 33.8 : 27.5), fontFamily: "Nunito_900Black" }}>{text}</Txt>;
  const paragraph = (text: string, size = 14) => <Txt style={{ width: "100%", textAlign: "center", fontSize: d(size), lineHeight: d(size === 16 ? 22 : 20), color: c.muted }}>{text}</Txt>;
  if (sheet) return <View style={{ flex: 1 }}><BottomSheet visible onClose={() => onChoice("cancel")} scrimColor="#2B2B3C66"><SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.bg, borderTopLeftRadius: d(28), borderTopRightRadius: d(28) }}><View style={{ paddingHorizontal: d(20), paddingTop: d(10), paddingBottom: d(30), gap: d(12), alignItems: "center" }}><SheetHandle /><View><Actor size={d(blocked ? 110 : 100)} />{blocked ? <View style={{ position: "absolute", left: d(76), top: 0, width: d(36), height: d(36), borderRadius: d(18), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}><Icon name="glyph-mic-off-muted" size={d(22)} /></View> : null}</View>
    {heading(blocked ? "Mikrofon yopiq" : "Hozir sizni tushuna olmayapman")}
    {paragraph(blocked ? "Gapirish mashqlari uchun mikrofonga ruxsat kerak:" : "Telefoningiz hozir ovozni matnga aylantira olmayapti. Hozircha gapirish o'rniga so'zlarni tanlab javob berasiz — gapirishga keyin qaytamiz.")}
    {blocked ? <View style={{ width: "100%", backgroundColor: c.surface, borderRadius: d(16), padding: d(14), gap: d(8), alignItems: "center" }}>{["Telefon sozlamalarini oching", "Mikrofonga ruxsat bering", "QAYTA URINISH tugmasini bosing"].map((line, i) => <Arrive key={line} index={i} style={{ flexDirection: "row", alignItems: "center", gap: d(10) }}><View style={{ width: d(24), height: d(24), borderRadius: d(12), backgroundColor: violet, alignItems: "center", justifyContent: "center" }}><Txt style={{ fontSize: d(12), color: "#FFFFFF", fontFamily: "Nunito_900Black" }}>{i + 1}</Txt></View><Txt style={{ flexShrink: 1, fontSize: d(14), fontFamily: "Nunito_800ExtraBold" }}>{line}</Txt></Arrive>)}</View> : null}
    <View style={{ width: "100%", marginTop: d(12) }}><Button label={blocked ? "QAYTA URINISH" : "SO'ZLARNI TANLAB DAVOM ETISH"} onPress={() => { if (blocked) { void Linking.openSettings(); onChoice("retry"); } else onChoice("tiles"); }} /></View><LinkButton compact label={blocked ? "GAPIRMASDAN DAVOM ETISH" : "QAYTA URINIB KO'RISH"} onPress={() => onChoice(blocked ? "tiles" : "retry")} />
  </View></SafeAreaView></BottomSheet></View>;
  const retry = async () => { if (busy) return; setBusy(true); if (kind !== "offline" || (await getNetworkStateAsync().catch(() => ({ isConnected: false }))).isConnected !== false) onChoice("retry"); setBusy(false); };
  return <Page style={{ padding: 0, gap: 0 }}>
    {notReady ? <Pressable accessibilityLabel="Yopish" onPress={() => onChoice("cancel")} style={{ position: "absolute", left: d(12), top: d(4), zIndex: 1 }}><Icon name="glyph-close-muted" size={d(32)} /></Pressable> : null}
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: d(14), paddingHorizontal: d(notReady ? 32 : 28), paddingTop: notReady ? d(34) : 0 }}>
      {notReady ? <View style={{ width: d(168), height: d(168), borderRadius: d(84), backgroundColor: c.good, justifyContent: "center", alignItems: "center", marginBottom: d(6) }}><Icon name="sprout" size={d(104)} /></View> : <View><Actor size={d(170)} mood={kind === "error" ? "think" : "smirk"} gesture={kind === "error" ? "thinking" : "none"} />{kind === "offline" ? <View style={{ position: "absolute", left: d(120), top: d(4), width: d(46), height: d(46), borderRadius: d(23), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}><Icon name="glyph-wifi-off-grey" size={d(28)} /></View> : null}</View>}
      {heading(notReady ? "Bu bo'lim hali yaratilmoqda" : kind === "offline" ? "Internet yo'q" : "Voy, nimadir xato ketdi", notReady ? 26 : 22)}
      {paragraph(notReady ? "Tez orada qo'shamiz! Hozircha darslarni davom ettiring — har bir dars sizni oldinga olib boradi." : kind === "offline" ? "Darslar va saqlangan natijalar internetsiz ham ishlaydi. Nutq xizmati uchun internet talab qilinishi mumkin." : "Bu sizning aybingiz emas. Bir oz kutib, qayta urinib ko'ring.", notReady ? 16 : 14)}
    </View><View style={{ paddingTop: d(notReady ? 16 : 12), paddingHorizontal: d(16), paddingBottom: d(notReady ? 32 : 30), gap: d(notReady ? 12 : 10) }}><Button label={notReady ? "DARSLARGA QAYTISH" : "QAYTA URINISH"} disabled={busy} onPress={notReady ? onHome : () => { void retry(); }} />{notReady || kind === "error" ? <Button label={notReady ? "BU HAQDA FIKR BILDIRISH" : "XATO HAQIDA XABAR BERISH"} kind="secondary" onPress={onReport} /> : null}</View>
  </Page>;
}
