import { router } from "expo-router";
import { Pressable,ScrollView,View } from "react-native";
import { testToolsEnabled } from "../lib/config";
import { longDate,profileFacts } from "../lib/progressExtras";
import { useApp } from "../lib/store";
import { Effect } from "./Effects";
import { Count } from "./Motion";
import { Icon,Txt,useTheme,violet } from "./ui";
import { useDesignScale } from "./useDesignScale";

export function ProfileDetails() {
  const d = useDesignScale(), c = useTheme(), { events, progress: p } = useApp(), f = profileFacts(events);
  const later = () => router.navigate("/problem?kind=not-ready");
  const section = (title: string) => <Txt style={{ fontSize: d(13), letterSpacing: d(.8), color: c.muted, fontFamily: "Nunito_900Black" }}>{title}</Txt>;
  const records = [
    { bg: c.tileOrange, icon: "flame-streak", value: f.best, title: "Eng uzun seriya", date: f.bestEnd ? longDate(f.bestEnd + "T12:00") : "—" },
    { bg: c.tileGold, icon: "sparkles", value: f.perfect.length, title: "Mukammal darslar", date: f.perfect.length ? longDate(f.perfect.at(-1)!.at) : "—" },
    { bg: c.tileGrey, icon: "bubble-phrases", value: p.phrases, title: "Iboralar", date: f.last ? longDate(f.last) : "—" },
  ];
  const awards = [
    { icon: "target", color: "#3DCB6C", soft: c.good, goal: 5, title: "Xatosiz yakun", value: f.perfect.length, at: f.perfect[0]?.at },
    { icon: "hands-up", color: "#F25CA2", soft: c.tilePink, goal: 10, title: "Do'stona", value: 0, at: undefined },
    { icon: "bell", color: "#E0A400", soft: c.goldSoft, goal: 10, title: "Erta turuvchi", value: f.early.length, at: f.early[0]?.at },
    { icon: "studio-mic", color: violet, soft: c.soft, goal: 10, title: "Gapiruvchi", value: f.minutes, at: f.minuteAt },
    { icon: "bulb-tip", color: "#FF6B5B", soft: c.coralSoft, goal: 10, title: "Xato ovchisi", value: f.fixed.length, at: f.fixed[0]?.at },
    { icon: "crown", color: "#E0A400", soft: c.goldSoft, goal: 1, title: "Afsona", value: p.level, at: f.levelAt },
  ];
  return <>
    {section("UMUMIY KO'RINISH")}
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: d(14), columnGap: d(10) }}>{[["flame-streak", p.streak.count, " kun"], ["bubble-phrases", p.phrases, " ibora"], ["medal-silver", null, "Liga yo'q"], ["apple-currency", 0, " olma"]].filter(([icon]) => testToolsEnabled || icon === "flame-streak" || icon === "bubble-phrases").map(([icon, value, suffix]) => <Pressable key={String(icon)} onPress={value === null ? later : undefined} style={{ width: d(170), flexDirection: "row", alignItems: "center", gap: d(10) }}><Icon name={String(icon)} size={d(30)} />{value === null ? <Txt style={{ fontSize: d(18), color: c.muted, fontFamily: "Nunito_900Black" }}>{suffix}</Txt> : <Count value={Number(value)} suffix={String(suffix)} style={{ fontSize: d(18) }} />}</Pressable>)}</View>
    {testToolsEnabled ? <>
    {section("DO'STLAR BILAN SERIYA")}
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{[0, 1, 2, 3, 4].map(i => <Pressable key={i} onPress={later} accessibilityLabel="DO'ST QO'SHISH" style={{ width: d(58), height: d(58), borderRadius: d(29), borderWidth: d(2), borderColor: c.edge, justifyContent: "center", alignItems: "center" }}><Txt style={{ fontSize: d(28), color: c.edge }}>+</Txt></Pressable>)}</View>
    </> : null}
    {section("SHAXSIY REKORDLAR")}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: d(-20) }} contentContainerStyle={{ paddingHorizontal: d(20), gap: d(12) }}>{records.map(r => <View key={r.title} style={{ width: d(150), paddingVertical: d(14), paddingHorizontal: d(10), borderWidth: d(2), borderColor: c.line, borderRadius: d(20), alignItems: "center", gap: d(4) }}><View style={{ width: d(96), height: d(96) }}><View style={{ position: "absolute", left: d(-3), top: d(-7), width: d(102), height: d(102), borderRadius: d(26), backgroundColor: r.bg }} /><Icon name={r.icon} size={d(52)} style={{ position: "absolute", left: d(22), top: d(2) }} /><Txt style={{ position: "absolute", left: 0, right: 0, top: d(58), textAlign: "center", fontSize: d(24), fontFamily: "Nunito_900Black" }}>{r.value}</Txt></View><Txt style={{ textAlign: "center", fontSize: d(14), fontFamily: "Nunito_900Black" }}>{r.title}</Txt><Txt style={{ fontSize: d(12), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>{r.date}</Txt></View>)}</ScrollView>
    {section("MUKOFOTLAR")}
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: d(10), rowGap: d(18) }}>{awards.filter(a => testToolsEnabled || a.title !== "Do'stona").map((a, i) => <View key={a.title} style={{ width: d(110), alignItems: "center", gap: d(4) }}><View style={{ width: d(100), height: d(104) }}><View style={{ position: "absolute", left: d(8), top: d(6), width: d(84), height: d(84), borderRadius: d(28), borderWidth: d(3), borderColor: a.value ? a.color : c.line, backgroundColor: a.value ? a.soft : c.surface }} /><View style={{ position: "absolute", left: d(20), top: d(12), filter: a.value ? undefined : [{ grayscale: 1 }], opacity: a.value ? 1 : .45 }}><Icon name={a.icon} size={d(60)} /></View><View style={{ position: "absolute", left: 0, right: 0, top: d(76), alignItems: "center" }}><Txt style={{ paddingHorizontal: d(10), paddingVertical: d(2), borderRadius: d(99), borderWidth: d(3), borderColor: c.card, backgroundColor: a.value ? a.color : c.edge, color: "#FFFFFF", fontSize: d(14), lineHeight: d(16.8), fontFamily: "Nunito_900Black" }}>{a.value}</Txt></View>{a.value > 0 && a.at && new Date().getTime() - +new Date(a.at) < 172800000 ? <Txt style={{ position: "absolute", left: d(58), top: 0, fontSize: d(10), lineHeight: d(12), letterSpacing: d(.4), fontFamily: "Nunito_900Black", color: "#FFFFFF", backgroundColor: "#FF4B5C", borderRadius: d(8), borderWidth: d(2), borderColor: c.card, paddingHorizontal: d(7), paddingVertical: d(3) }}>YANGI</Txt> : null}{a.value > 0 ? <Effect board="Twinkle" delay={i * 380} repeat={8400} style={{ position: "absolute", left: d(-25), top: d(-14), width: d(150), height: d(125) }} /> : null}</View><Txt style={{ textAlign: "center", fontSize: d(14), fontFamily: "Nunito_900Black" }}>{a.title}</Txt><Txt style={{ fontSize: d(12), fontFamily: "Nunito_800ExtraBold", color: c.muted }}>{Math.min(a.value, a.goal)} / {a.goal}</Txt></View>)}</View>
    <Txt style={{ paddingTop: d(10), textAlign: "center", fontSize: d(10), color: c.faint }}>Akademiya English · 1.0</Txt>
  </>;
}
