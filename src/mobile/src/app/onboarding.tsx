import { File } from "expo-file-system";
import { router,useFocusEffect,useLocalSearchParams } from "expo-router";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useCallback,useEffect,useState } from "react";
import { BackHandler,Pressable,ScrollView,useWindowDimensions,View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Confidence,Done,Goal,Level,PermissionSheet,Plan,Reminder } from "../components/onboarding/StepsEnd";
import { Heard,Meet,Mic,Name,Task,VoicePromise,Welcome } from "../components/onboarding/StepsStart";
import { ScreenTransition } from "../components/ScreenTransition";
import { Button,Icon,LinkButton,useTheme,violet } from "../components/ui";
import { useMeasureDombiLevel } from "../lib/dombiLevel";
import { cloudEnabled } from "../lib/config";
import { notificationPermission,reminders } from "../lib/notifications";
import { useApp } from "../lib/store";
import { sound,stopAudio } from "../lib/audio";
import { useSpeech } from "../lib/useSpeech";
import { getVisualAudit } from "../lib/visualAudit";

// The steps in order. Name, the first task and the plan follow Akademiya Math's onboarding (2026-10-27).
const STEP = { welcome: 0, meet: 1, name: 2, mic: 3, task: 4, heard: 5, promise: 6, goal: 7, level: 8, confidence: 9, plan: 10, reminder: 11, done: 12 };
// How far the bar is on each step; the first two steps have no bar.
const BAR = [0, 0, 1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10];
const SEGMENTS = 10;
const CENTERED = new Set([STEP.welcome, STEP.meet, STEP.mic, STEP.heard, STEP.done]);

