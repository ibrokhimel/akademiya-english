import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MATCH_MS, matchReducer, matchStart } from "../../../core/match.js";
import { matchPool } from "../../../core/practice.js";
import { BottomSheet, SheetHandle } from "../components/BottomSheet";
import { Dombi } from "../components/Dombi";
import { useScrim } from "../components/HelpSheet";
import { Bounce, Fill } from "../components/Motion";
import { ProblemContent } from "../components/ProblemContent";
import { RaisedPressable } from "../components/RaisedPressable";
import { brand, type } from "../components/system";
import { DombiOverlay, useDs } from "../components/TabChrome";
import { Button, green, Icon, LinkButton, Page, Txt, useTheme, violet } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { P, units } from "../data/content";
import { play, sound, stopAudio } from "../lib/audio";
import { goHome } from "../lib/navigation";
import { useApp } from "../lib/store";
import { toPractice } from "./ActivityScreen";

type Game = ReturnType<typeof matchStart>;
type Side = "audio" | "phrase";
const FADE = 0.35, TIME = "#FF9F1C";
// Read the clock outside render: taps and ticks are events, not render work.
const clock = () => Date.now();

// Match rush (Juftini top), Pencil aZXxk: M1 start, M2 play, M3 a wrong pair, M4 time up, M5 leave.
// Practice: only the best score is kept, and the streak is untouched.
export default function MatchRush() {
  const d = useDesignScale(), ds = useDs(), c = useTheme(), scrim = useScrim();
  const app = useApp(), { settings } = app;
  const [pool] = useState(() => matchPool(units, app.progress.done, P));
  const [phase, setPhase] = useState<"start" | "play" | "end">("start");
  const [game, setGame] = useState<Game | null>(null), [now, setNow] = useState(0);
  const [quitting, setQuitting] = useState<number | null>(null);   // when the leave sheet opened; the clock waits while it is open
  const [result, setResult] = useState<{ found: number; before?: number } | null>(null);
  const [lastPair, setLastPair] = useState<{ id: string; until: number } | null>(null);

  const finish = (g: Game) => {
    stopAudio(); sound("lesson-done", settings.sound);
    const before = settings.matchBest;
    if (before === undefined || g.found > before) app.set({ matchBest: g.found });
    setResult({ found: g.found, before }); setPhase("end");
  };
  const tick = useEffectEvent(() => {
    if (!game || quitting !== null) return;
    const t = Date.now(), g = matchReducer(game, { type: "tick", t });
    setNow(t); if (g !== game) setGame(g);
    if (g.done) finish(g);
  });
  useEffect(() => {
    if (phase !== "play") return;
    const timer = setInterval(() => tick(), 100);
    return () => clearInterval(timer);
  }, [phase]);

  usePreventRemove(phase === "play" && quitting === null, () => { stopAudio(); setQuitting(Date.now()); });
  const stay = () => {
    if (quitting !== null && game) setGame({ ...game, end: game.end + (Date.now() - quitting) });
    setQuitting(null);
  };

  const tap = (side: Side, i: number) => {
    if (!game || quitting !== null) return;
    const t = clock(), g = matchReducer(game, { type: side, i, t }), id: string = game[side][i];
    if (side === "audio" && !game.matched.includes(id)) void play(P[id].voice, P[id].en, settings.cast);
    if (g.found > game.found) { sound("right", settings.sound); setLastPair({ id, until: t + 400 }); }
    else if (g.flash && g.flash !== game.flash) sound("not-right", settings.sound);
    setGame(g); setNow(t);
    if (g.done) finish(g);
  };

  if (pool.length < 4) return <ProblemContent kind="not-found" onChoice={toPractice} onHome={goHome} onReport={() => router.navigate("/feedback")} />;

  if (phase === "start") {
    const best = settings.matchBest;
    return (
      <Page>
        <View style={{ flex: 1, gap: d(16) }}>
          <View style={{ gap: d(6) }}>
            <Txt style={{ ...type("label", d), color: brand.main }}>JUFTLANG · 1 DAQIQA</Txt>
            <Txt style={{ ...type("title", d), color: ds.ink }}>Ovozni iboraga ulang</Txt>
          </View>
          <View style={{ flexDirection: "row", gap: d(12) }}>
            {[["60 s", "vaqt"], ["4 juft", "har safar"]].map(([big, small]) => (
              <View key={big} style={{ flex: 1, backgroundColor: ds.surface, borderRadius: d(18), borderWidth: 2, borderColor: ds.line, padding: d(14), gap: d(2) }}>
                <Txt style={{ ...type("heading", d), color: ds.ink }}>{big}</Txt>
                <Txt style={{ ...type("small", d), color: ds.muted }}>{small}</Txt>
              </View>
            ))}
          </View>
          {best !== undefined ? <Txt style={{ ...type("body", d), color: ds.muted }}>Eng yaxshi natijangiz: {best} juft.</Txt> : null}
        </View>
        <Button label="BOSHLASH" onPress={() => { const t = Date.now(); setGame(matchStart(pool, { now: t })); setNow(t); setPhase("play"); }} />
        <DombiOverlay moment="guide" line="Bir daqiqa. Tayyormisiz?" bottom={d(96)} />
      </Page>
    );
  }

  if (phase === "end" && result) {
    const record = result.before !== undefined && result.found > result.before;
    return (
      <Page>
        <View style={{ flex: 1, gap: d(6) }}>
          <Txt style={{ ...type("label", d), color: brand.main }}>VAQT TUGADI</Txt>
          <Txt style={{ ...type("title", d), color: ds.ink }}>{result.found} juft topdingiz</Txt>
          {result.before !== undefined ? <Txt style={{ ...type("body", d), color: ds.muted, marginTop: d(4) }}>Oldingi eng yaxshi natija: {result.before} juft.</Txt> : null}
        </View>
        <Button label="DAVOM ETISH" onPress={toPractice} />
        <DombiOverlay moment="activityEnd" line={record ? "Yangi rekord!" : undefined} bottom={d(96)} />
      </Page>
    );
  }

  if (!game) return null;
  const left = Math.max(0, game.end - (quitting ?? now)) / MATCH_MS;
  // Answer tile states (M2/M3): picked violet, a found pair green for a moment and then faded, a wrong pair amber.
  const look = (side: Side, i: number) => {
    const id: string = game[side][i];
    if (game.flash && now < game.flash.until && game.flash[side] === i) return { edge: c.notYet, face: c.bad, text: c.notYetText, fade: 1 };
    if (game.matched.includes(id)) return lastPair?.id === id && now < lastPair.until ? { edge: green, face: c.good, text: c.goodText, fade: 1 } : { edge: c.line, face: c.card, text: c.text, fade: FADE };
    if (game.pick?.side === side && game.pick.i === i) return { edge: violet, face: c.soft, text: violet, fade: 1 };
    return { edge: c.line, face: c.card, text: c.text, fade: 1 };
  };
  const card = (side: Side, i: number) => {
    const id: string = game[side][i], l = look(side, i), done = game.matched.includes(id);
    return (
      <View key={`${side}-${i}-${id}`} style={{ opacity: l.fade }}>
        <RaisedPressable soundName={done ? false : "button"} disabled={done} accessibilityLabel={side === "audio" ? `Ovoz ${i + 1}` : P[id].en}
          accessibilityState={{ selected: game.pick?.side === side && game.pick.i === i }}
          onPress={() => tap(side, i)} radius={d(16)} depth={d(4)} backgroundColor={l.face} edgeColor={l.edge}
          faceStyle={{ height: d(60), borderWidth: 2, borderColor: l.edge, flexDirection: "row", alignItems: "center", justifyContent: side === "audio" ? "flex-start" : "center", gap: d(10), paddingHorizontal: d(12) }}>
          {side === "audio" ? <>
            <View style={{ width: d(26), height: d(26), borderRadius: d(7), borderWidth: 2, borderColor: l.edge, alignItems: "center", justifyContent: "center" }}><Txt style={{ ...type("small", d), fontFamily: "Nunito_900Black", color: l.text }}>{i + 1}</Txt></View>
            <Icon name="glyph-speaker-violet" size={d(20)} />
          </> : <Txt style={{ ...type("body", d), fontFamily: "Nunito_900Black", color: l.text, textAlign: "center" }}>{P[id].en}</Txt>}
        </RaisedPressable>
      </View>
    );
  };
  return (
    <Page style={{ padding: d(0), gap: d(0) }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), paddingHorizontal: d(16), paddingVertical: d(8) }}>
        <Pressable accessibilityLabel="Chiqish" onPress={() => { stopAudio(); setQuitting(Date.now()); }}><Icon name="glyph-close-grey" size={d(24)} /></Pressable>
        <View style={{ flex: 1, height: d(16), backgroundColor: c.line, borderRadius: d(8), overflow: "hidden" }}><Fill value={game.matched.length / 4} color={green} /></View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: d(2) }}><Icon name="flame-streak" size={d(18)} /><Bounce change={game.combo}><Txt style={{ color: TIME, fontSize: d(16), fontFamily: "Nunito_900Black" }}>{game.combo}</Txt></Bounce></View>
      </View>
      <View style={{ paddingHorizontal: d(16), paddingTop: d(12), gap: d(16) }}>
        <View style={{ gap: d(6) }}>
          <Txt style={{ ...type("label", d), color: brand.main }}>JUFTLANG</Txt>
          <Txt style={{ fontSize: d(22), lineHeight: d(27.5), fontFamily: "Nunito_900Black", color: ds.ink }}>Ovozni iboraga ulang</Txt>
        </View>
        <View accessibilityLabel={`${Math.ceil(left * 60)} soniya qoldi`} style={{ height: d(10), borderRadius: d(5), backgroundColor: c.line, overflow: "hidden" }}>
          <View style={{ width: `${left * 100}%`, height: "100%", borderRadius: d(5), backgroundColor: TIME }} />
        </View>
        <View style={{ flexDirection: "row", gap: d(12) }}>
          {(["audio", "phrase"] as const).map((side) => <View key={side} style={{ flex: 1, gap: d(12) }}>{game[side].map((_: string, i: number) => card(side, i))}</View>)}
        </View>
      </View>
      <DombiOverlay rule="nocarry" moment="idle" />
      {/* M5 · Leave: the clock waits while the sheet is open. */}
      <BottomSheet visible={quitting !== null} onClose={stay} scrimColor={scrim}>
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: ds.surface, borderTopLeftRadius: d(24), borderTopRightRadius: d(24), paddingHorizontal: d(20), paddingTop: d(12), paddingBottom: d(28), gap: d(16) }}>
          <SheetHandle />
          <View style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}>
            <Dombi moment="idle" size={d(80)} />
            <View style={{ flex: 1, gap: d(4) }}>
              <Txt style={{ ...type("heading", d), color: ds.ink }}>Chiqasizmi?</Txt>
              <Txt style={{ ...type("body", d), color: ds.muted }}>Bu urinish hisobga olinmaydi.</Txt>
            </View>
          </View>
          <Button label="DAVOM ETISH" onPress={stay} />
          {/* The sheet stays up while leaving, so the removal guard is already off. */}
          <LinkButton color={ds.muted} label="CHIQISH" onPress={() => requestAnimationFrame(toPractice)} />
        </SafeAreaView>
      </BottomSheet>
    </Page>
  );
}
