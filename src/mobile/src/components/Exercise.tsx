import { File } from "expo-file-system";
import { useIsFocused } from "expo-router";
import { useCallback,useEffect,useMemo,useRef,useState,type ReactNode } from "react";
import {
Pressable,
ScrollView,
View,
useWindowDimensions,
} from "react-native";
import Animated,{
Easing,
FadeInDown,
ReduceMotion,
useReducedMotion,
withSequence,
withTiming,
type EntryAnimationsValues,
} from "react-native-reanimated";
import { mix,spareTiles } from "../../../core/session.js";
import {
answerOf,
judgeAny,
sameTiles,
tilesOf,
voiceOf,
} from "../../../core/text.js";
import {
P,
T,
names,
type Item,
type Lesson,
type Voice,
} from "../data/content";
import { motion,play,sound,stopAudio } from "../lib/audio";
import { showProblem } from "../lib/problem";
import { useApp } from "../lib/store";
import { keepRecording,useSpeech } from "../lib/useSpeech";
import { getVisualAudit } from "../lib/visualAudit";
import { Actor } from "./Actor";
import { Effect } from "./Effects";
import { AudioBars,Pulse,arriveIn,closeGap,useAnswerMotion } from "./Motion";
import { RaisedPressable } from "./RaisedPressable";
import { SpeechAnswer } from "./SpeechAnswer";
import { type } from "./system";
import {
Button,
green,
Icon,
LinkButton,
Picture,
Txt,
useTheme,
violet
} from "./ui";

