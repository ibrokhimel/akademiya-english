import { useState } from "react";
import { Pressable,ScrollView,View } from "react-native";
import { dayOf } from "../../../core/progress.js";
import { Count } from "../components/Motion";
import { Icon,Page,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { sound } from "../lib/audio";
import { useBack } from "../lib/navigation";
import { frozenDays,MONTHS } from "../lib/progressExtras";
import { useApp } from "../lib/store";
export default function Calendar() {
  const d = useDesignScale(), back = useBack("/(tabs)/profile"), app = useApp(), c = useTheme(), { events, progress: p } = app, now = app.now();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const today = dayOf(now), days = new Set(events.filter(e => e.type === "lesson").map(e => dayOf(e.at))), freezes = frozenDays(events), count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(), monthKey = dayOf(month).slice(0, 7), key = (n: number) => dayOf(new Date(month.getFullYear(), month.getMonth(), n));
  const practiced = [...days].filter(day => day.startsWith(monthKey)).length, frozen = [...freezes].filter(day => day.startsWith(monthKey)).length, streak = p.streak.count, goal = Math.max(7, Math.ceil((streak + (streak % 7 === 0 && streak ? 1 : 0)) / 7) * 7), left = goal - streak, first = [...days, ...freezes].sort()[0];
  const sunday = new Date(now); sunday.setDate(sunday.getDate() - sunday.getDay());
  const usedThisWeek = [...freezes].some(f => f >= dayOf(sunday) && f <= today), prevOff = !first || key(1) <= first, nextOff = monthKey >= today.slice(0, 7);
  const marked = (n: number) => n >= 1 && n <= count && (days.has(key(n)) || freezes.has(key(n)));
  const move = (delta: number) => { sound("tab", app.settings.sound); setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1)); };
  return <Page style={{ padding: 0, gap: 0 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: d(16), paddingTop: d(4), paddingBottom: d(10), borderBottomWidth: d(2), borderColor: c.line }}>
      <Pressable accessibilityLabel="Ortga" onPress={() => back()}><Icon name="glyph-close-grey" size={d(32)} /></Pressable><Txt style={{ fontSize: d(20), fontFamily: "Nunito_900Black" }}>Seriya</Txt><View style={{ width: d(32) }} />
    </View>
    <ScrollView contentContainerStyle={{ paddingHorizontal: d(20), paddingTop: d(18), paddingBottom: d(24), gap: d(16) }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(4) }}><Txt style={{ flex: 1, fontSize: d(24), fontFamily: "Nunito_900Black" }}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Txt>{[-1, 1].map(delta => <Pressable key={delta} accessibilityLabel={delta < 0 ? "Oldingi oy" : "Keyingi oy"} disabled={delta < 0 ? prevOff : nextOff} style={{ opacity: (delta < 0 ? prevOff : nextOff) ? .35 : 1 }} onPress={() => move(delta)}><Icon name={`glyph-chevron-${delta < 0 ? "left" : "right"}-grey`} size={d(30)} /></Pressable>)}</View>
      <View style={{ flexDirection: "row", gap: d(12) }}>{[false, true].map(ice => <View key={String(ice)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: d(10), padding: d(12), borderRadius: d(16), borderWidth: d(2), borderColor: c.line }}>{ice ? <Icon name="ice-freeze" size={d(30)} /> : <View style={{ width: d(28), height: d(28), borderRadius: d(14), backgroundColor: "#FF9F1C", alignItems: "center", justifyContent: "center" }}><Icon name="glyph-check-white" size={d(22)} /></View>}<View style={{ flex: 1 }}><Count value={ice ? frozen : practiced} style={{ fontSize: d(20), lineHeight: d(23), fontFamily: "Nunito_900Black", color: ice ? c.iceText : c.text }} /><Txt style={{ fontSize: d(12), lineHeight: d(20), fontFamily: "Nunito_800ExtraBold", color: c.muted }}>{ice ? "Muzlatish ishlatildi" : "Mashq qilingan kun"}</Txt></View></View>)}</View>
      <View style={{ paddingTop: d(12), paddingBottom: d(14), borderRadius: d(20), borderWidth: d(2), borderColor: c.line, overflow: "hidden", alignItems: "center", gap: d(4) }}>
        <View style={{ flexDirection: "row" }}>{["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"].map(day => <View key={day} style={{ width: d(46), height: d(26), alignItems: "center", justifyContent: "center" }}><Txt style={{ fontSize: d(13), color: c.faint, fontFamily: "Nunito_900Black" }}>{day}</Txt></View>)}</View>
        <View key={monthKey} style={{ width: d(350), gap: d(16) }}>{Array.from({ length: Math.ceil((month.getDay() + count) / 7) }, (_, row) => <View key={row} style={{ flexDirection: "row" }}>{Array.from({ length: 7 }, (_, col) => { const i = row * 7 + col;
          const n = i - month.getDay() + 1, valid = n > 0 && n <= count, day = key(n), done = valid && days.has(day), ice = valid && freezes.has(day), isToday = valid && day === today, l = i % 7 > 0 && marked(n) && marked(n - 1), r = i % 7 < 6 && marked(n) && marked(n + 1);
          return <View key={i} style={{ width: d(46), height: d(46), alignItems: "center", justifyContent: "center" }}>{l || r ? <View style={{ position: "absolute", top: d(10), height: d(26), left: d(l ? 0 : 23), width: d((l ? 23 : 0) + (r ? 23 : 0)), backgroundColor: c.orangeBand }} /> : null}<View style={{ width: d(38), height: d(38), borderRadius: d(19), backgroundColor: ice ? c.ice : done ? isToday ? "#FF7A4D" : "#FF9F1C" : "transparent", borderWidth: ice || (isToday && !done) ? d(2) : 0, borderColor: ice ? "#5BC8F5" : "#FF7A4D", alignItems: "center", justifyContent: "center" }}><Txt style={{ fontSize: d(15), fontFamily: done || ice || isToday ? "Nunito_900Black" : "Nunito_800ExtraBold", color: ice ? c.iceText : done ? "#3A2400" : isToday ? "#FF7A4D" : c.faint }}>{valid ? n : ""}</Txt></View></View>;
        })}</View>)}</View>
      </View>
      <View style={{ gap: d(8) }}><View style={{ flexDirection: "row", alignItems: "center" }}><Txt style={{ flex: 1, fontSize: d(20), fontFamily: "Nunito_900Black" }}>Seriya maqsadi</Txt><Txt style={{ fontSize: d(14), color: "#FF9F1C", fontFamily: "Nunito_900Black" }}>{streak} / {goal} kun</Txt></View><View style={{ paddingVertical: d(12), paddingHorizontal: d(14), borderRadius: d(16), borderWidth: d(2), borderColor: c.line, gap: d(8) }}><View style={{ flexDirection: "row", alignItems: "center", gap: d(8) }}><Icon name="calendar" size={d(34)} /><View style={{ flex: 1, height: d(16), borderRadius: d(8), backgroundColor: c.line, overflow: "hidden" }}><View style={{ height: "100%", width: `${Math.round(streak / goal * 100)}%`, backgroundColor: "#FF9F1C", borderRadius: d(8) }} /></View><Icon name="calendar" size={d(34)} style={{ opacity: .9 }} /></View><Txt style={{ fontSize: d(12), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>{left === 1 ? `Yana 1 kun — ertaga ${goal} kunlik maqsadga yetasiz!` : `Yana ${left} kun — ${goal} kunlik maqsadga yetasiz!`}</Txt></View></View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(14), borderRadius: d(16), backgroundColor: c.ice }}><Icon name="ice-freeze" size={d(36)} /><View style={{ flex: 1 }}><Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>{usedThisWeek ? "Bu haftaning muzlatishi ishlatildi" : "1 ta muzlatish tayyor"}</Txt><Txt style={{ fontSize: d(12), color: c.muted }}>{usedThisWeek ? "Yangisi yakshanba kuni beriladi." : "Haftasiga 1 ta bepul. Bir kun o'tkazib yuborsangiz, seriyangizni o'zi saqlaydi."}</Txt></View></View>
    </ScrollView>
  </Page>;
}
