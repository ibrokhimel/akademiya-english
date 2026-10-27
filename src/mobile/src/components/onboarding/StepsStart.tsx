import { useEffect } from "react";
import { TextInput, View } from "react-native";
import { P } from "../../data/content";
import { lines } from "../../data/onboardingLines";
import { playDombi, stopAudio } from "../../lib/audio";
import { dayMonth } from "../../lib/onboardingPlan";
import { useApp } from "../../lib/store";
import type { useSpeech } from "../../lib/useSpeech";
import { Dombi } from "../Dombi";
import { Icon, LinkButton, Picture, Txt, useTheme, violet } from "../ui";
import { DombiSays } from "./DombiSays";
import { Heading, InfoRow, Label, Panel, Tile, type Scale } from "./parts";

/** The first screen: Dombi, the app, and three lines from the first lessons. */
export function Welcome({ d }: { d: Scale }) {
  const c = useTheme();
  return (
    <>
      <Dombi moment="onboardingIdle" size={d(150)} />
      <Txt style={{ fontSize: d(30), color: violet, fontFamily: "Nunito_900Black", textAlign: "center" }}>Akademiya English</Txt>
      <Txt style={{ maxWidth: d(300), fontSize: d(17), lineHeight: d(24), fontFamily: "Nunito_800ExtraBold", color: c.muted, textAlign: "center" }}>
        Ingliz tilida gapirishni birinchi kundanoq boshlang.
      </Txt>
      <View style={{ height: d(4) }} />
      <Panel d={d}>
        <Label text="BIRINCHI DARSLARDA AYTASIZ" d={d} />
        {["hello", "nice-to-meet-you", "a-tea"].map((id) => (
          <InfoRow key={id} icon={`lesson-${P[id].pic}`} title={P[id].en} detail={P[id].uz} d={d} />
        ))}
      </Panel>
    </>
  );
}

/** Dombi says hello. */
export function Meet({ d }: { d: Scale }) {
  const c = useTheme(), { settings } = useApp();
  useEffect(() => {
    const timer = setTimeout(() => { void playDombi(lines.hello, settings.sound).catch(() => {}); }, 380);
    return () => { clearTimeout(timer); stopAudio(); };
  }, [settings.sound]);
  return (
    <>
      <View style={{ paddingVertical: d(12), paddingHorizontal: d(18), borderWidth: 2, borderColor: c.line, borderRadius: d(18), backgroundColor: c.card }}>
        <Heading text={lines.hello} d={d} size={18} />
      </View>
      <Dombi moment="welcome" size={d(200)} />
      <Txt style={{ maxWidth: d(300), fontSize: d(16), lineHeight: d(22), color: c.muted, textAlign: "center" }}>
        Har darsda yoningizdaman: gapingizni eshitaman, qiynalsangiz yordam beraman.
      </Txt>
    </>
  );
}

/** The name: what Dombi calls the learner. Optional. */
export function Name({ d, name, setName, onDone }: { d: Scale; name: string; setName: (v: string) => void; onDone: () => void }) {
  const c = useTheme();
  return (
    <>
      <DombiSays text={lines.name} d={d} />
      <TextInput
        accessibilityLabel="Ismingiz"
        value={name}
        onChangeText={setName}
        onSubmitEditing={onDone}
        autoFocus
        autoCapitalize="words"
        maxLength={20}
        returnKeyType="done"
        placeholder="Ismingiz"
        placeholderTextColor={c.faint}
        style={{ height: d(60), paddingHorizontal: d(18), borderRadius: d(16), borderWidth: d(2), borderColor: violet, backgroundColor: c.card, color: c.text, fontSize: d(24), fontFamily: "Nunito_900Black" }}
      />
      <Label text="SHUNDAY MUROJAAT QILAMAN" d={d} />
      <Panel d={d}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: d(10) }}>
          <Dombi moment="glad" size={d(48)} />
          <View style={{ flex: 1, paddingVertical: d(10), paddingHorizontal: d(12), borderRadius: d(16), borderBottomLeftRadius: d(4), backgroundColor: c.card }}>
            <Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>Zo&apos;r, {name.trim() || "Aziz"}! To&apos;g&apos;ri aytdingiz.</Txt>
          </View>
        </View>
      </Panel>
    </>
  );
}

/** Why the microphone is needed, before the phone asks. */
export function Mic({ d }: { d: Scale }) {
  const c = useTheme(), { settings } = useApp();
  return (
    <>
      <View>
        <Dombi moment="onboardingIdle" size={d(170)} />
        <View style={{ position: "absolute", right: d(2), bottom: d(14), width: d(54), height: d(54), borderRadius: 30, backgroundColor: settings.dark ? "#3A1F1B" : "#FFEDEA", borderWidth: 4, borderColor: c.bg, alignItems: "center", justifyContent: "center" }}>
          <Icon name="studio-mic" size={d(30)} />
        </View>
      </View>
      <Heading text="Mikrofonni yoqamiz" d={d} size={26} />
      <Txt style={{ maxWidth: d(320), fontSize: d(15), lineHeight: d(21), color: c.muted, textAlign: "center" }}>
        Mashqlarda ovoz chiqarib gapirasiz. Javobingizni eshitishim uchun mikrofon kerak.
      </Txt>
      <Panel d={d}>
        <InfoRow icon="speak-bubble" title="Birinchi so'zni hozir aytasiz" detail="Keyingi ekranda, bir necha soniyada" d={d} />
        <InfoRow icon="trash" title="Yozuvni o'zingiz boshqarasiz" detail="Saqlash yoki saqlamaslikni keyin tanlaysiz" d={d} />
      </Panel>
    </>
  );
}