export default function Onboarding() {
  useMeasureDombiLevel(true);
  const app = useApp(), c = useTheme(), speech = useSpeech(), { listen } = speech, { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2), d = (n: number) => n * scale;
  const { start } = useLocalSearchParams<{ start?: string }>();
  const direction = useSharedValue(1);
  const audit = getVisualAudit();
  const [step, updateStep] = useState(audit?.step ?? (start === "meet" ? STEP.meet : STEP.welcome)),
    [name, setName] = useState(app.settings.name),
    [goal, setGoal] = useState(audit?.selected ? "ielts" : ""),
    [level, setLevel] = useState(audit?.selected ? "new" : ""),
    [confidence, setConfidence] = useState(audit?.selected ?? 0),
    [minutes, setMinutes] = useState(app.settings.minutes ?? 10),
    [micOk, setMicOk] = useState(false),
    [time, setTime] = useState("19:00"),
    [reminder, setReminder] = useState<string | null>(null),
    [sheet, setSheet] = useState(false),
    [error, setError] = useState("");
  const setStep = useCallback((next: number) => {
    sound(next < step ? "back" : "next", app.settings.sound);
    direction.set(next < step ? -1 : 1);
    updateStep(next);
  }, [direction, step, app.settings.sound]);
  const hello = useCallback(async () => {
    setError("");
    const result = await listen();
    if (result.uri) { try { new File(result.uri).delete(); } catch {} }
    if (result.alts.some((s) => s.trim())) setStep(STEP.heard);
    else if (result.error !== "aborted") setError("Yana bir bor ayting.");
  }, [listen, setStep]);
  // The first task listens by itself once its screen and Dombi's line have settled.
  useEffect(() => {
    if (step !== STEP.task || audit) return;
    const timer = setTimeout(() => { void hello(); }, 450);
    return () => clearTimeout(timer);
  }, [step, hello, audit]);
  const finish = () => {
    const patch = {
      onboarded: true, needAccount: false, name: name.trim(), goal: goal || "self", confidence: confidence || 3,
      speaking: micOk, reminder, minutes, joined: new Date().toISOString(),
    };
    app.set(patch);
    app.add({ type: "onboarding", confidence: confidence || 3 });
    void reminders({ ...app.settings, ...patch }, app.events).catch(() => {});
    router.replace("/lesson/l1");
  };
  const allowReminder = async () => {
    setSheet(false);
    setReminder((await notificationPermission()) ? time : null);
    setStep(STEP.done);
  };
  const skipSpeaking = () => { speech.abort(); setMicOk(false); setStep(STEP.promise); };
  const back = useCallback(() => {
    speech.abort();
    stopAudio();
    if (sheet) return setSheet(false);
    setStep(step === STEP.heard || step === STEP.promise ? STEP.mic : Math.max(0, step - 1));
  }, [speech, setStep, step, sheet]);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step === STEP.welcome) return false;
      back();
      return true;
    });
    return () => listener.remove();
  }, [step, back]));
  const bar = BAR[step], centered = CENTERED.has(step);
  const body = [
    <Welcome key="welcome" d={d} />,
    <Meet key="meet" d={d} />,
    <Name key="name" d={d} name={name} setName={setName} onDone={() => setStep(STEP.mic)} />,
    <Mic key="mic" d={d} />,
    <Task key="task" d={d} speech={speech} error={error} retry={() => { if (speech.listening) void speech.stop(); else void hello(); }} />,
    <Heard key="heard" d={d} name={name.trim()} />,
    <VoicePromise key="promise" d={d} />,
    <Goal key="goal" d={d} goal={goal} setGoal={setGoal} />,
    <Level key="level" d={d} level={level} setLevel={setLevel} />,
    <Confidence key="confidence" d={d} confidence={confidence} setConfidence={setConfidence} />,
    <Plan key="plan" d={d} name={name.trim()} minutes={minutes} setMinutes={setMinutes} />,
    <Reminder key="reminder" d={d} time={time} setTime={setTime} />,
    <Done key="done" d={d} name={name.trim()} minutes={minutes} reminder={reminder} />,
  ][step];
  const next = (to: number, disabled = false) => <Button label="DAVOM ETISH" disabled={disabled} onPress={() => setStep(to)} />;
  const buttons = step === STEP.welcome ? (
    <>
      <Button label="BOSHLASH" onPress={() => setStep(STEP.meet)} />
      {cloudEnabled ? <Button label="KIRISH" kind="secondary" onPress={() => router.navigate("/account?mode=login")} /> : null}
      <LinkButton compact label="MAXFIYLIK" color={c.muted} onPress={() => router.navigate("/privacy")} />
    </>
  ) : step === STEP.name ? (
    <>
      {next(STEP.mic, !name.trim())}
      <LinkButton compact label="KEYINROQ" color={c.muted} onPress={() => { setName(""); setStep(STEP.mic); }} />
    </>
  ) : step === STEP.mic ? (
    <>
      <Button label="MIKROFONNI YOQISH" onPress={() => {
        void ExpoSpeechRecognitionModule.requestPermissionsAsync().then((p) => { setMicOk(p.granted); setStep(p.granted ? STEP.task : STEP.promise); });
      }} />
      <LinkButton compact label="HOZIR EMAS" color={c.muted} onPress={skipSpeaking} />
    </>
  ) : step === STEP.task ? (
    <>
      <Button label="DAVOM ETISH" disabled onPress={() => {}} />
      <LinkButton compact label="HOZIR GAPIRA OLMAYMAN" color={c.muted} onPress={skipSpeaking} />
    </>
  ) : step === STEP.promise ? (
    <>
      <Button label="OVOZIMNI SAQLASH" onPress={() => { app.set({ saveVoice: true }); setStep(STEP.goal); }} />
      <Button label="SAQLAMASDAN DAVOM ETISH" kind="secondary" onPress={() => { app.set({ saveVoice: false }); setStep(STEP.goal); }} />
    </>
  ) : step === STEP.reminder ? (
    <>
      <Button label="ESLATMANI YOQISH" onPress={() => setSheet(true)} />
      <LinkButton compact label="HOZIR EMAS" color={c.muted} onPress={() => { setReminder(null); setStep(STEP.done); }} />
    </>
  ) : step === STEP.done ? (
    <Button label="1-DARSNI BOSHLASH" onPress={finish} />
  ) : next(step + 1, (step === STEP.goal && !goal) || (step === STEP.level && !level) || (step === STEP.confidence && !confidence));
  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenTransition transitionKey={step} direction={direction}>
        {bar > 0 ? (
          <View style={{ height: d(42), paddingLeft: d(10), paddingRight: d(16), flexDirection: "row", alignItems: "center", gap: d(10) }}>
            <Pressable accessibilityLabel="Ortga" onPress={back}>
              <Icon name="glyph-chevron-left-grey" size={d(30)} />
            </Pressable>
            <View style={{ flex: 1, flexDirection: "row", gap: d(5) }}>
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <View key={i} style={{ flex: 1, height: d(8), borderRadius: 4, backgroundColor: i < bar ? violet : c.line }} />
              ))}
            </View>
          </View>
        ) : null}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: d(20), paddingVertical: d(12), gap: d(centered ? 14 : 16), alignItems: centered ? "center" : "stretch", justifyContent: centered ? "center" : "flex-start" }}
        >
          {body}
        </ScrollView>
        <View style={{ paddingHorizontal: d(16), paddingTop: d(12), paddingBottom: d(30), gap: d(10) }}>{buttons}</View>
      </ScreenTransition>
      {sheet ? <PermissionSheet d={d} onAllow={() => { void allowReminder(); }} onSkip={() => { setSheet(false); setReminder(null); setStep(STEP.done); }} /> : null}
    </SafeAreaView>
  );
}
