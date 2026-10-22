import { router,useIsFocused } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useCallback,useEffect,useEffectEvent,useRef,useState,} from "react";
import { BackHandler,Modal,Pressable,View } from "react-native";
import Animated,{ FadeInDown,FadeOutDown,ReduceMotion,} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { progressOf } from "../../../core/progress.js";
import { makeSession } from "../../../core/session.js";
import { answerOf } from "../../../core/text.js";
import { Actor } from "../components/Actor";
import { BottomSheet,SheetHandle } from "../components/BottomSheet";
import { Effect } from "../components/Effects";
import { Exercise,type Answer } from "../components/Exercise";
import { LessonMoment } from "../components/LessonMoment";
import { Bounce,Fill } from "../components/Motion";
import { ProblemContent } from "../components/ProblemContent";
import { ScreenTransition } from "../components/ScreenTransition";
import { Button,gold,green,Icon,LinkButton,Page,Txt,useTheme,violet } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { lessons,P,T,units,type Item,type Lesson } from "../data/content";
import { cutRewards,sound,stopAudio } from "../lib/audio";
import { goHome } from "../lib/navigation";
import { read,write } from "../lib/storage";
import type { Resume } from "../lib/store";
import { useApp } from "../lib/store";
import { getVisualAudit } from "../lib/visualAudit";
export default function LessonScreen({ id, onExit, }: {
    id: string;
    onExit: () => void;
}) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return <ProblemContent kind="not-found" onChoice={onExit} onHome={goHome} onReport={() => router.navigate("/feedback")} />;
    return <Player lesson={lesson} onExit={onExit}/>;
}
export function Player({ lesson, onExit, quiet = false }: {
    lesson: Lesson;
    onExit: () => void;
    quiet?: boolean;
}) {
    const d = useDesignScale();
    const audit = getVisualAudit();
    const app = useApp(), { settings } = app, c = useTheme();
    const [engine] = useState(() => {
        const resume = quiet ? null : read<Resume | null>("resume", null), session = makeSession(lesson, {
            speaking: resume?.id === lesson.id ? resume.speaking : settings.speaking,
        });
        const ops = resume?.id === lesson.id ? [...resume.ops] : [];
        for (const op of ops) {
            session.startMistakes();
            if (!session.next())
                break;
            if (op === "v")
                session.retrySpeech();
            else if (op === "s")
                session.skip();
            else
                session.answer(op === "r");
        }
        let spokenMs = resume?.id === lesson.id ? resume.spokenMs : 0;
        return {
            session,
            ops,
            get spokenMs() {
                return spokenMs;
            },
            addSpoken(ms: number) {
                spokenMs += ms;
            },
            setSpeaking(on: boolean) {
                session.speaking = on;
            },
        };
    });
    const { session, ops } = engine;
    const nextItem = useCallback(() => {
        let e = session.next();
        while (e && session.way(e.item) === "skip") {
            session.skip();
            ops.push("s");
            e = session.next();
        }
        return e;
    }, [session, ops]);
    const [current, setCurrent] = useState(() => {
        const item = nextItem();
        if (audit?.feedback && item) {
            session.answer(audit.feedback === "right");
            ops.push(audit.feedback === "right" ? "r" : "w");
        }
        return item;
    });
    const [turn, setTurn] = useState(0);
    const [speaking, setSpeaking] = useState(session.speaking), [feedback, setFeedback] = useState<Answer | null>(audit?.feedback && current ? { right: audit.feedback === "right", answer: String(answerOf(current.item, P)), tip: current.item.trap ? T[current.item.trap]?.why : current.item.p ? `“${P[current.item.p].en}” — “${P[current.item.p].uz}”` : current.item.uz ? `“${String(answerOf(current.item, P))}” — “${current.item.uz}”` : "" } : null);
    const [phase, setPhase] = useState<"exercise" | "mistakes" | "canSay" | "result" | "streak" | "level">(() => (current ? "exercise" : lesson.checkpoint ? "result" : "canSay"));
    const [quitting, setQuitting] = useState(!!audit?.quit), [combo, setCombo] = useState(audit?.combo ?? 0), [streak, setStreak] = useState(0);
    const [leaving, setLeaving] = useState<"save" | "complete" | null>(null);
    usePreventRemove(!audit && !quiet && !leaving && ["exercise", "mistakes", "canSay", "result"].includes(phase), () => {
        if (phase === "exercise" || phase === "mistakes")
            setQuitting(true);
        else
            setLeaving("complete");
    });
    const didLeave = useRef(false), completed = useRef(false), alive = useRef(true), counted = useRef(false);
    const hadQuit = useRef(false);
    useEffect(() => {
        if (quitting || hadQuit.current)
            sound(quitting ? "whoosh" : "close", settings.sound);
        hadQuit.current = quitting;
        if (quitting)
            stopAudio();
    }, [quitting, settings.sound]);
    const snapshot = useCallback(() => ({
        id: lesson.id,
        ops: [...ops],
        spokenMs: Math.round(engine.spokenMs),
        speaking: session.speaking,
    }), [lesson.id, ops, engine, session]);
    useEffect(() => {
        alive.current = true;
        if (!quiet) write("resume", snapshot());
        return () => {
            alive.current = false;
            stopAudio();
        };
    }, [snapshot, quiet]);
    const advance = () => {
        stopAudio();
        setFeedback(null);
        counted.current = false;
        setTurn((n) => n + 1);
        if (session.startMistakes()) {
            setPhase("mistakes");
            sound("whoosh", settings.sound);
            return;
        }
        const next = nextItem();
        setCurrent(next);
        if (!quiet) app.saveResume(snapshot());
        if (!next) {
            if (quiet) { onExit(); return; }
            setPhase(lesson.checkpoint ? "result" : "canSay");
            sound(lesson.checkpoint ? "trophy" : "new-phrase", settings.sound);
        }
    };
    const answer = (result: Answer) => {
        if (!alive.current || counted.current)
            return;
        counted.current = true;
        session.answer(result.right);
        ops.push(result.right ? "r" : "w");
        if (!quiet) app.saveResume(snapshot());
        setFeedback(result);
        sound(result.right ? "right" : "not-right", settings.sound);
    };
    const next = () => {
        const n = session.stats().combo;
        if (feedback?.right && [3, 5, 10].includes(n)) {
            setCombo(n);
            sound("combo", settings.sound);
        }
        else
            advance();
    };
    const continueCombo = useEffectEvent(() => {
        setCombo(0);
        advance();
    });
    useEffect(() => {
        if (!combo || audit)
            return;
        const timer = setTimeout(() => continueCombo(), 1300);
        return () => clearTimeout(timer);
    }, [combo, audit]);
    const home = () => {
        if (settings.needAccount && lesson.id === "l1")
            router.replace("/account");
        else if (settings.joined &&
            Date.now() - new Date(settings.joined).getTime() >= 13.5 * 86400000 &&
            !app.events.some((e) => e.type === "confidence"))
            router.replace("/confidence");
        else
            goHome();
    };
    const finish = (exitImmediately = false) => {
        if (completed.current) {
            home();
            return;
        }
        completed.current = true;
        const stats = session.stats(), wasToday = app.progress.streak.today;
        const event = app.add({
            type: "lesson",
            id: lesson.id,
            accuracy: stats.accuracy,
            mistakes: stats.mistakes,
            speechRetries: stats.speechRetries,
            spokenMs: Math.round(engine.spokenMs),
            skipped: stats.skipped,
        });
        app.saveResume(null);
        const after = progressOf(units, [...app.events, event]);
        setStreak(after.streak.count);
        if (exitImmediately) {
            home();
            return;
        }
        if (after.level > app.progress.level) {
            setPhase("level");
            sound("level-up", settings.sound);
        }
        else if (!wasToday) {
            setPhase("streak");
            sound("streak", settings.sound);
        }
        else
            home();
    };
    const leave = useEffectEvent(() => {
        if (!leaving || didLeave.current)
            return;
        didLeave.current = true;
        stopAudio();
        if (leaving === "complete")
            finish(true);
        else {
            if (!quiet) app.saveResume(snapshot());
            onExit();
        }
    });
    useEffect(() => {
        if (!leaving)
            return;
        // Let the removal guard update before dispatching the saved exit.
        const frame = requestAnimationFrame(() => leave());
        return () => cancelAnimationFrame(frame);
    }, [leaving]);
    const focused = useIsFocused();
    const back = useEffectEvent(() => {
        if (quiet) { onExit(); return; }
        if (phase === "exercise" || phase === "mistakes")
            setQuitting(true);
        else if (phase === "canSay" || phase === "result")
            finish(true);
        else
            onExit();
    });
    useEffect(() => {
        if (!focused)
            return;
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            back();
            return true;
        });
        return () => sub.remove();
    }, [focused]);
    const leaveSheet = <BottomSheet visible={quitting} onClose={() => setQuitting(false)}>
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.bg, borderTopLeftRadius: d(28), borderTopRightRadius: d(28), paddingHorizontal: d(20), paddingTop: d(24), paddingBottom: d(28), gap: d(12) }}>
      <SheetHandle />
      <View style={{ alignItems: "center" }}><Actor size={d(80)}/></View>
      <Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black", textAlign: "center" }}>Darsni to&apos;xtatib turamizmi?</Txt>
      <Txt style={{ textAlign: "center", color: c.muted }}>Javoblaringiz saqlanadi. Keyin shu joydan davom etasiz.</Txt>
      <Button label="DAVOM ETISH" onPress={() => setQuitting(false)}/>
      <LinkButton color="#FF4B5C" label="SAQLASH VA CHIQISH" onPress={() => { setQuitting(false); setLeaving("save"); }}/>
    </SafeAreaView>
  </BottomSheet>;
    if (phase !== "exercise") {
        const stats = session.stats();
        return (<View style={{ flex: 1 }}><ScreenTransition transitionKey={phase}>
        <LessonMoment phase={phase} lesson={lesson} stats={stats} spokenMs={engine.spokenMs} streak={streak} onContinue={() => {
                cutRewards();
                if (phase === "mistakes") {
                    setPhase("exercise");
                    setTurn((n) => n + 1);
                    setCurrent(nextItem());
                }
                else if (phase === "canSay") {
                    setPhase("result");
                    sound(stats.perfect ? "perfect" : "lesson-done", settings.sound);
                }
                else if (phase === "result")
                    finish();
                else
                    home();
            }}/>
      </ScreenTransition>{leaveSheet}</View>);
    }
    return (<ScreenTransition transitionKey={phase}>
      <Page style={{ padding: d(0), gap: d(0) }}>
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: d(12),
            paddingHorizontal: d(16),
            paddingVertical: d(8),
        }}>
          <Pressable accessibilityLabel="Darsdan chiqish" onPress={() => {
            stopAudio();
            if (quiet) onExit(); else setQuitting(true);
        }}>
            <Icon name="glyph-close-grey" size={d(24)}/>
          </Pressable>
          <View style={{
            flex: 1,
            height: d(16),
            backgroundColor: c.line,
            borderRadius: d(8),
            overflow: "hidden",
        }}>
            <Fill value={session.stats().progress} color={session.stats().combo >= 5 ? gold : green}/>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: d(2) }}><Icon name="flame-streak" size={d(18)}/>
          <Bounce change={session.stats().combo}>
            <Txt style={{
            color: "#FF9F1C",
            fontSize: d(16),
            fontFamily: "Nunito_900Black",
        }}>
              {session.stats().combo}
            </Txt>
          </Bounce></View>
        </View>
        {current ? (<ScreenTransition transitionKey={`${current.n}-${current.round}-${speaking}-${turn}`}>
            <Exercise key={`${current.n}-${current.round}-${speaking}-${turn}`} item={current.item as Item} index={current.n} lesson={lesson} speaking={speaking} paused={quitting} checked={!!feedback} bottomControl={<Pressable accessibilityLabel={speaking ? "HOZIR GAPIRA OLMAYMAN" : "GAPIRISH O'CHIQ · YOQISH"} onPress={() => { stopAudio(); engine.setSpeaking(!speaking); setSpeaking(!speaking); if (!quiet) app.saveResume(snapshot()); setCurrent(nextItem()); }} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: d(6), paddingVertical: d(10), paddingHorizontal: d(8), marginTop: d(-4) }}><Icon name={speaking ? "glyph-mic-off-grey" : "glyph-mic-off-violet"} size={d(16)} /><Txt style={{ fontSize: d(13), letterSpacing: d(.5), color: speaking ? c.muted : violet, fontFamily: "Nunito_900Black" }}>{speaking ? "HOZIR GAPIRA OLMAYMAN" : "GAPIRISH O'CHIQ · YOQISH"}</Txt></Pressable>} onAnswer={answer} onSpoken={(ms) => engine.addSpoken(ms)} onSpeechRetry={() => { session.retrySpeech(); ops.push("v"); if (!quiet) app.saveResume(snapshot()); }} onSpeakingOff={() => {
                engine.setSpeaking(false);
                setSpeaking(false);
                if (!quiet) app.saveResume(snapshot());
                setCurrent(nextItem());
            }}/>
          </ScreenTransition>) : null}
        {feedback ? (<Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} exiting={FadeOutDown.duration(180).reduceMotion(ReduceMotion.System)} style={{
                position: "absolute",
                left: d(0),
                right: d(0),
                bottom: d(0),
                padding: d(16),
                paddingBottom: d(28),
                gap: d(14),
                backgroundColor: feedback.right ? c.good : c.surface,
                borderTopWidth: feedback.right ? 0 : d(2),
                borderColor: c.line,
            }}>
            {feedback.right ? <View style={{ flexDirection: "row", alignItems: "center", gap: d(10) }}><View style={{ width: d(32), height: d(32), borderRadius: d(16), backgroundColor: green, alignItems: "center", justifyContent: "center" }}><Icon name="glyph-check-white" size={d(20)} /></View><Txt style={{ fontSize: d(22), color: "#27A852", fontFamily: "Nunito_900Black" }}>Zo&apos;r!</Txt></View> : <View><Txt style={{ fontSize: d(15), color: c.muted, fontFamily: "Nunito_900Black" }}>To&apos;g&apos;ri javob:</Txt><Txt style={{ fontSize: d(20), marginTop: d(4), fontFamily: "Nunito_900Black" }}>{feedback.answer}</Txt></View>}
            {!feedback.right && feedback.tip ? <View style={{ flexDirection: "row", alignItems: "center", gap: d(8), padding: d(12), borderRadius: d(12), backgroundColor: c.card }}><Icon name="bulb-tip" size={d(17)} /><Txt style={{ flex: 1, fontSize: d(14) }}>{feedback.tip}</Txt></View> : null}
            <Button label="DAVOM ETISH" kind={feedback.right ? "green" : "primary"} onPress={next} testID="lesson-next"/>
          </Animated.View>) : null}
        {leaveSheet}
        <Modal visible={combo > 0} animationType="fade" onRequestClose={() => { setCombo(0); advance(); }}><SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#5A3FD9" }}><Pressable accessibilityLabel="Davom etish" onPress={() => { setCombo(0); advance(); }} style={{ flex: 1 }}><View style={{ marginHorizontal: d(16), marginVertical: d(8), height: d(16), borderRadius: d(8), backgroundColor: "#FFFFFF33", overflow: "hidden" }}><Fill value={session.stats().progress} color={gold} /></View><View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: d(12) }}><Effect board="Embers" style={{ position: "absolute", width: d(200), height: d(260), top: "50%", marginTop: d(-250) }} /><Icon name="flame-streak" size={d(126)} /><Bounce change={combo}><Txt style={{ fontSize: d(26), fontFamily: "Nunito_900Black", color: "#FFFFFF" }}>{combo} ta ketma-ket!</Txt></Bounce><Txt style={{ fontSize: d(15), fontFamily: "Nunito_700Bold", color: c.muted }}>Siz to&apos;xtamayapsiz 💪</Txt></View></Pressable></SafeAreaView></Modal>
      </Page>
    </ScreenTransition>);
}
