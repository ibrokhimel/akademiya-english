import { File } from "expo-file-system";
import { router,useFocusEffect,useLocalSearchParams } from "expo-router";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useCallback,useEffect,useState } from "react";
import { BackHandler,Pressable,ScrollView,useWindowDimensions,View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dombi } from "../components/Dombi";
import { useMeasureDombiLevel } from "../lib/dombiLevel";
import { RaisedPressable } from "../components/RaisedPressable";
import { ScreenTransition } from "../components/ScreenTransition";
import { TimeWheel } from "../components/TimeWheel";
import {
Button,
Icon,
LinkButton,
Txt,
useTheme,
violet,
} from "../components/ui";
import { goals } from "../data/content";
import { playDombi,sound,stopAudio } from "../lib/audio";
import { cloudEnabled } from "../lib/config";
import { notificationPermission,reminders } from "../lib/notifications";
import { useApp } from "../lib/store";
import { useSpeech } from "../lib/useSpeech";
import { getVisualAudit } from "../lib/visualAudit";

export default function Onboarding() {
  useMeasureDombiLevel(true);
  const app = useApp(),
    c = useTheme(),
    speech = useSpeech(),
    { listen } = speech,
    { width } = useWindowDimensions(),
    scale = Math.min(width / 390, 1.2),
    d = (n: number) => n * scale;
  const { start } = useLocalSearchParams<{ start?: string }>();
  const direction = useSharedValue(1);
  const audit = getVisualAudit();
  const [step, updateStep] = useState(audit?.step ?? (start === "meet" ? 1 : 0)),
    [goal, setGoal] = useState(audit?.selected ? "ielts" : ""),
    [level, setLevel] = useState(audit?.selected ? "new" : ""),
    [confidence, setConfidence] = useState(audit?.selected ?? 0),
    [micOk, setMicOk] = useState(false),
    [time, setTime] = useState("19:00"),
    [error, setError] = useState("");
  const setStep = useCallback(
    (next: number) => {
      sound(next < step ? "back" : "next", app.settings.sound);
      direction.set(next < step ? -1 : 1);
      updateStep(next);
    },
    [direction, step, app.settings.sound],
  );
  const hello = useCallback(async () => {
    const result = await listen();
    if (result.uri) {
      try {
        new File(result.uri).delete();
      } catch {}
    }
    if (result.alts.some((s) => s.trim())) setStep(8);
    else if (result.error !== "aborted") setError("Yana bir bor ayting.");
  }, [listen, setStep]);
  useEffect(() => {
    if (step !== 7 || audit) return;
    const timer = setTimeout(() => {
      void hello();
    }, 450);
    return () => clearTimeout(timer);
  }, [step, hello, audit]);
  const finish = async (reminder: string | null) => {
    const enabled = reminder ? await notificationPermission() : false;
    const patch = {
      onboarded: true,
      needAccount: false,
      goal: goal || "self",
      confidence: confidence || 3,
      speaking: micOk,
      reminder: enabled ? reminder : null,
      joined: new Date().toISOString(),
    };
    app.set(patch);
    app.add({ type: "onboarding", confidence: confidence || 3 });
    void reminders({ ...app.settings, ...patch }, app.events).catch(() => {});
    router.replace("/lesson/l1");
  };
  const guides: Record<number, string> = {
    2: "Ingliz tili sizga nima uchun kerak?",
    3: "Ingliz tilini qanchalik bilasiz?",
    4: "30 kunda mana shularga erishasiz!",
    5: "Ingliz tilida gapirganda o'zingizga qanchalik ishonasiz?",
    9: "Ovozingiz faqat sizniki. Va'da beraman:",
    10: "Har kuni soat nechada eslatay? Kuniga bir martagina eslataman.",
  };
  const spokenLine = step === 1 ? "Salom! Men Dombiman." : guides[step] || "";
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        void playDombi(spokenLine, app.settings.sound).catch(() => {});
      }, 380);
      return () => {
        clearTimeout(timer);
        stopAudio();
      };
    }, [spokenLine, app.settings.sound]),
  );
  const bar =
      step >= 2 ? step - 2 : -1,
    centered = [0, 1, 6, 7, 8].includes(step);
  const back = useCallback(() => {
    speech.abort();
    setStep(step === 9 || step === 8 ? 6 : Math.max(0, step - 1));
  }, [speech, setStep, step]);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step === 0) return false;
      back();
      return true;
    });
    return () => listener.remove();
  }, [step, back]));
  const title = (text: string, size = 24) => (
    <Txt
      style={{
        fontSize: d(size),
        lineHeight: d(size * 1.3),
        textAlign: "center",
        fontFamily: "Nunito_900Black",
      }}
    >
      {text}
    </Txt>
  );
  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <ScreenTransition transitionKey={step} direction={direction}>
        {bar >= 0 ? (
          <View
            style={{
              height: d(42),
              paddingHorizontal: d(10),
              flexDirection: "row",
              alignItems: "center",
              gap: d(10),
            }}
          >
            <Pressable accessibilityLabel="Ortga" onPress={back}>
              <Icon name="glyph-chevron-left-grey" size={d(30)} />
            </Pressable>
            <View style={{ flexDirection: "row", gap: d(6) }}>
              {Array.from({ length: 9 }, (_, i) => (
                <View
                  key={i}
                  style={{
                    width: d(i === bar ? 40 : 24),
                    height: d(8),
                    borderRadius: 4,
                    backgroundColor: i <= bar ? violet : c.line,
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: d(20),
            paddingVertical: d(12),
            gap: d(step === 1 ? 10 : step === 7 ? 16 : centered ? 18 : 16),
            alignItems: centered ? "center" : "stretch",
            justifyContent: centered ? "center" : "flex-start",
          }}
        >
          {guides[step] ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: d(12),
              }}
            >
              <Dombi moment="idle" size={d(80)} />
              <View
                style={{
                  flex: 1,
                  paddingVertical: d(12),
                  paddingHorizontal: d(14),
                  borderRadius: d(18),
                  borderBottomLeftRadius: d(4),
                  borderWidth: d(2),
                  borderColor: c.line,
                  backgroundColor: c.card,
                }}
              >
                <Txt numberOfLines={step === 3 ? 1 : undefined} adjustsFontSizeToFit={step === 3} minimumFontScale={0.98}
                  style={{
                    fontSize: d(16),
                    lineHeight: d(22.4),
                    fontFamily: "Nunito_900Black",
                  }}
                >
                  {guides[step]}
                </Txt>
              </View>
            </View>
          ) : null}
          {step === 0 ? (
            <>
              <Dombi moment="onboarding" size={d(213)} />
              <Txt
                style={{
                  fontSize: d(30),
                  color: violet,
                  fontFamily: "Nunito_900Black",
                  textAlign: "center",
                }}
              >
                Akademiya English
              </Txt>
              <Txt
                style={{
                  maxWidth: d(300),
                  fontSize: d(17),
                  lineHeight: d(24),
                  fontFamily: "Nunito_800ExtraBold",
                  color: c.muted,
                  textAlign: "center",
                }}
              >
                Ingliz tilida gapirishni birinchi kundanoq boshlang.
              </Txt>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <View
                style={{
                  paddingVertical: d(12),
                  paddingHorizontal: d(18),
                  borderWidth: 2,
                  borderColor: c.line,
                  borderRadius: d(18),
                  backgroundColor: c.card,
                }}
              >
                {title("Salom! Men Dombiman.", 18)}
              </View>
              <Dombi moment="welcome" size={d(238)} />
            </>
          ) : null}
          {step === 2 ? (
            <View style={{ gap: d(10) }}>
              {goals.map(([key, icon, label]) => (
                <Choice
                  key={key}
                  selected={goal === key}
                  dimmed={!!goal && goal !== key}
                  icon={icon}
                  label={label}
                  onPress={() => setGoal(key)}
                  scale={scale}
                />
              ))}
            </View>
          ) : null}
          {step === 3 ? (
            <View style={{ gap: d(12) }}>
              {[
                [
                  "new",
                  "sprout",
                  "Men yangiman",
                  "Ingliz tilini noldan boshlayman",
                ],
                [
                  "some",
                  "plant",
                  "Biroz bilaman",
                  "Baribir 1-bo'limdan — tez o'tasiz",
                ],
              ].map(([key, icon, label, detail]) => (
                <Choice
                  key={key}
                  selected={level === key}
                  dimmed={!!level && level !== key}
                  icon={icon}
                  label={label}
                  detail={detail}
                  onPress={() => setLevel(key)}
                  scale={scale}
                />
              ))}
            </View>
          ) : null}
          {step === 4 ? (
            <View style={{ gap: d(16) }}>
              {[
                [
                  "coffee-kafeda",
                  "Kafeda buyurtma bera olasiz",
                  "Salomlashish, buyurtma, narx so'rash",
                ],
                [
                  "bubble-phrases",
                  "40+ iborani ayta olasiz",
                  "Ovoz chiqarib, o'z talaffuzingiz bilan",
                ],
                [
                  "flame-streak",
                  "Har kungi odat hosil qilasiz",
                  "Kuniga 10 daqiqa, mehribon eslatmalar",
                ],
              ].map(([icon, label, detail]) => (
                <View
                  key={icon}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: d(14),
                    paddingVertical: d(8),
                    paddingHorizontal: d(4),
                  }}
                >
                  <Icon name={icon} size={d(44)} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt
                      style={{ fontSize: d(17), fontFamily: "Nunito_900Black" }}
                    >
                      {label}
                    </Txt>
                    <Txt style={{ fontSize: d(13), color: c.muted }}>
                      {detail}
                    </Txt>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {step === 5 ? (
            <View style={{ gap: d(10) }}>
              {[
                ["face-pleading", "Umuman ishonmayman"],
                ["face-dizzy", "Biroz qo'rqaman"],
                ["face-smile", "O'rtacha"],
                ["face-grin", "Ancha ishonaman"],
                ["face-starstruck", "Juda ishonaman"],
              ].map(([icon, label], i) => (
                <Choice
                  key={icon}
                  selected={confidence === i + 1}
                  dimmed={!!confidence && confidence !== i + 1}
                  icon={icon}
                  label={label}
                  number={i + 1}
                  onPress={() => setConfidence(i + 1)}
                  scale={scale}
                />
              ))}
            </View>
          ) : null}
          {step === 6 ? (
            <>
              <View>
                <Dombi moment="onboardingIdle" size={d(190)} />
                <View
                  style={{
                    position: "absolute",
                    right: d(2),
                    bottom: d(14),
                    width: d(54),
                    height: d(54),
                    borderRadius: 30,
                    backgroundColor: app.settings.dark ? "#3A1F1B" : "#FFEDEA",
                    borderWidth: 4,
                    borderColor: c.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="studio-mic" size={d(30)} />
                </View>
              </View>
              {title("Mikrofonni yoqamiz")}
              <Txt
                style={{
                  fontSize: d(15),
                  lineHeight: d(21),
                  color: c.muted,
                  textAlign: "center",
                }}
              >
                Mashqlarda ovoz chiqarib gapirasiz. Javobingizni eshitishim
                uchun mikrofon kerak.
              </Txt>
            </>
          ) : null}
          {step === 7 ? (
            <>
              {title("Menga “Hello!” deng", 26)}
              <Dombi moment="onboardingIdle" size={d(190)} />
              <View
                style={{
                  flexDirection: "row",
                  gap: d(6),
                  height: d(40),
                  alignItems: "center",
                }}
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: d(8),
                      height: d(
                        8 +
                          (speech.listening
                            ? Math.abs(Math.sin(i + speech.volume * 4)) * 32
                            : 0),
                      ),
                      borderRadius: 4,
                      backgroundColor: violet,
                    }}
                  />
                ))}
              </View>
              <Txt style={{ fontSize: d(14), color: c.muted }}>
                {speech.transcript ||
                  "Tinglayapman…"}
              </Txt>
              {error ? <LinkButton compact
                label={speech.listening ? "TO'XTATISH" : "YANA URINISH"}
                onPress={() => {
                  if (speech.listening) void speech.stop();
                  else void hello();
                }}
              /> : null}
            </>
          ) : null}
          {step === 8 ? (
            <>
              <Dombi moment="lessonResult" size={d(170)} />
              {title("Zo'r! Sizni eshitdim", 26)}
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  paddingVertical: d(10),
                  paddingHorizontal: d(16),
                  backgroundColor: c.good,
                  borderRadius: 99,
                }}
              >
                <Icon name="glyph-check-green" size={d(22)} />
                <Txt
                  style={{
                    fontSize: d(18),
                    color: "#27A852",
                    fontFamily: "Nunito_900Black",
                  }}
                >
                  “Hello!”
                </Txt>
              </View>
              <Txt
                style={{ fontSize: d(15), color: c.muted, textAlign: "center" }}
              >
                Mikrofon ishlayapti — endi gapirib o&apos;rganamiz.
              </Txt>
            </>
          ) : null}
          {step === 9 ? (
            <View style={{ gap: d(16) }}>
              {[
                [
                  "lock",
                  "Faqat siz eshitasiz",
                  "Yozuvlar shu telefonda saqlanadi",
                ],
                [
                  "trash",
                  "Istalgan vaqtda o'chirasiz",
                  "Sozlamalar → Ovoz yozuvlari",
                ],
                [
                  "sparkles",
                  "Taraqqiyotingizni eshitasiz",
                  "1-kun va 30-kun ovozingizni solishtiring",
                ],
              ].map(([icon, label, detail]) => (
                <View
                  key={icon}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: d(12),
                    paddingVertical: d(8),
                    paddingHorizontal: d(4),
                  }}
                >
                  <View
                    style={{
                      width: d(44),
                      height: d(44),
                      borderRadius: d(14),
                      backgroundColor: c.soft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={`glyph-${icon}-violet`} size={d(26)} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt
                      style={{ fontSize: d(16), fontFamily: "Nunito_900Black" }}
                    >
                      {label}
                    </Txt>
                    <Txt style={{ fontSize: d(12), color: c.muted }}>
                      {detail}
                    </Txt>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {step === 10 ? (
            <View
              style={{ flex: 1, justifyContent: "center", minHeight: d(280) }}
            >
              <TimeWheel initialValue={time} onChange={setTime} />
            </View>
          ) : null}
        </ScrollView>
        <View
          style={{
            paddingHorizontal: d(16),
            paddingTop: d(12),
            paddingBottom: d(30),
            gap: d(10),
          }}
        >
          {step === 0 ? (
            <>
              <Button label="BOSHLASH" onPress={() => setStep(1)} />
              <LinkButton compact label="MAXFIYLIK" onPress={() => router.navigate("/privacy")} />
              {cloudEnabled ? <Button
                label="KIRISH"
                kind="secondary"
                onPress={() => router.navigate("/account?mode=login")}
              /> : null}
            </>
          ) : step === 6 ? (
            <>
              <Button
                label="MIKROFONNI YOQISH"
                onPress={() => {
                  void ExpoSpeechRecognitionModule.requestPermissionsAsync().then(
                    (p) => {
                      setMicOk(p.granted);
                      setStep(p.granted ? 7 : 9);
                    },
                  );
                }}
              />
              <LinkButton compact
                label="HOZIR EMAS"
                color={c.muted}
                onPress={() => {
                  setMicOk(false);
                  setStep(9);
                }}
              />
            </>
          ) : step === 7 ? (
            <>
              <Button label="DAVOM ETISH" disabled onPress={() => {}} />
              <LinkButton compact
                label="HOZIR GAPIRA OLMAYMAN"
                color={c.muted}
                onPress={() => {
                  speech.abort();
                  setMicOk(false);
                  setStep(9);
                }}
              />
            </>
          ) : step === 9 ? (
            <>
              <Button
                label="OVOZIMNI SAQLASH"
                onPress={() => {
                  app.set({ saveVoice: true });
                  setStep(10);
                }}
              />
              <Button
                label="SAQLAMASDAN DAVOM ETISH"
                kind="secondary"
                onPress={() => {
                  app.set({ saveVoice: false });
                  setStep(10);
                }}
              />
            </>
          ) : step === 10 ? (
            <>
              <Button
                label="ESLATMANI YOQISH"
                onPress={() => {
                  void finish(time);
                }}
              />
              <LinkButton compact
                label="HOZIR EMAS"
                color={c.muted}
                onPress={() => {
                  void finish(null);
                }}
              />
            </>
          ) : (
            <Button
              label="DAVOM ETISH"
              disabled={
                (step === 2 && !goal) ||
                (step === 3 && !level) ||
                (step === 5 && !confidence)
              }
              onPress={() => setStep(step + 1)}
            />
          )}
        </View>
      </ScreenTransition>
    </SafeAreaView>
  );
}
function Choice({
  label,
  icon,
  selected,
  dimmed,
  onPress,
  detail,
  number,
  scale,
}: {
  label: string;
  icon: string;
  selected: boolean;
  dimmed?: boolean;
  onPress: () => void;
  detail?: string;
  number?: number;
  scale: number;
}) {
  const c = useTheme(),
    d = (n: number) => n * scale;
  return (
    <RaisedPressable
      accessibilityRole="button"
      soundName="pick"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      backgroundColor={selected ? c.soft : c.card}
      edgeColor={selected ? "#7A5CFF" : c.line}
      radius={d(16)}
      depth={d(number ? 3 : 4)}
      style={{ opacity: dimmed ? 0.55 : 1 }}
      faceStyle={{
        flexDirection: "row",
        alignItems: "center",
        gap: d(number ? 12 : 14),
        paddingVertical: d(number ? 10 : 14),
        paddingHorizontal: d(number ? 14 : 16),
        borderWidth: d(2),
        borderColor: selected ? violet : c.line,
      }}
    >
      <Icon name={icon} size={d(detail ? 37 : number ? 34 : 28)} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt
          style={{
            fontSize: d(number ? 16 : 17),
            fontFamily: "Nunito_900Black",
            color: selected ? violet : c.text,
          }}
        >
          {label}
        </Txt>
        {detail ? (
          <Txt style={{ fontSize: d(13), color: c.muted }}>{detail}</Txt>
        ) : null}
      </View>
      {number ? (
        <Txt
          style={{
            fontSize: d(14),
            color: c.muted,
            fontFamily: "Nunito_900Black",
          }}
        >
          {number}
        </Txt>
      ) : !detail ? (
        <View
          style={{
            width: d(24),
            height: d(24),
            borderRadius: 12,
            backgroundColor: violet,
            alignItems: "center",
            justifyContent: "center",
            opacity: selected ? 1 : 0,
          }}
        >
          <Icon name="glyph-check-white" size={d(14)} />
        </View>
      ) : null}
    </RaisedPressable>
  );
}