/** The first real task: Lesson 1's hello picture, said out loud. */
export function Task({ d, speech, error, retry }: { d: Scale; speech: ReturnType<typeof useSpeech>; error: string; retry: () => void }) {
  const c = useTheme();
  return (
    <>
      <DombiSays text={lines.task} d={d} />
      <View style={{ gap: d(4) }}>
        <Label text="AYTING" d={d} color={violet} />
        <Txt style={{ fontSize: d(21), lineHeight: d(27), fontFamily: "Nunito_900Black" }}>Do&apos;stingizni uchratdingiz. Unga salom bering.</Txt>
      </View>
      <View style={{ height: d(170), alignItems: "center", justifyContent: "center", borderRadius: d(20), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card }}>
        <Picture name={P.hello.pic} size={d(110)} />
      </View>
      <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: d(6), paddingVertical: d(6), paddingHorizontal: d(10), borderRadius: d(12), borderWidth: d(2), borderColor: c.line }}>
        <Icon name="bulb-tip" size={d(18)} />
        <Txt style={{ fontSize: d(14), fontFamily: "Nunito_900Black" }}>{P.hello.en}</Txt>
      </View>
      <View style={{ alignItems: "center", gap: d(8), paddingTop: d(6) }}>
        <View style={{ flexDirection: "row", gap: d(6), height: d(40), alignItems: "center" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={{ width: d(8), height: d(8 + (speech.listening ? Math.abs(Math.sin(i + speech.volume * 4)) * 32 : 0)), borderRadius: 4, backgroundColor: violet }} />
          ))}
        </View>
        <Txt style={{ fontSize: d(14), color: c.muted }}>{speech.transcript || error || "Tinglayapman…"}</Txt>
        {error ? <LinkButton compact label={speech.listening ? "TO'XTATISH" : "YANA URINISH"} onPress={retry} /> : null}
      </View>
    </>
  );
}

/** Dombi heard the first word. The streak and the phrase count start with the first lesson, so they say so. */
export function Heard({ d, name }: { d: Scale; name: string }) {
  const c = useTheme();
  const today = new Date().getDay();
  return (
    <>
      <Dombi moment="lessonResult" size={d(150)} />
      <Heading text={`Zo'r${name ? `, ${name}` : ""}! Sizni eshitdim`} d={d} size={25} />
      <View style={{ flexDirection: "row", gap: 8, paddingVertical: d(10), paddingHorizontal: d(16), backgroundColor: c.good, borderRadius: 99 }}>
        <Icon name="glyph-check-green" size={d(22)} />
        <Txt style={{ fontSize: d(18), color: c.goodText, fontFamily: "Nunito_900Black" }}>“{P.hello.en}”</Txt>
      </View>
      <View style={{ alignSelf: "stretch", flexDirection: "row", gap: d(10) }}>
        <Tile icon="bubble-phrases" value={`“${P.hello.en}”`} detail="Birinchi so'zingiz" d={d} tint={c.soft} />
        <Tile icon="flame-streak" value="1-kun" detail="1-darsni tugatsangiz boshlanadi" d={d} tint={c.goldSoft} />
      </View>
      <Panel d={d}>
        <View style={{ alignItems: "center", gap: d(10) }}>
          <Label text="BU HAFTA" d={d} />
          <View style={{ flexDirection: "row", gap: d(8) }}>
            {["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"].map((day, i) => (
              <View key={day} style={{ alignItems: "center", gap: d(4) }}>
                <Txt style={{ fontSize: d(12), fontFamily: "Nunito_900Black", color: i === today ? c.goldText : c.muted }}>{day}</Txt>
                <View style={{ width: d(32), height: d(32), borderRadius: d(16), backgroundColor: c.line, borderWidth: i === today ? d(3) : 0, borderColor: c.goldText }} />
              </View>
            ))}
          </View>
        </View>
      </Panel>
    </>
  );
}

/** Asking to keep the learner's voice, with what they get from it. */
export function VoicePromise({ d }: { d: Scale }) {
  const c = useTheme();
  const later = new Date(); later.setDate(later.getDate() + 30);
  return (
    <>
      <DombiSays text={lines.promise} d={d} />
      <Panel d={d}>
        <InfoRow boxed icon="glyph-lock-violet" title="Faqat siz eshitasiz" detail="Yozuvlar shu telefonda saqlanadi" d={d} />
        <InfoRow boxed icon="glyph-trash-violet" title="Istalgan vaqtda o'chirasiz" detail="Sozlamalar → Ovoz yozuvlari" d={d} />
        <InfoRow boxed icon="glyph-sparkles-violet" title="Taraqqiyotingizni eshitasiz" detail="1-kun va 30-kun ovozingizni solishtiring" d={d} />
      </Panel>
      <Label text="30 KUNDAN KEYIN SHUNDAY KO'RASIZ" d={d} />
      <View style={{ padding: d(14), gap: d(10), borderRadius: d(18), borderWidth: d(2), borderColor: c.line }}>
        <Txt style={{ fontSize: d(16), fontFamily: "Nunito_900Black" }}>Ovozingiz: 1-kun va 30-kun</Txt>
        {[["1-kun", new Date()], ["30-kun", later]].map(([label, date]) => (
          <View key={label as string} style={{ flexDirection: "row", alignItems: "center", gap: d(10), padding: d(10), borderRadius: d(14), backgroundColor: c.surface }}>
            <View style={{ width: d(34), height: d(34), borderRadius: d(17), backgroundColor: violet, alignItems: "center", justifyContent: "center" }}>
              <Icon name="glyph-play-white" size={d(16)} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>{label as string}</Txt>
              <Txt style={{ fontSize: d(12), color: c.muted }}>{dayMonth(date as Date)}</Txt>
            </View>
            <Icon name="glyph-lock-grey" size={d(18)} />
          </View>
        ))}
      </View>
    </>
  );
}