// The still waveform on Catch's audio bar (C1).
const WAVE = [8, 14, 22, 12, 28, 18, 32, 20, 10, 24, 16, 8];
export type Answer = { right: boolean; answer: string; tip?: string };
type Point = { x: number; y: number };
type Props = {
  item: Item;
  index: number;
  lesson: Lesson;
  speaking: boolean;
  paused: boolean;
  checked: boolean;
  onAnswer: (r: Answer) => void;
  onSpoken: (ms: number) => void;
  onSpeechRetry: () => void;
  onSpeakingOff: () => void;
  bottomControl?: ReactNode;
};
export function Exercise({
  item,
  index,
  lesson,
  speaking,
  paused,
  checked,
  onAnswer,
  onSpoken,
  onSpeechRetry,
  onSpeakingOff,
  bottomControl,
}: Props) {
  const audit = getVisualAudit();
  const { width: viewportWidth } = useWindowDimensions();
  const focused = useIsFocused();
  const d = (n: number) => n * Math.min(viewportWidth / 390, 1.2);

  const { settings, recordings, saveRecording } = useApp(),
    c = useTheme(),
    speech = useSpeech();
  const { abort } = speech;
  const p = item.p ? P[item.p] : undefined,
    text = String(answerOf(item, P) || ""),
    voice = voiceOf(item, P) as Voice;
  const way =
    !speaking && ["meet", "say"].includes(item.ex) ? "tiles" : item.ex;
  const wants = useMemo(
    () => [
      text,
      ...(item.also || []).map((id) => P[id].en),
      ...(item.accept || []),
    ],
    [text, item],
  );
  const bank = useMemo(
    () =>
      mix(
        [
          ...tilesOf(text),
          ...(item.ex === "tiles"
            ? item.extra || []
            : item.fix && item.wrong
            ? [...tilesOf(item.wrong).filter((w: string) => !tilesOf(text).some((t: string) => t.toLowerCase() === w.toLowerCase())), ...spareTiles(tilesOf(text), lesson.items.map((it) => answerOf(it, P)).filter(Boolean)).slice(0, 1)]
            : spareTiles(
                tilesOf(text),
                lesson.items.map((it) => answerOf(it, P)).filter(Boolean),
              )),
        ],
        index + text.length,
      ),
    [text, item, lesson.items, index],
  );
  const choices = useMemo(
    () => mix([0, 1, 2], index + (item.q?.length || 0)),
    [index, item.q],
  );
  const [selected, setSelected] = useState<number[]>(() => {
    if (!audit?.feedback) return [];
    const desired = tilesOf(text) as string[];
    if (audit.feedback === "wrong") return [Math.max(0, bank.findIndex(word => !desired.includes(word)))];
    const used = new Set<number>();
    return desired.map(word => { const index = bank.findIndex((candidate, i) => candidate === word && !used.has(i)); used.add(index); return index; }).filter(index => index >= 0);
  }),
    [choice, setChoice] = useState<number | null>(() => { if (!audit?.feedback) return null; const correct = item.ex === "heard" ? Number(item.right) : item.ex === "fix" ? item.bad : item.ex === "gap" ? item.gap : undefined; return correct == null ? null : audit.feedback === "right" ? correct : (correct + 1) % (item.ex === "heard" ? 3 : item.words?.length || 3); }),
    [showText, setShowText] = useState(false);
  const [verdict, setVerdict] = useState<boolean | null>(audit?.feedback ? audit.feedback === "right" : null),
    [slowPlayback, setSlowPlayback] = useState(false);
  const [origins, setOrigins] = useState<Record<number, Point>>({});
  const [returns, setReturns] = useState<Record<number, number>>({});
  const answerMotion = useAnswerMotion(verdict);
  const [activeSpeaker, setActiveSpeaker] = useState("");
  const [busy, setBusy] = useState(false),
    [heardOnce, setHeardOnce] = useState(item.ex !== "heard"),
    [error, setError] = useState("");
  const [words, setWords] = useState<{ text: string; ok: boolean }[]>(() => audit?.feedback && audit.speaking ? judgeAny(wants, [audit.feedback === "right" ? text : "coffee please"], p?.loose || []).words : []),
    [readAloud, setReadAloud] = useState(false),
    [hintShown, setHintShown] = useState(false),
    [whisper, setWhisper] = useState(false);
  const alive = useRef(true),
    attempts = useRef(0),
    locked = useRef(false),
    listeningRef = useRef(speech.listening);
  useEffect(() => {
    listeningRef.current = speech.listening;
  }, [speech.listening]);
  const replay = useCallback(
    async (slow = false) => {
      if (listeningRef.current) return;
      setBusy(true);
      setSlowPlayback(slow);
      setError("");
      try {
        if (item.ex === "heard") {
          for (const [who, line] of item.talk || []) {
            if (!alive.current) return;
            setActiveSpeaker(who);
            await play(who, line, settings.cast, slow);
            await new Promise(resolve => setTimeout(resolve, 280));
          }
          if (alive.current) setHeardOnce(true);
        } else {
          if (item.lead && !slow)
            await play(item.lead[0], item.lead[1], settings.cast);
          if (alive.current) await play(voice, text, settings.cast, slow);
        }
      } catch {
        if (alive.current) setError("Ovoz ochilmadi. Yana urinib ko'ring.");
      } finally {
        if (alive.current) { setBusy(false); setActiveSpeaker(""); }
      }
    },
    [item, settings.cast, voice, text],
  );
  useEffect(() => {
    alive.current = focused;
    if (!focused) return;
    const timer = setTimeout(() => {
      if (["meet", "echo", "heard"].includes(item.ex) || item.listen) void replay();
    }, 450);
    return () => {
      alive.current = false;
      clearTimeout(timer);
      stopAudio();
    };
  }, [item.ex, item.listen, replay, focused]);
  useEffect(() => {
    if (paused || !focused) {
      abort();
      stopAudio();
    }
  }, [paused, abort, focused]);
  const tip = item.trap ? T[item.trap]?.why : p ? `“${p.en}” — “${p.uz}”` : item.uz ? `“${text}” — “${item.uz}”` : "";
  const respond = (right: boolean, answer = text) => {
    if (locked.current) return;
    locked.current = true;
    setVerdict(right);
    for (const who of ["dombi", voice])
      motion({ who, talking: false, reaction: right ? "correct" : "wrong" });
    onAnswer({ right, answer, tip });
  };
  const say = async () => {
    if (speech.listening) {
      await speech.stop();
      return;
    }
    if (busy || checked || locked.current) return;
    setError("");
    setWords([]);
    const got = await speech.listen(whisper, text);
    if (!alive.current || paused || got.error === "aborted") return;
    if (got.error === "not-allowed") { const choice = await showProblem("mic-blocked"); if (choice === "tiles") onSpeakingOff(); return; }
    if (got.error || !got.alts.some((a) => a.trim())) {
      if (got.uri) {
        try {
          new File(got.uri).delete();
        } catch {}
      }
      attempts.current++;
      setError("Eshitilmadi. Yana bir bor ayting.");
      if (
        attempts.current >= 3 ||
        got.error === "network" ||
        got.error === "service-not-allowed"
      )
        { const choice = await showProblem("speech-unavailable"); if (choice === "tiles") onSpeakingOff(); else if (choice === "retry") setWhisper(true); }
      return;
    }
    onSpoken(got.ms);
    const result = judgeAny(
      readAloud ? [text] : wants,
      got.alts,
      p?.loose || [],
    );
    setWords(result.words);
    setShowText(true);
    if (result.right && got.uri && item.p && settings.saveVoice) {
      try {
        const uri = await keepRecording(got.uri, item.p);
        const old = recordings.find((r) => r.phraseId === item.p);
        saveRecording({
          phraseId: item.p,
          uri,
          at: new Date().toISOString(),
          ms: got.ms,
        });
        if (old?.uri) {
          try {
            new File(old.uri).delete();
          } catch {}
        }
      } catch {
        setError("Ovoz yozuvi saqlanmadi.");
      }
    }
    if (got.uri) {
      try {
        new File(got.uri).delete();
      } catch {}
    }
    if (!result.right) {
      // ASR text is insufficient evidence that the learner made a mistake.
      // Keep strict matching: this attempt neither passes nor changes the score.
      onSpeechRetry();
      setError("Ovoz tasdiqlanmadi. Yana ayting yoki so'zlarni tanlang.");
      return;
    }
    respond(result.right, result.right ? result.want : text);
  };
  const check = () => {
    if (busy || checked || locked.current) return;
    if (way === "tiles") {
      const built = selected.map((i) => bank[i]),
        right = wants.some((want) => sameTiles(built, want));
      if (right && item.ex === "tiles" && speaking) {
        setReadAloud(true);
        void replay();
        return;
      }
      respond(right);
    } else if (way === "heard") {
      const correct = Number(item.right);
      respond(
        choice === correct,
        item.opts?.[correct]?.[1] ||
          item.opts?.[correct]?.[0]?.replace("text:", "") ||
          "",
      );
    } else {
      respond(choice === (item.ex === "gap" ? item.gap : item.bad));
    }
  };
  const heading = readAloud
    ? "Endi ovoz chiqarib ayting"
    : item.listen
    ? "Eshitgan gapingizni yig'ing"
    : item.fix
    ? way === "tiles" ? "Gapni to'g'rilab tuzing" : "Gapni to'g'rilab ayting"
    : item.ex === "meet"
      ? way === "tiles"
        ? "Tinglang va gap tuzing"
        : "Tinglang va qaytaring"
      : item.ex === "say"
        ? item.task
        : item.ex === "echo"
          ? `${names[voice]}dan keyin qaytaring`
          : item.ex === "tiles"
            ? item.uz || p?.uz || "Gap tuzing"
            : item.ex === "heard"
              ? item.q
              : item.ex === "gap"
                ? "So'z tushib qolgan joyni bosing"
                : "Noto'g'ri so'zni bosing";
  const eyebrow =
    item.listen ? "TUTIB OLING" : item.fix ? "TUZATIB AYTING" : item.ex === "meet"
      ? "YANGI IBORA"
      : item.ex === "say"
        ? way === "tiles" ? "GAP TUZING" : "AYTING"
        : item.ex === "echo"
          ? "QAYTARING"
          : item.ex === "heard"
            ? "TINGLANG"
            : item.ex === "gap"
              ? "BO'SHLIQNI TOPING"
              : item.ex === "tiles"
                ? "GAP TUZING"
                : "XATONI TOPING";
  const speakingTurn = readAloud || ["meet", "say", "echo"].includes(way);
  const choiceColor = (i: number) => {
    if (verdict !== null) {
      const correct =
        item.ex === "heard"
          ? Number(item.right)
          : item.ex === "gap"
            ? item.gap
            : item.bad;
      if (i === correct) return { edge: green, text: c.goodText, face: c.good };
      if (i === choice) return { edge: c.notYet, text: c.notYetText, face: c.bad };
    }
    return {
      edge: choice === i ? violet : c.line,
      text: choice === i ? violet : c.text,
      face: choice === i ? c.soft : c.card,
    };
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: d(16),
          paddingTop: d(12),
          paddingBottom: checked ? d(250) : d(4), // room for the answer panel
          gap: d(16),
          flexGrow: 1,
        }}
      >
        <View style={{ gap: d(6) }}>
        <Txt
          style={{
            color: violet,
            fontFamily: "Nunito_900Black",
            fontSize: d(12),
            letterSpacing: d(.8),
          }}
        >
          {item.step != null
            ? `${item.step + 1}/${lesson.steps?.length || 5} · ${lesson.steps?.[item.step]?.toUpperCase() || eyebrow}`
            : eyebrow}
        </Txt>
        <Txt
          style={{
            fontSize: d(22),
            lineHeight: d(27.5),
            fontFamily: "Nunito_900Black",
          }}
        >
          {heading || p?.uz || item.uz}
        </Txt>
        </View>
        {item.fix ? (
          // X4/X5: the situation, then the sentence with its one mistake.
          <View style={{ gap: d(12) }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: d(8) }}><Icon name="speak-bubble" size={d(18)} /><Txt style={{ flex: 1, color: c.muted, fontSize: d(15), fontFamily: "Nunito_800ExtraBold" }}>{item.ctx}</Txt></View>
            <View style={{ backgroundColor: c.card, borderRadius: d(18), borderWidth: d(2), borderColor: c.line, padding: d(16), gap: d(6) }}>
              <Txt style={{ ...type("label", d), color: c.muted }}>BU GAPDA BITTA XATO BOR:</Txt>
              <Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black" }}>{item.wrong}</Txt>
            </View>
          </View>
        ) : null}
        {item.listen ? (
          // C1: the sentence is only heard; the bar plays it again, the button beside it slowly.
          <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), backgroundColor: c.card, borderRadius: d(18), borderWidth: d(2), borderColor: c.line, padding: d(12) }}>
            <RaisedPressable soundName={false} disabled={busy} accessibilityLabel="Sekin tinglash" onPress={() => { void replay(true); }} radius={d(12)} depth={d(3)} backgroundColor={c.card} edgeColor={c.line} faceStyle={{ width: d(40), height: d(40), borderWidth: d(2), borderColor: c.line, alignItems: "center", justifyContent: "center" }}><Icon name="glyph-slow-violet" size={d(18)} /></RaisedPressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Tinglash" disabled={busy} onPress={() => { void replay(); }} style={{ flex: 1, height: d(40), flexDirection: "row", alignItems: "center", gap: d(3) }}>{busy ? <AudioBars color={violet} size={d(30)} count={4} /> : WAVE.map((h, i) => <View key={i} style={{ width: d(3), height: d(h), borderRadius: d(2), backgroundColor: violet }} />)}</Pressable>
          </View>
        ) : null}
        {!item.fix && (item.ex === "meet" || (item.ex === "say" && way !== "tiles")) ? (
          <View style={{ gap: d(16) }}>
            <View
              style={{
                width: "100%",
                height: d(way === "tiles" ? 96 : item.ex === "say" ? 150 : 130),
                backgroundColor: c.card,
                borderRadius: d(20),
                borderWidth: d(2),
                borderColor: c.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Picture name={item.pic || p?.pic} size={d(83)} />
            </View>
        {item.ex === "meet" ? (
              <Txt
                style={{
                  color: c.muted,
                  fontSize: d(17),
                  fontFamily: "Nunito_800ExtraBold",
                }}
              >
                “{p?.uz}”
              </Txt>
            ) : null}
          </View>
        ) : null}
            {item.ex === "meet" && way !== "tiles" ? <View style={{ minHeight: d(28) }}>{showText || checked ? <Txt style={{ fontSize: d(20), fontFamily: "Nunito_900Black" }}>{text}</Txt> : null}</View> : null}
        {item.ex === "say" && way !== "tiles" && !checked && !speech.transcript ? <Pressable accessibilityRole="button" accessibilityLabel="Yordam" onPress={() => setHintShown(true)} style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: d(4), paddingVertical: d(8), paddingHorizontal: d(14), borderRadius: d(12), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card }}><Icon name="bulb-tip" size={d(17)} /><Txt style={{ fontSize: d(15), fontFamily: "Nunito_800ExtraBold", color: c.muted }}>{hintShown ? text.split(" ")[0].replace(/[.,!?]/g, "") + (text.trim().includes(" ") ? " …" : "") : "Yordam"}</Txt></Pressable> : null}
        {item.ex === "echo" ? <View style={{ flexDirection: "row", alignItems: "flex-end", gap: d(12) }}><View style={{ width: d(56), height: d(56), borderRadius: d(28), backgroundColor: c.soft, overflow: "hidden" }}><Actor who={voice} size={d(56)} /></View><View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: d(10), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, borderRadius: d(18), borderBottomLeftRadius: d(4), padding: d(14) }}><RaisedPressable accessibilityLabel="Tinglash" onPress={() => { void replay(); }} radius={d(12)} depth={d(3)} backgroundColor={c.card} edgeColor={c.line} faceStyle={{ width: d(36), height: d(36), borderWidth: d(2), borderColor: c.line, alignItems: "center", justifyContent: "center" }}>{busy ? <AudioBars color={violet} size={d(18)} /> : <Icon name="glyph-speaker-violet" size={d(18)} />}</RaisedPressable><Txt style={{ flex: 1, fontSize: d(18), fontFamily: "Nunito_900Black" }}>{text}</Txt></View></View> : null}
        {item.ex === "heard" ? (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: d(28),
              }}
            >
              {[...new Set(item.talk?.map(([who]) => who))].map((who) => (
                <View key={who} style={{ alignItems: "center", gap: d(6) }}>
                  {/* The Rive view keeps its first size, so the face is always drawn at 92 and shrunk with a transform. */}
                  <View style={{ width: d(checked ? 56 : 92), height: d(checked ? 56 : 92) }}><View style={{ position: "absolute", left: d(checked ? -18 : 0), top: d(checked ? -18 : 0), width: d(92), height: d(92), transform: [{ scale: (checked ? 56 / 92 : 1) * (activeSpeaker === who ? 1.06 : 1) }] }}><View style={{ width: "100%", height: "100%", borderRadius: d(46), backgroundColor: c.soft, overflow: "hidden" }}><Actor who={who} size={d(92)} /></View>{activeSpeaker === who ? <View style={{ position: "absolute", top: d(-3), left: d(-3), right: d(-3), bottom: d(-3), borderWidth: d(3), borderColor: violet, borderRadius: d(50) }} /> : null}</View></View>
                  <Txt style={{ color: activeSpeaker === who ? violet : c.muted, fontSize: d(13), fontFamily: "Nunito_900Black" }}>
                    {names[who]}
                  </Txt>
                </View>
              ))}
            </View>
            {!checked && heardOnce ? <RaisedPressable onPress={() => { if (!busy) void replay(); }} accessibilityLabel="YANA TINGLASH" disabled={busy} radius={d(16)} depth={d(4)} backgroundColor={busy ? c.line : c.card} edgeColor={busy ? c.edge : c.line} style={{ alignSelf: "center", width: "100%" }} faceStyle={{ height: d(44), paddingHorizontal: d(18), borderWidth: d(2), borderColor: c.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: d(8) }}><Icon name="glyph-replay-violet" size={d(16)} style={busy ? { tintColor: c.muted } : undefined} /><Txt style={{ fontSize: d(13), color: busy ? c.muted : violet, fontFamily: "Nunito_900Black" }}>YANA TINGLASH</Txt></RaisedPressable> : null}
            {heardOnce ? (
              <View style={{ flexDirection: "row", gap: d(8) }}>
                {choices.map((k) => (
                  <Animated.View
                    key={k}
                    style={[
                      { flex: 1 },
                      choice === k ? answerMotion : undefined,
                    ]}
                  >
                    <RaisedPressable
                      soundName={false}
                      testID={`heard-${k}`}
                      style={{ flex: 1 }}
                      disabled={checked}
                      accessibilityLabel={
                        item.opts?.[k]?.[1] || item.opts?.[k]?.[0]
                      }
                      onPress={() => {
                        setChoice(k);
                        sound("pick", settings.sound);
                      }}
                      radius={d(18)}
                      depth={d(4)}
                      backgroundColor={choiceColor(k).face}
                      edgeColor={choiceColor(k).edge}
                      accessibilityState={{
                        selected: choice === k,
                        disabled: checked,
                      }}
                      faceStyle={{
                        borderWidth: d(2),
                        borderColor: choiceColor(k).edge,
                        paddingTop: d(10), paddingBottom: d(12),
                        paddingHorizontal: d(10),
                        flex: 1,
                        alignItems: "center",
                        gap: d(8),
                      }}
                    >
                      <View style={{ width: "100%", height: d(104), borderRadius: d(12), backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}><Picture name={item.opts?.[k]?.[0]} size={d(68)} /></View>
                      <Txt style={{ textAlign: "center", fontSize: d(15), lineHeight: d(17.25), fontFamily: "Nunito_800ExtraBold", color: choiceColor(k).text, width: item.opts?.[k]?.[1]?.includes(" ") ? undefined : d(112) }}>
                        {item.opts?.[k]?.[1]}
                      </Txt>
                    </RaisedPressable>
                  </Animated.View>
                ))}
              </View>
            ) : null}
            {checked ? (
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: d(14),
                  paddingVertical: d(12), paddingHorizontal: d(14),
                  gap: d(4),
                }}
              >
                <Txt style={{ color: c.muted, fontSize: d(11), fontFamily: "Nunito_900Black", letterSpacing: d(.6) }}>
                  SUHBAT MATNI:
                </Txt>
                {item.talk?.map(([who, line], i) => (
                  <Txt key={i} style={{ fontSize: d(15), fontFamily: "Nunito_800ExtraBold" }}><Txt style={{ color: c.muted, fontFamily: "Nunito_900Black" }}>{names[who]}:</Txt> {line}</Txt>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        {["fix", "gap"].includes(way) ? (
          <>
            <Txt style={{ color: c.muted, fontSize: d(17), lineHeight: d(23.8), fontFamily: "Nunito_800ExtraBold" }}>{item.ctx}</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: d(8), rowGap: d(12), minHeight: d(40) }}>
              {item.words?.map((word, i) => (
                <Animated.View
                  key={i}
                  style={[
                    choice === i ? answerMotion : undefined,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: d(6),
                    },
                  ]}
                >
                  {item.ex === "gap" && (verdict !== true || choice === i) ? (
                    <Pressable
                      testID={`gap-${i}`}
                      disabled={checked}
                      onPress={() => {
                        setChoice(i);
                        sound("pick", settings.sound);
                      }}
                      style={{
                        borderWidth: d(2),
                        borderColor: verdict === true ? green : verdict === false && choice === i ? c.notYet : violet,
                        backgroundColor: verdict === true ? c.good : verdict === false && choice === i ? c.bad : choice === i ? violet : c.soft,
                        borderRadius: d(8),
                        width: verdict === true ? undefined : d(40), height: d(32), paddingHorizontal: verdict === true ? d(6) : 0, alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Txt style={{ color: verdict === true ? "#27A852" : choice === i ? "#FFFFFF" : violet, fontSize: d(verdict === true ? 22 : 18), fontFamily: verdict === true ? "Nunito_800ExtraBold" : "Nunito_900Black" }}>{verdict === true ? item.put || text.split(" ")[item.gap || 0]?.replace(/[.,!?]/g, "") : "+"}</Txt>
                    </Pressable>
                  ) : null}
                  <Pressable
                    testID={`word-${i}`}
                    disabled={checked || item.ex === "gap"}
                    onPress={() => {
                      setChoice(i);
                      sound("pick", settings.sound);
                    }}
                    style={{
                      borderBottomWidth: d(3),
                      borderColor:
                        item.ex !== "gap" ? (verdict !== null ? choiceColor(i).edge : choice === i ? violet : c.edge) : "transparent",
                      paddingHorizontal: d(item.ex === "gap" ? 2 : 6), paddingVertical: d(2),
                      backgroundColor:
                        item.ex !== "gap" ? choiceColor(i).face : c.bg,
                      borderRadius: d(8),
                    }}
                  >
                    <Txt style={{ fontSize: d(22), fontFamily: "Nunito_800ExtraBold", color: item.ex !== "gap" && verdict !== null && (choice === i || i === item.bad) ? choiceColor(i).text : item.ex !== "gap" && choice === i ? violet : c.text }}>{verdict === true && item.ex === "fix" && choice === i ? text.split(" ")[i] : word}</Txt>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            {verdict === true ? <Animated.View entering={arriveIn} style={{ flexDirection: "row", gap: d(12), padding: d(16), borderRadius: d(16), backgroundColor: c.cream, borderWidth: d(2), borderColor: "#FFC93C" }}><Icon name="bulb-tip" size={d(23)} /><View style={{ flex: 1 }}><Txt style={{ fontSize: d(11), letterSpacing: d(.6), color: c.goldText, fontFamily: "Nunito_900Black", marginBottom: d(4) }}>O&apos;ZBEKCHA IZOH</Txt><Txt style={{ fontSize: d(14) }}>{item.trap ? T[item.trap]?.why : ""}</Txt></View></Animated.View> : null}
          </>
        ) : null}
        {item.ex === "meet" && (!speakingTurn || (!checked && !speech.listening && !speech.transcript)) ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: d(16),
            }}
          >
            <RaisedPressable
              disabled={busy || speech.listening}
              soundName={false}
              accessibilityLabel="Tinglash"
              onPress={() => {
                void replay();
              }}
              radius={d(22)}
              depth={d(6)}
              backgroundColor={busy || speech.listening ? c.line : violet}
              edgeColor={busy || speech.listening ? c.edge : "#5A3FD9"}
              faceStyle={{
                width: d(80),
                height: d(80),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {busy && !slowPlayback ? (
                <AudioBars color={c.muted} size={d(34)} count={4} />
              ) : (
                <Icon name="glyph-speaker-white" size={d(34)} style={busy || speech.listening ? { tintColor: c.muted } : undefined} />
              )}
            </RaisedPressable>
            <RaisedPressable
              disabled={busy || speech.listening}
              soundName={false}
              accessibilityLabel="Sekin tinglash"
              onPress={() => {
                void replay(true);
              }}
              radius={d(16)}
              depth={d(4)}
              backgroundColor={busy || speech.listening ? c.line : c.soft}
              edgeColor={c.edge}
              faceStyle={{
                width: d(52),
                height: d(52),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {busy && slowPlayback ? (
                <AudioBars color={c.muted} size={d(22)} />
              ) : (
                <Icon name="glyph-slow-violet" size={d(22)} style={busy || speech.listening ? { tintColor: c.muted } : undefined} />
              )}
            </RaisedPressable>
          </View>
        ) : null}
        {way === "tiles" ? (
          <>
            <Animated.View
              style={[
                { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: d(8) },
                answerMotion,
                {
                  minHeight: d(112),
                  justifyContent: "flex-start",
                  paddingBottom: d(8),
                  borderBottomWidth: d(2),
                  borderColor: c.line,
                  zIndex: 5,
                },
              ]}
            >
              {selected.map((k) => (
                <Tile
                  key={k}
                  testID={`answer-${k}`}
                  word={bank[k]}
                  active
                  from={origins[k]}
                  verdict={verdict}
                  onPress={(from) => {
                    if (!checked && !readAloud) {
                      if (from) setOrigins((v) => ({ ...v, [k]: from }));
                      setReturns((v) => ({ ...v, [k]: (v[k] || 0) + 1 }));
                      setSelected(selected.filter((i) => i !== k));
                      sound("tile", settings.sound);
                    }
                  }}
                />
              ))}
              {verdict === true ? (
                <Effect
                  board="Pop"
                  color="#3DCB6C"
                  style={{
                    position: "absolute",
                    width: d(180),
                    height: d(180),
                    alignSelf: "center",
                    top: -d(40),
                  }}
                />
              ) : null}
            </Animated.View>
            {!readAloud ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: d(8) }}>
                {bank.map((word, k) => (
                  <Tile
                    key={`${k}-${returns[k] || 0}`}
                    testID={`bank-${k}`}
                    word={word}
                    faded={selected.includes(k)}
                    from={returns[k] ? origins[k] : undefined}
                    onPress={(from) => {
                      if (!checked && !selected.includes(k)) {
                        if (from) setOrigins((v) => ({ ...v, [k]: from }));
                        setSelected([...selected, k]);
                        sound("tile", settings.sound);
                      }
                    }}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        {speakingTurn && (speech.listening || speech.transcript || words.length > 0) ? <SpeechAnswer words={words} transcript={speech.transcript} final={words.length > 0} accepted={verdict === true} onReplay={() => { void replay(); }} /> : null}
        {speakingTurn ? (
          <View style={{ alignItems: "center", gap: d(10), marginTop: "auto" }}>
            <>
                <View
                  style={{
                    width: d(112),
                    height: d(112),
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: 1 + speech.volume * 0.08 }],
                  }}
                >
                  {!checked && !busy ? <Pulse
                    key={speech.listening ? "listening" : "ready"}
                    halo
                    style={{
                      position: "absolute",
                      width: d(98),
                      height: d(98),
                      borderRadius: d(49),
                      borderWidth: d(3),
                      borderColor: speech.listening ? "#FF6B5B" : violet,
                    }}
                  /> : null}
                  <RaisedPressable
                    testID="speak"
                    soundName={false}
                    accessibilityRole="button"
                    accessibilityLabel={
                      speech.listening ? "To'xtatish" : "Bosib gapiring"
                    }
                    disabled={busy || checked}
                    onPress={() => {
                      void say();
                    }}
                    radius={d(44)}
                    depth={d(6)}
                    backgroundColor={busy ? c.line : checked ? "#3DCB6C" : speech.listening ? "#FF6B5B" : violet}
                    edgeColor={busy ? c.edge : checked ? "#27A852" : speech.listening ? "#D9483A" : "#5A3FD9"}
                    faceStyle={{
                      width: d(88),
                      height: d(88),
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {checked ? <Icon name="glyph-check-white" size={d(38)} /> : speech.listening ? <AudioBars color="#FFFFFF" size={d(30)} count={4} /> : <Icon name="glyph-mic-white" size={d(38)} style={busy ? { tintColor: c.muted } : undefined} />}
                  </RaisedPressable>
                </View>
                <Txt style={{ color: c.muted, fontSize: d(13), fontFamily: "Nunito_800ExtraBold" }}>
                  {checked ? "Eshitdim!" : speech.listening
                    ? "Tinglayapman…"
                    : busy
                      ? "TINGLANG…"
                      : "Bosib gapiring"}
                </Txt>
              </>
          </View>
        ) : null}
        {error ? (
          <Txt
            accessibilityRole="alert"
            style={{ color: words.length ? c.muted : "#D9483A", textAlign: "center", fontSize: d(14) }}
          >
            {error}
          </Txt>
        ) : null}
        {item.ex === "meet" && way !== "tiles" && !checked && !speech.transcript ? (
          <Pressable accessibilityLabel={showText ? "Matnni yashirish" : "Matnni ko'rsatish"} onPress={() => setShowText(!showText)} style={{ alignSelf: "center", paddingVertical: d(6), paddingHorizontal: d(8) }}><Txt style={{ color: violet, fontSize: d(14), fontFamily: "Nunito_800ExtraBold" }}>{showText ? "Matnni yashirish" : "Matnni ko'rsatish"}</Txt></Pressable>
        ) : null}
        {readAloud && !checked ? (
          <LinkButton
            label="O'TKAZIB YUBORISH"
            onPress={() => {
              speech.abort();
              respond(true);
            }}
          />
        ) : null}
      </ScrollView>
      {!checked ? (
        <View
          style={{
            paddingHorizontal: d(16),
            paddingTop: d(16),
            paddingBottom: d(28),
            gap: d(14),
            borderTopWidth: d(2),
            borderColor: c.line,
            backgroundColor: c.card,
          }}
        >
          <Button
            label="TEKSHIRISH"
            onPress={check}
            disabled={
              speakingTurn ||
              busy ||
              (way === "tiles" ? selected.length === 0 : choice === null)
            }
            testID="lesson-check"
          />
          {bottomControl}
        </View>
      ) : null}
    </View>
  );
}
function Tile({
  word,
  onPress,
  active = false,
  faded = false,
  testID,
  from,
  verdict = null,
}: {
  testID?: string;
  word: string;
  onPress: (from?: Point) => void;
  active?: boolean;
  faded?: boolean;
  from?: Point;
  verdict?: boolean | null;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const d = (n: number) => n * Math.min(viewportWidth / 390, 1.2);

  const c = useTheme();
  const ref = useRef<View>(null),
    reduced = useReducedMotion();
  const entering = useMemo(
    () =>
      from && !reduced
        ? (values: EntryAnimationsValues) => {
            "worklet";
            const x = from.x - values.targetGlobalOriginX,
              y = from.y - values.targetGlobalOriginY;
            return {
              initialValues: {
                transform: [{ translateX: x }, { translateY: y }],
              },
              animations: {
                transform: [
                  {
                    translateX: withTiming(0, {
                      duration: 260,
                      easing: Easing.bezier(0.2, 0, 0, 1),
                    }),
                  },
                  {
                    translateY: withSequence(
                      withTiming(y * 0.45 - 18, { duration: 130 }),
                      withTiming(0, { duration: 130 }),
                    ),
                  },
                ],
              },
            };
          }
        : FadeInDown.duration(180).reduceMotion(ReduceMotion.System),
    [from, reduced],
  );
  const edge =
    active && verdict !== null
      ? verdict
        ? green
        : c.notYet
      : c.line;
  return (
    <Animated.View
      ref={ref}
      collapsable={false}
      entering={entering}
      layout={closeGap}
    >
      <RaisedPressable
        testID={testID}
        soundName={false}
        accessibilityRole="button"
        accessibilityLabel={word}
        disabled={faded}
        onPress={() => {
          if (ref.current)
            ref.current.measureInWindow((x, y) => onPress({ x, y }));
          else onPress();
        }}
        radius={d(12)}
        depth={d(4)}
        backgroundColor={
          faded
            ? c.line
            : active && verdict !== null
              ? verdict
                ? c.good
                : c.bad
              : c.card
        }
        edgeColor={faded ? "transparent" : edge}
        faceStyle={{
          minHeight: d(44),
          justifyContent: "center",
          paddingHorizontal: d(16),
          borderWidth: d(2),
          borderColor: edge,
        }}
      >
        <Txt
          style={{
            fontSize: d(17),
            fontFamily: "Nunito_800ExtraBold",
            color: active && verdict !== null ? verdict ? c.goodText : c.notYetText : c.text,
            opacity: faded ? 0 : 1,
          }}
        >
          {word}
        </Txt>
      </RaisedPressable>
    </Animated.View>
  );
}
