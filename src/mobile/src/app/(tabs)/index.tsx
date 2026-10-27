import { router,useFocusEffect,useScrollToTop } from "expo-router";
import { useCallback,useEffect,useRef,useState } from "react";
import { AppState,Pressable,ScrollView,View,useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuditScroll } from "../../audit/layout";
import { BottomSheet } from "../../components/BottomSheet";
import { LessonStartSheet } from "../../components/LessonStartSheet";
import { Arrive,Pulse } from "../../components/Motion";
import { brand,shared,type } from "../../components/system";
import { RaisedPressable } from "../../components/RaisedPressable";
import { DombiOverlay,TabHeader } from "../../components/TabChrome";
import type { Zones } from "../../components/DombiPlay";
import { idleMoment } from "../../../../core/dombi.js";
import { shouldGreetBirthday } from "../../../../core/showcase.js";
import { Effect } from "../../components/Effects";
import { useMeasureDombiLevel } from "../../lib/dombiLevel";
import {
Icon,
Txt,
gold,
useTheme,
violet
} from "../../components/ui";
import { units,type Lesson } from "../../data/content";
import { sound,stopAudio } from "../../lib/audio";
import { useApp } from "../../lib/store";
import { getVisualAudit } from "../../lib/visualAudit";

const SPOTS = [
  [159.5, 16.2, "star"],
  [112.9, 91.5, "mic"],
  [90.1, 177.5, "star"],
  [112.6, 262.1, "headphones"],
  [158.8, 338.8, "message"],
] as const;
export default function Learn() {
  useMeasureDombiLevel(true);
  const { progress: p, settings, set, resume, now } = useApp(),
    c = useTheme(),
    { width } = useWindowDimensions(),
    scale = Math.min(width / 390, 1.2),
    d = (n: number) => n * scale;
  const [pick, setPick] = useState<Lesson | null>(() => {
    const panel = getVisualAudit()?.panel;
    return panel === "lesson" ? units[0].lessons[0] : panel === "checkpoint" ? units[0].checkpoint : null;
  }),
    // The hero card is always the next lesson; the path below shows where it sits.
    next = units.flatMap((u) => [...u.lessons, u.checkpoint]).find((l) => l.id === p.current),
    nextUnit = units.find((u) => u.unit === next?.unit) ?? units[0];
  const scroll = useRef<ScrollView>(null),
    initial = useRef(false),
    currentLessonId = p.current;
  useScrollToTop(scroll);
  useAuditScroll(scroll, scale);
  // Dombi: glad after a break wins over late at night; the first time, he introduces himself.
  // Glad belongs to the open after the break; night follows the clock each time the tab or the app comes back
  // (Redmi test, 2026-10-27: an app opened at 02:41 kept him sleepy all day).
  const [opened] = useState(() => idleMoment({ now: Date.now(), lastOpen: settings.lastOpen ? Date.parse(settings.lastOpen) : undefined }));
  const [seenAt, setSeenAt] = useState(() => Date.now());
  // Dombi's perches (motion-plan §8): the card's top edge and the streak flame, measured once the tab has slid in.
  const cardRef = useRef<View>(null), flameRef = useRef<View>(null), zonesAt = useRef<Zones | undefined>(undefined);
  const zones = useCallback(() => zonesAt.current, []);
  // The learner's birthday: the lesson-end confetti on the first open that day, from a cold start or back from the
  // background, once a year (item 31). `birthday` is the year greeted, 0 when not today.
  const greetYear = () => {
    const today = now();
    return !getVisualAudit() && shouldGreetBirthday({ birthday: settings.profile.birthday, greet: settings.profile.birthdayGreet, now: today, greetedYear: settings.birthdayGreeted }) ? today.getFullYear() : 0;
  };
  const [birthday, setBirthday] = useState(greetYear);
  const greetRef = useRef(greetYear);
  useEffect(() => { greetRef.current = greetYear; });
  useEffect(() => { if (birthday) set({ birthdayGreeted: birthday }); }, [birthday, set]);
  useFocusEffect(useCallback(() => {
    const measure = setTimeout(() => {
      cardRef.current?.measureInWindow((x, y, w) => { zonesAt.current = { ...zonesAt.current, peek: { l: x, r: x + w, top: y } }; });
      flameRef.current?.measureInWindow((x, y, _w, h) => { zonesAt.current = { ...zonesAt.current, warm: { x, y: y + h } }; });
    }, 450);
    setSeenAt(Date.now());
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") return;
      setSeenAt(Date.now());
      const year = greetRef.current();
      if (year) setBirthday(year);
    });
    return () => { sub.remove(); clearTimeout(measure); };
  }, []));
  const moment = (opened === "glad" ? "glad" : idleMoment({ now: seenAt, lastOpen: undefined })) as "glad" | "night" | "idle";
  useEffect(() => { set({ lastOpen: new Date().toISOString() }); }, [set]);
  const firstTime = Object.keys(p.done).length === 0;
  const wasOpen = useRef(false);
  useEffect(() => {
    if (pick || wasOpen.current)
      sound(pick ? "whoosh" : "close", settings.sound);
    wasOpen.current = !!pick;
  }, [pick, settings.sound]);
  useEffect(() => {
    if (initial.current || getVisualAudit()?.panel) return;
    initial.current = true;
    const timer = setTimeout(() => {
      const i = units
        .flatMap((u) => [...u.lessons, u.checkpoint])
        .findIndex((l) => l.id === currentLessonId);
      scroll.current?.scrollTo({
        y: Math.max(0, (Math.floor(i / 6) * 600 + (i % 6 === 5 ? 425.4 : SPOTS[Math.max(0, i % 6)][1]) - 230) * scale),
        animated: false,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [currentLessonId, scale]);
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <TabHeader title="O'rganish" flameRef={flameRef} />
      <Arrive
        style={{
          marginHorizontal: d(20),
          marginTop: d(12),
          borderRadius: d(24),
          backgroundColor: brand.lip,
          paddingBottom: d(4),
        }}
      >
        <View ref={cardRef} collapsable={false}
          style={{
            backgroundColor: violet,
            borderRadius: d(24),
            padding: d(20),
            gap: d(14),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: d(12) }}>
            <View style={{ flex: 1, gap: d(4) }}>
              <Txt style={{ ...type("label", d), color: brand.washLine }}>
                {nextUnit.unit}-BO&apos;LIM · {nextUnit.name.replace("!", "").toUpperCase()}
              </Txt>
              <Txt style={{ ...type("title", d), color: "#FFFFFF" }}>
                {next?.title ?? nextUnit.checkpoint.title}
              </Txt>
            </View>
            <Pressable
              accessibilityLabel="Ayta oladiganlarim"
              onPress={() => router.navigate("/phrases")}
              style={{ width: d(48), height: d(48), borderRadius: d(14), backgroundColor: brand.lip, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="book-phrase-list" size={d(32)} />
            </Pressable>
          </View>
          {next ? (
            <RaisedPressable
              accessibilityLabel={next.title}
              onPress={() => setPick(next)}
              radius={d(16)}
              depth={d(4)}
              backgroundColor="#FFFFFF"
              edgeColor={brand.washLine}
              faceStyle={{ height: d(48), alignItems: "center", justifyContent: "center" }}
            >
              <Txt style={{ ...type("button", d), color: violet }}>
                {resume?.id === next.id ? "DAVOM ETISH" : "BOSHLASH"}
              </Txt>
            </RaisedPressable>
          ) : null}
        </View>
      </Arrive>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: d(8) }}
        contentContainerStyle={{ alignItems: "center", paddingBottom: d(0) }}
      >
        {units.map((u, i) => (
          <View key={u.unit} style={{ width: d(390), height: d(600) }}>
            {i > 0 ? (
              <View
                style={{
                  position: "absolute",
                  left: d(24),
                  right: d(24),
                  top: d(-74),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: d(12),
                }}
              >
                <View style={{ flex: 1, height: 2, backgroundColor: c.line }} />
                <Txt style={{ fontSize: d(13), color: c.muted }}>
                  {u.unit}-BO&apos;LIM · {u.name.toUpperCase()}
                </Txt>
                <View style={{ flex: 1, height: 2, backgroundColor: c.line }} />
              </View>
            ) : null}
            {u.lessons.map((l, k) => {
              const state = p.state(l.id),
                current = state === "cur",
                done = state === "done",
                face = current ? gold : done ? violet : c.line,
                edge = current ? shared.light.rewardLip : done ? brand.lip : c.edge;
              const glyph = done
                ? "glyph-check-white"
                : SPOTS[k][2] === "headphones"
                  ? "glyph-v1-headphones-muted"
                  : `glyph-${SPOTS[k][2]}-${current ? "dark" : "muted"}`;
              return (
                <Arrive
                  key={l.id}
                  index={k + 1}
                  style={{
                    position: "absolute",
                    left: d(SPOTS[k][0]),
                    top: d(SPOTS[k][1]),
                    width: d(71),
                    height: d(66),
                  }}
                >
                  {current ? (
                    <Pulse
                      halo
                      style={{
                        position: "absolute",
                        left: d(-9),
                        top: d(-9),
                        width: d(89),
                        height: d(75),
                        borderRadius: d(45),
                        borderWidth: d(4),
                        borderColor: settings.dark ? shared.dark.rewardWash : shared.light.rewardWash,
                      }}
                    />
                  ) : null}
                  <RaisedPressable
                    accessibilityRole="button"
                    accessibilityLabel={`${l.n}-dars: ${l.title}`}
                    disabled={!p.open(l.id)}
                    onPress={() => setPick(l)}
                    radius={d(36)}
                    depth={d(9)}
                    backgroundColor={face}
                    edgeColor={edge}
                    faceStyle={{
                      height: d(57),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={glyph}
                      size={d(32)}
                      style={
                        current && k === 3
                          ? { tintColor: shared.light.ink }
                          : undefined
                      }
                    />
                  </RaisedPressable>
                </Arrive>
              );
            })}
            <View
              style={{
                position: "absolute",
                left: d(253.9),
                top: d(168.9),
                width: d(76.7),
                height: d(82.6),
                borderRadius: d(38),
                backgroundColor: c.soft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={u.icon} size={d(52)} />
            </View>
            <Txt
              style={{
                position: "absolute",
                left: d(262),
                top: d(267),
                color: c.line,
                fontSize: d(20),
                fontFamily: "Nunito_900Black",
              }}
            >
              ★ ★ ★
            </Txt>
            <Arrive index={6} style={{ position: "absolute", left: d(206.2), top: d(425.4), width: d(69.4) }}><RaisedPressable
              accessibilityLabel={`Nazorat nuqtasi ${u.unit}`}
              disabled={!p.open(u.checkpoint.id)}
              onPress={() => setPick(u.checkpoint)}
              radius={d(16)}
              depth={d(6)}
              backgroundColor={c.goldSoft}
              edgeColor="#E0A400"
              faceStyle={{
                height: d(54.8),
                overflow: "visible",
                borderWidth: d(3),
                borderColor: gold,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="trophy-unit" size={d(38)} />
              {p.done[u.checkpoint.id] ? (
                <View
                  style={{
                    position: "absolute",
                    right: d(-8),
                    top: d(-8),
                    borderRadius: 20,
                    backgroundColor: "#3DCB6C",
                    padding: 3,
                    borderWidth: 3,
                    borderColor: c.bg,
                  }}
                >
                  <Icon name="glyph-check-white" size={d(16)} />
                </View>
              ) : null}
            </RaisedPressable></Arrive>
          </View>
        ))}
        <View style={{ width: d(390), height: d(160) }}><View style={{ position: "absolute", top: d(-74), left: d(24), right: d(24), height: d(40), flexDirection: "row", alignItems: "center", gap: d(12) }}><View style={{ flex: 1, height: d(2), backgroundColor: c.line }} /><Txt style={{ color: c.muted, fontSize: d(13), fontFamily: "Nunito_900Black" }}>Keyingi bo&apos;lim tez orada</Txt><View style={{ flex: 1, height: d(2), backgroundColor: c.line }} /></View><RaisedPressable accessibilityLabel="Keyingi bo'lim tez orada" radius={d(36)} depth={d(9)} backgroundColor={c.line} edgeColor={c.edge} style={{ position: "absolute", top: d(16), left: d(159.5), width: d(71) }} faceStyle={{ height: d(57), alignItems: "center", justifyContent: "center" }}><Icon name="glyph-lock-muted" size={d(32)} /></RaisedPressable></View>
      </ScrollView>
      {!settings.speaking ? (
        <Pressable
          onPress={() => set({ speaking: true })}
          style={{
            position: "absolute",
            bottom: d(14),
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: d(6),
            paddingVertical: d(9),
            paddingHorizontal: d(16),
            borderRadius: d(20),
            backgroundColor: c.soft,
            borderWidth: 2,
            borderColor: c.softLine,
          }}
        >
          <Icon name="glyph-mic-off-violet" size={d(16)} />
          <Txt
            style={{
              fontSize: d(13),
              color: violet,
              fontFamily: "Nunito_900Black",
            }}
          >
            GAPIRISH O&apos;CHIQ · YOQISH
          </Txt>
        </Pressable>
      ) : null}
      {birthday ? <Effect board="Confetti" trigger="large" delay={600} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
      <DombiOverlay phone zones={zones} moment={firstTime ? "guide" : moment} line={firstTime ? "Salom! Men Dombiman. Birinchi dars 3 daqiqa." : undefined} />
      <BottomSheet
        visible={!!pick}
        onClose={() => {
          stopAudio();
          setPick(null);
        }}
      >
        {pick ? <LessonStartSheet lesson={pick} onStart={() => { const id = pick.id; stopAudio(); setPick(null); router.navigate(`/lesson/${id}`); }} /> : null}
      </BottomSheet>
    </SafeAreaView>
  );
}

