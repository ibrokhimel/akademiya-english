import { useEffect,useState } from "react";
import { Pressable,ScrollView,View } from "react-native";
import Animated,{ FadeInDown,ReduceMotion,ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { P,units,type Lesson } from "../data/content";
import { play } from "../lib/audio";
import { useApp } from "../lib/store";
import { getVisualAudit } from "../lib/visualAudit";
import { Actor } from "./Actor";
import { Effect } from "./Effects";
import { CheckpointResult,LevelReward,StreakReward } from "./MomentMilestones";
import { Arrive,Count } from "./Motion";
import { Button,coral,gold,green,Icon,Txt,useTheme,violet } from "./ui";
import { useDesignScale } from "./useDesignScale";
export type MomentPhase = "mistakes" | "canSay" | "result" | "streak" | "level";
const arrive = FadeInDown.duration(220).reduceMotion(ReduceMotion.System), pop = ZoomIn.duration(260).reduceMotion(ReduceMotion.System);
export function LessonMoment({ phase, lesson, stats, spokenMs, streak, onContinue, }: {
    phase: MomentPhase;
    lesson: Lesson;
    stats: {
        accuracy: number;
        perfect: boolean;
        left: number;
        mistakes?: number;
        speechRetries?: number;
        correct?: number;
        answered?: number;
    };
    spokenMs: number;
    streak: number;
    onContinue: () => void;
}) {
    const d = useDesignScale();
    const [settledPhase, setSettledPhase] = useState("");
    const celebrating = settledPhase !== phase;
    useEffect(() => { const timer = setTimeout(() => setSettledPhase(phase), 1800); return () => clearTimeout(timer); }, [phase]);
    const app = useApp(), c = useTheme(), level = phase === "level", checkpoint = phase === "result" && lesson.checkpoint, bg = level
        ? violet
        : checkpoint
            ? app.settings.dark
                ? "#24211A"
                : "#FFFDF3"
            : c.bg;
    const main = P[lesson.items[lesson.items.length - 1].p || "hello"], news = (lesson.new || []).map((id) => P[id]), phraseCount = lesson.checkpoint
        ? units
            .find((u) => u.unit === lesson.unit)
            ?.lessons.reduce((n, l) => n + (l.new?.length || 0), 0) || 0
        : news.length;
    if (checkpoint) return <CheckpointResult lesson={lesson} mistakes={stats.mistakes ?? (getVisualAudit() as { mistakes?: number } | undefined)?.mistakes ?? 0} onContinue={onContinue} />;
    if (level) return <LevelReward onContinue={onContinue} />;
    if (phase === "streak") return <StreakReward streak={streak} onContinue={onContinue} />;
    return (<SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{
            flexGrow: 1,
            justifyContent: phase === "result" && !checkpoint ? "flex-start" : "center",
            alignItems: "center",
            padding: d(24),
            gap: phase === "result" ? d(14) : d(20),
        }}>
        {phase === "mistakes" ? (<>
            <Actor size={d(150)} mood="think" gesture="thinking"/>
            <Animated.View entering={arrive} style={{
                width: "100%",
                padding: d(20),
                borderRadius: d(18),
                backgroundColor: c.soft,
                alignItems: "center",
                gap: d(8),
            }}>
              <Icon name="repeat" size={d(32)}/>
              <Txt style={{
                fontSize: d(18),
                fontFamily: "Nunito_900Black",
                color: violet,
                textAlign: "center",
            }}>
                Xatolar ustida ishlaymiz
              </Txt>
              <Txt style={{ fontSize: d(13), color: c.muted, textAlign: "center" }}>
                {stats.left} ta savolni yana bir bor ko&apos;ramiz
              </Txt>
            </Animated.View>
          </>) : null}
        {phase === "canSay" ? (<>
            <View style={{ height: d(40) }} /><Actor size={d(130)} mood="laugh" gesture="celebrate"/>
            <Animated.View entering={pop} style={{
                width: "100%",
                borderRadius: d(20),
                backgroundColor: violet,
                borderBottomWidth: d(5),
                borderColor: "#5A3FD9",
                padding: d(20),
                alignItems: "center",
                gap: d(12),
            }}>
              <Icon name="party-popper" size={d(51)}/>
              <Txt style={{
                fontSize: d(12),
                letterSpacing: d(0.8),
                color: "#D5CAFF",
                fontFamily: "Nunito_900Black",
            }}>
                ENDI AYTA OLASIZ:
              </Txt>
              <Txt style={{
                fontSize: d(28),
                lineHeight: d(33),
                fontFamily: "Nunito_900Black",
                color: "#FFFFFF",
                textAlign: "center",
            }}>
                {main.en}
              </Txt>
              <Txt style={{ fontSize: d(15), color: "#DDD5FF", textAlign: "center" }}>
                {main.uz}
              </Txt>
              <Pressable onPress={() => {
                void play(main.voice, main.en, app.settings.cast).catch(() => { });
            }} style={{
                flexDirection: "row",
                gap: d(8),
                paddingVertical: d(8),
                paddingHorizontal: d(14),
                borderRadius: d(12),
                backgroundColor: "#FFFFFF22",
                alignItems: "center",
            }}>
                <Icon name="glyph-speaker-white" size={d(18)}/>
                <Txt style={{
                fontSize: d(13),
                color: "#FFFFFF",
                fontFamily: "Nunito_900Black",
            }}>
                  TINGLASH
                </Txt>
              </Pressable>
            </Animated.View>
            <Txt style={{
                fontSize: d(15),
                color: c.muted,
                textAlign: "center",
                fontFamily: "Nunito_800ExtraBold",
            }}>
              {lesson.title}
            </Txt>
          </>) : null}
        {phase === "result" ? (<>
            {checkpoint ? (<Animated.View entering={pop} style={{
                    width: d(150),
                    height: d(158),
                    borderRadius: d(40),
                    borderWidth: d(4),
                    borderBottomWidth: d(8),
                    borderColor: gold,
                    backgroundColor: c.card,
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                <Icon name="trophy-unit" size={d(92)}/>
              </Animated.View>) : (<View style={{ marginVertical: d(5) }}><Actor size={d(150)} mood="happy" gesture={celebrating ? "celebrate" : "none"}/></View>)}
            <Txt style={{
                fontSize: checkpoint ? d(26) : d(28),
                fontFamily: "Nunito_900Black",
                textAlign: "center",
            }}>
              {checkpoint ? "Zo'r, uddaladingiz!" : "Dars tugadi!"}
            </Txt>
            {checkpoint ? (<Txt style={{ fontSize: d(15), color: c.muted, textAlign: "center" }}>
                {lesson.title}
              </Txt>) : stats.perfect ? (<Animated.View entering={pop} style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: d(4),
                    paddingVertical: d(8),
                    paddingHorizontal: d(18),
                    borderRadius: d(20),
                    backgroundColor: gold,
                    borderBottomWidth: d(4),
                    borderColor: "#E0A400",
                }}>
                <Icon name="glyph-sparkles-white" size={d(17)}/>
                <Txt style={{
                    fontSize: d(15),
                    color: "#FFFFFF",
                    fontFamily: "Nunito_900Black",
                    letterSpacing: d(0.6),
                }}>
                  MUKAMMAL!
                </Txt>
              </Animated.View>) : null}
            <Animated.View entering={arrive} style={{ width: "100%", flexDirection: "row", gap: d(12) }}>
              {[
                [stats.speechRetries ? "JAVOBLAR" : "ANIQLIK", stats.speechRetries ? `${stats.correct}/${stats.answered}` : `${stats.accuracy}%`, green, "glyph-target-green"],
                [
                    "GAPIRDINGIZ",
                    `${Math.floor(spokenMs / 60000)}:${String(Math.floor(spokenMs / 1000) % 60).padStart(2, "0")}`,
                    coral,
                    "glyph-mic-coral",
                ],
                [
                    "IBORALAR",
                    `${checkpoint ? "" : "+"}${phraseCount}`,
                    violet,
                    "glyph-message-violet",
                ],
            ].map(([label, value, color, icon], i) => (<Arrive key={label} index={i + 2} style={{
                    flex: 1,
                    borderRadius: d(16),
                    backgroundColor: color,
                    marginBottom: d(4),
                    boxShadow: `0 ${d(4)}px 0 ${["#27A852", "#D9483A", "#5A3FD9"][i]}`,
                }}>
                  <Txt style={{
                    fontSize: d(11),
                    color: "#FFFFFF",
                    fontFamily: "Nunito_900Black",
                    letterSpacing: d(0.6),
                    textAlign: "center",
                    paddingVertical: d(6),
                }}>
                    {label}
                  </Txt>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: d(6),
                    paddingVertical: d(12),
                    borderRadius: d(14),
                    borderWidth: d(2),
                    borderColor: color,
                    backgroundColor: c.card,
                }}>
                    <Icon name={icon} size={d(18)}/>
                    <Count value={i === 0
                    ? stats.speechRetries ? stats.correct || 0 : stats.accuracy
                    : i === 1
                        ? Math.floor(spokenMs / 1000)
                        : phraseCount} delay={200 + i * 80} suffix={i === 0 && !stats.speechRetries ? "%" : ""} prefix={i === 2 && !checkpoint ? "+" : ""} format={i === 0 && stats.speechRetries
                    ? (correct) => `${correct}/${stats.answered || 0}`
                    : i === 1
                    ? (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                    : undefined} style={{
                    fontSize: d(20),
                    color,
                    fontFamily: "Nunito_900Black",
                }}/>
                  </View>
                </Arrive>))}
            </Animated.View>
            {stats.speechRetries ? <Txt style={{ fontSize: d(12), color: c.muted, textAlign: "center" }}>Ovoz {stats.speechRetries} marta qayta tekshirildi. Bu xato deb hisoblanmadi.</Txt> : null}
            {news.length ? (<Txt style={{
                    fontSize: d(12),
                    letterSpacing: d(0.8),
                    color: c.muted,
                    fontFamily: "Nunito_900Black",
                    alignSelf: "center",
                }}>
                ENDI AYTA OLASIZ:
              </Txt>) : null}
            {news.map((ph, i) => (<Arrive key={ph.id} index={i + 4} style={{ width: "100%" }}>
                <Pressable onPress={() => {
                    void play(ph.voice, ph.en, app.settings.cast).catch(() => { });
                }} style={{
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: d(12),
                    paddingVertical: d(12),
                    paddingHorizontal: d(14),
                    borderRadius: d(16),
                    backgroundColor: c.soft,
                }}>
                  <View style={{
                    width: d(36),
                    height: d(39),
                    borderRadius: d(12),
                    borderWidth: d(2),
                    borderBottomWidth: d(4),
                    borderColor: c.line,
                    backgroundColor: c.card,
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Icon name="glyph-speaker-violet" size={d(18)}/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: d(17), fontFamily: "Nunito_900Black" }}>
                      {ph.en}
                    </Txt>
                    <Txt style={{ fontSize: d(13), color: c.muted }}>{ph.uz}</Txt>
                  </View>
                </Pressable>
              </Arrive>))}
          </>) : null}
        
        
      </ScrollView>
      {phase === "result" ? (<Effect board="Confetti" trigger={stats.perfect ? "large" : "medium"} delay={300} style={{ position: "absolute", top: d(0), left: d(0), right: d(0), bottom: d(0) }}/>) : null}
      
      {phase === "canSay" ? (<Effect board="Twinkle" color="#FFC93C" delay={280} repeat={2700} style={{
                position: "absolute",
                top: "25%",
                width: "100%",
                height: "40%",
            }}/>) : null}
      <View style={{ paddingHorizontal: d(16), paddingTop: d(16), paddingBottom: d(28) }}>
        <Button label={phase === "mistakes" ? "BOSHLADIK" : "DAVOM ETISH"} kind={level || checkpoint ? "gold" : "primary"} onPress={onContinue}/>
      </View>
    </SafeAreaView>);
}
