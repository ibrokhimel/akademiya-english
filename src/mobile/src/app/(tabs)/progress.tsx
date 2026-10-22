import { router,useScrollToTop } from "expo-router";
import { useRef } from "react";
import { Pressable,ScrollView,useWindowDimensions,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dayOf } from "../../../../core/progress.js";
import { useAuditScroll } from "../../audit/layout";
import { Arrive,Count,Fill } from "../../components/Motion";
import { Icon,Txt,useTheme,violet } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { P,units } from "../../data/content";
import { play } from "../../lib/audio";
import { useHomeBack } from "../../lib/navigation";
import { newestPhrases,prediction } from "../../lib/progressExtras";
import { useApp } from "../../lib/store";
export default function Progress() {
    useHomeBack();
    const scroll = useRef<ScrollView>(null);
    useScrollToTop(scroll);
    const { progress: p, events, settings } = useApp(), c = useTheme(), { width } = useWindowDimensions(), scale = Math.min(width / 390, 1.2), d = (n: number) => n * scale;
    useAuditScroll(scroll, scale);
    const learned = units
        .flatMap((u) => u.lessons)
        .filter((l) => p.done[l.id])
        .flatMap((l) => l.new || []), completed = units.filter((u) => p.done[u.checkpoint.id]).length;
    const news = newestPhrases(events);
    const spoken = Math.ceil(events.reduce((n, e) => n + (e.spokenMs || 0), 0) / 60000), days = new Set(events.filter((e) => e.type === "lesson").map((e) => dayOf(e.at))).size;
    return (<View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={["top", "left", "right"]} style={{ backgroundColor: violet }}>
          <View style={{
            paddingHorizontal: d(24),
            paddingTop: d(8),
            paddingBottom: d(20),
            gap: d(4),
        }}>
            <Txt style={{
            fontSize: d(12),
            letterSpacing: d(0.8),
            color: "#D5CAFF",
            fontFamily: "Nunito_900Black",
        }}>
              NATIJALAR
            </Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}>
              <Count value={p.phrases} style={{
            fontSize: d(64),
            lineHeight: d(71),
            fontFamily: "Nunito_900Black",
            color: "#FFFFFF",
        }}/>
              <Txt style={{
            fontSize: d(18),
            lineHeight: d(24),
            fontFamily: "Nunito_900Black",
            color: "#FFFFFF",
            flex: 1,
        }}>
                ta narsani ingliz{"\n"}tilida ayta olasiz
              </Txt>
            </View>
          </View>
        </SafeAreaView>
        <View style={{
            paddingHorizontal: d(20),
            paddingTop: d(16),
            paddingBottom: d(24),
            gap: d(12),
        }}>
          <Txt style={{
            fontSize: d(12),
            letterSpacing: d(0.6),
            color: c.muted,
            fontFamily: "Nunito_900Black",
        }}>
            ENG YANGILARI
          </Txt>
          {learned.length ? (news.map((id, i) => (<Arrive key={id} index={i + 1}><Pressable onPress={() => {
                void play(P[id].voice, P[id].en, settings.cast).catch(() => { });
            }} style={{
                flexDirection: "row",
                alignItems: "center",
                gap: d(12),
                padding: d(12),
                borderRadius: d(16),
                backgroundColor: c.soft,
            }}>
                <View style={{
                width: d(40),
                height: d(40),
                borderRadius: d(12),
                backgroundColor: c.card,
                alignItems: "center",
                justifyContent: "center",
            }}>
                  <Icon name="glyph-speaker-violet" size={d(26)}/>
                </View>
                <View style={{ flex: 1, gap: d(2) }}>
                  <Txt style={{ fontSize: d(16), fontFamily: "Nunito_900Black" }}>
                    {P[id].en}
                  </Txt>
                  <Txt style={{ fontSize: d(12), color: c.muted }}>
                    {P[id].uz}
                  </Txt>
                </View>
              </Pressable></Arrive>))) : (<Txt style={{
                fontSize: d(14),
                color: c.muted,
                paddingVertical: d(10),
            }}>
              Birinchi darsdan keyin iboralaringiz shu yerda chiqadi.
            </Txt>)}
          {learned.length ? <Pressable onPress={() => router.navigate("/phrases")} style={{ alignSelf: "center", paddingVertical: d(6) }}>
            <Txt style={{
            fontSize: d(14),
            letterSpacing: d(0.5),
            color: violet,
            fontFamily: "Nunito_900Black",
        }}>
              HAMMASINI KO&apos;RISH ({learned.length})
            </Txt>
          </Pressable> : null}
          <Arrive index={news.length + 1}><Pressable onPress={() => router.navigate("/calendar")} style={{
            flexDirection: "row",
            alignItems: "center",
            gap: d(10),
            padding: d(12),
            borderRadius: d(16),
            borderWidth: d(2),
            borderColor: c.line,
        }}>
            <Icon name="flame-streak" size={d(40)}/>
            <Txt style={{
            fontSize: d(28),
            fontFamily: "Nunito_900Black",
            minWidth: d(34),
        }}>
              {p.streak.count}
            </Txt>
            <View style={{ flex: 1 }}>
              <Week />
            </View>
            <Icon name="glyph-chevron-right-grey" size={d(23)}/>
          </Pressable></Arrive>
          <Arrive index={news.length + 2}><View style={{
            padding: d(14),
            borderRadius: d(16),
            borderWidth: d(2),
            borderColor: c.line,
            gap: d(8),
        }}>
            <View style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: d(8),
        }}>
              <Txt style={{ fontSize: d(14), fontFamily: "Nunito_900Black" }}>
                {p.level}-daraja · {completed}/3 bo&apos;lim
              </Txt>
              <Txt style={{
            fontSize: d(12),
            color: c.muted,
            fontFamily: "Nunito_800ExtraBold",
        }}>
                {prediction(events, p.level)}
              </Txt>
            </View>
            <View style={{
            height: d(12),
            borderRadius: d(8),
            backgroundColor: c.line,
            overflow: "hidden",
        }}>
              <Fill value={p.level >= 1 ? 1 : Object.keys(p.done).length / 18} color={violet} style={{ borderRadius: d(8) }}/>
            </View>
          </View></Arrive>
          <Arrive index={news.length + 3} style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: d(30),
            paddingTop: d(4),
        }}>
            {[
            ["studio-mic", spoken, "daqiqa"],
            [
                "book-phrase-list",
                Object.keys(p.done).length,
                "dars",
            ],
            ["calendar", days, "faol kun"],
        ].map(([icon, value, label]) => (<View key={String(icon)} style={{ alignItems: "center", gap: d(3), width: d(88) }}>
                <Icon name={String(icon)} size={d(28)}/>
                <Txt style={{ fontSize: d(17), fontFamily: "Nunito_900Black" }}>
                  {value}
                </Txt>
                <Txt style={{
                fontSize: d(11),
                color: c.muted,
                textAlign: "center",
                fontFamily: "Nunito_800ExtraBold",
            }}>
                  {label}
                </Txt>
              </View>))}
          </Arrive>
        </View>
      </ScrollView>
    </View>);
}
export function Week() {
 const d = useDesignScale(), app = useApp(), c = useTheme(), today = dayOf(app.now());
 return <View style={{ flexDirection: "row", justifyContent: "center", gap: d(5) }}>{app.progress.streak.week.map((day: { day: string; state: string }) => <View key={day.day} style={{ alignItems: "center", gap: d(2) }}><Txt style={{ fontSize: d(9), color: day.day === today ? "#FF9F1C" : c.muted, fontFamily: "Nunito_900Black" }}>{["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"][new Date(day.day + "T12:00").getDay()]}</Txt><View style={{ width: d(22), height: d(22), borderRadius: d(11), backgroundColor: day.state === "done" ? "#FF9F1C" : day.state === "frozen" ? "transparent" : c.line, alignItems: "center", justifyContent: "center" }}>{day.state === "done" ? <Icon name="glyph-check-white" size={d(16)} /> : day.state === "frozen" ? <Icon name="ice-freeze" size={d(32)} style={{ position: "absolute", left: d(-5), top: d(-2) }} /> : null}{day.day === today ? <View style={{ position: "absolute", top: d(-3), left: d(-3), right: d(-3), bottom: d(-3), borderRadius: d(14), borderWidth: d(3), borderColor: "#FFD08A" }} /> : null}</View></View>)}</View>;
}
