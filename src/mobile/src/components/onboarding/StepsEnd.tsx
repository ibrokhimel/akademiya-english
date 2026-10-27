import { View } from "react-native";
import { goals, lessons, units } from "../../data/content";
import { confidenceReplies, goalReplies, levelReplies, lines } from "../../data/onboardingLines";
import { reminderCopy } from "../../data/reminderCopy";
import { MINUTE_CHOICES, planFor } from "../../lib/onboardingPlan";
import { reminderPlan } from "../../lib/reminderPlan";
import { Dombi } from "../Dombi";
import { TimeWheel } from "../TimeWheel";
import { Button, Icon, LinkButton, Txt, useTheme, violet } from "../ui";
import { DombiSays } from "./DombiSays";
import { Choice, Heading, InfoRow, Label, Panel, Tile, type Scale } from "./parts";

const LEVELS = [["new", "sprout", "Men yangiman", "Ingliz tilini noldan boshlayman"], ["some", "plant", "Biroz bilaman", "Baribir 1-bo'limdan — tez o'tasiz"]];
const FACES = [["face-pleading", "Umuman ishonmayman"], ["face-dizzy", "Biroz qo'rqaman"], ["face-smile", "O'rtacha"], ["face-grin", "Ancha ishonaman"], ["face-starstruck", "Juda ishonaman"]];
const PACE: Record<number, string> = { 5: "Yengil", 10: "Odatiy", 15: "Jiddiy", 20: "Tezkor" };

/** Why English: Dombi answers the pick in one line. */
export function Goal({ d, goal, setGoal }: { d: Scale; goal: string; setGoal: (v: string) => void }) {
  return (
    <>
      <DombiSays text={goalReplies[goal] ?? lines.goal} d={d} />
      <View style={{ gap: d(10) }}>
        {goals.map(([key, icon, label]) => <Choice key={key} selected={goal === key} dimmed={!!goal && goal !== key} icon={icon} label={label} onPress={() => setGoal(key)} d={d} />)}
      </View>
    </>
  );
}

/** How much English: Dombi answers, and the first unit's lessons are shown. */
export function Level({ d, level, setLevel }: { d: Scale; level: string; setLevel: (v: string) => void }) {
  const unit = units[0];
  return (
    <>
      <DombiSays text={levelReplies[level] ?? lines.level} d={d} />
      <View style={{ gap: d(12) }}>
        {LEVELS.map(([key, icon, label, detail]) => <Choice key={key} selected={level === key} dimmed={!!level && level !== key} icon={icon} label={label} detail={detail} onPress={() => setLevel(key)} d={d} />)}
      </View>
      <Panel d={d}>
        <Label text={`1-BO'LIM · ${unit.name.toUpperCase()}`} d={d} color={violet} />
        {unit.lessons.map((lesson, i) => <LessonRow key={lesson.id} n={i + 1} title={lesson.title} d={d} />)}
      </Panel>
    </>
  );
}
function LessonRow({ n, title, d }: { n: number; title: string; d: Scale }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(10) }}>
      <View style={{ width: d(26), height: d(26), borderRadius: d(13), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}>
        <Txt style={{ fontSize: d(12), color: c.muted, fontFamily: "Nunito_900Black" }}>{n}</Txt>
      </View>
      <Txt style={{ flex: 1, fontSize: d(15), fontFamily: "Nunito_800ExtraBold" }}>{title}</Txt>
    </View>
  );
}

/** How sure the learner feels speaking: Dombi answers. The app asks again after two weeks (app/confidence.tsx). */
export function Confidence({ d, confidence, setConfidence }: { d: Scale; confidence: number; setConfidence: (v: number) => void }) {
  const c = useTheme();
  return (
    <>
      <DombiSays text={confidence ? confidenceReplies[confidence - 1] : lines.confidence} d={d} />
      <View style={{ gap: d(10) }}>
        {FACES.map(([icon, label], i) => <Choice key={icon} selected={confidence === i + 1} dimmed={!!confidence && confidence !== i + 1} icon={icon} label={label} number={i + 1} onPress={() => setConfidence(i + 1)} d={d} />)}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(10), padding: d(14), borderRadius: d(16), backgroundColor: c.surface }}>
        <Icon name="glyph-bell-violet" size={d(22)} />
        <Txt style={{ flex: 1, fontSize: d(14), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>Ikki haftadan keyin yana so&apos;rayman va farqni ko&apos;rsataman.</Txt>
      </View>
    </>
  );
}

/** The plan: minutes a day, the days each choice takes and the dates the units end. */
export function Plan({ d, name, minutes, setMinutes }: { d: Scale; name: string; minutes: number; setMinutes: (v: number) => void }) {
  const c = useTheme(), plan = planFor(minutes);
  const say = `${name ? `${name}, k` : "K"}uniga ${minutes} daqiqa ajratsangiz, 1-bo'limni ${plan.unitEnd}gacha tugatasiz. Barcha ${units.length} bo'lim esa ${plan.allEnd}gacha tugaydi.`;
  const most = planFor(MINUTE_CHOICES[0]).allDays;
  return (
    <>
      <DombiSays text={say} d={d} />
      <Panel d={d} tint={c.soft}>
        <Label text={`${units.length} BO'LIMDAN KEYIN`} d={d} color={violet} />
        <InfoRow icon="coffee-kafeda" title="Kafeda buyurtma bera olasiz" d={d} />
        <InfoRow icon="bubble-phrases" title="40+ iborani ovoz chiqarib ayta olasiz" d={d} />
        <InfoRow icon="flame-streak" title="Har kungi odat hosil qilasiz" d={d} />
      </Panel>
      <Label text="KUNIGA NECHA DAQIQA?" d={d} />
      <View style={{ flexDirection: "row", gap: d(8) }}>
        {MINUTE_CHOICES.map((m) => (
          <View key={m} style={{ flex: 1 }}>
            <Button label={String(m)} kind={m === minutes ? "primary" : "secondary"} onPress={() => setMinutes(m)} />
          </View>
        ))}
      </View>
      <Txt style={{ fontSize: d(13), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>{PACE[minutes]}</Txt>
      <View style={{ flexDirection: "row", gap: d(8), alignItems: "flex-end", height: d(120) }}>
        {MINUTE_CHOICES.map((m) => {
          const days = planFor(m).allDays, on = m === minutes;
          return (
            <View key={m} style={{ flex: 1, alignItems: "center", gap: d(6) }}>
              <Txt style={{ fontSize: d(13), fontFamily: "Nunito_900Black", color: on ? violet : c.muted }}>{days} kun</Txt>
              <View style={{ alignSelf: "stretch", height: d(90) * (days / most), borderTopLeftRadius: d(10), borderTopRightRadius: d(10), borderBottomLeftRadius: d(4), borderBottomRightRadius: d(4), backgroundColor: on ? violet : c.line }} />
            </View>
          );
        })}
      </View>
    </>
  );
}

/** The reminder time, with the reminder the phone will actually show. */
export function Reminder({ d, time, setTime }: { d: Scale; time: string; setTime: (v: string) => void }) {
  const c = useTheme(), now = new Date();
  const next = reminderPlan({ time, now, days: 2, completed: [], copies: reminderCopy })[0];
  const when = next && next.at.getDate() === now.getDate() ? "bugun" : "ertaga";
  return (
    <>
      <DombiSays text={lines.reminder} d={d} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(14), borderRadius: d(20), backgroundColor: c.surface }}>
        <View style={{ width: d(44), height: d(44), borderRadius: d(12), backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
          <Dombi moment="glad" size={d(40)} />
        </View>
        <View style={{ flex: 1, gap: d(2) }}>
          <Txt style={{ fontSize: d(12), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>Dombi · Akademiya English · {when} {time}</Txt>
          <Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>{next?.body ?? reminderCopy[0]}</Txt>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: "center", minHeight: d(260) }}>
        <TimeWheel initialValue={time} onChange={setTime} />
      </View>
    </>
  );
}

/** Dombi explains before the phone's own permission question. */
export function PermissionSheet({ d, onAllow, onSkip }: { d: Scale; onAllow: () => void; onSkip: () => void }) {
  const c = useTheme();
  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "#14161B66", justifyContent: "flex-end" }}>
      <View style={{ paddingTop: d(14), paddingHorizontal: d(20), paddingBottom: d(30), gap: d(14), borderTopLeftRadius: d(28), borderTopRightRadius: d(28), backgroundColor: c.card }}>
        <View style={{ alignSelf: "center", width: d(40), height: d(5), borderRadius: 3, backgroundColor: c.line }} />
        <DombiSays text={lines.permission} moment="explaining" d={d} />
        <Button label="TUSHUNARLI" onPress={onAllow} />
        <LinkButton compact label="KERAK EMAS" color={c.muted} onPress={onSkip} />
      </View>
    </View>
  );
}

/** What the learner leaves onboarding with, and the first lesson. */
export function Done({ d, name, minutes, reminder }: { d: Scale; name: string; minutes: number; reminder: string | null }) {
  const c = useTheme(), plan = planFor(minutes), first = lessons[0];
  return (
    <>
      <Dombi moment="lessonResult" size={d(150)} />
      <Heading text={`Hammasi tayyor${name ? `, ${name}` : ""}!`} d={d} size={26} />
      <View style={{ alignSelf: "stretch", gap: d(10) }}>
        <View style={{ flexDirection: "row", gap: d(10) }}>
          <Tile icon="bubble-phrases" value="“Hello!”" detail="Birinchi so'zingiz" d={d} tint={c.soft} />
          <Tile icon="flame-streak" value="1-kun" detail="1-darsdan keyin boshlanadi" d={d} tint={c.goldSoft} />
        </View>
        <View style={{ flexDirection: "row", gap: d(10) }}>
          <Tile icon="calendar" value={`Kuniga ${minutes} daqiqa`} detail={reminder ? `Har kuni ${reminder} da eslataman` : "Eslatmasiz"} d={d} />
          <Tile icon="trophy-unit" value={plan.unitEnd} detail="1-bo'lim tugaydi" d={d} />
        </View>
      </View>
      <View style={{ alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: d(12), padding: d(14), borderRadius: d(18), borderWidth: d(2), borderColor: c.line }}>
        <View style={{ width: d(44), height: d(44), borderRadius: d(22), backgroundColor: violet, alignItems: "center", justifyContent: "center" }}>
          <Txt style={{ fontSize: d(18), color: "#FFFFFF", fontFamily: "Nunito_900Black" }}>1</Txt>
        </View>
        <View style={{ flex: 1, gap: d(2) }}>
          <Label text="NAVBATDAGI DARS" d={d} color={violet} />
          <Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>{first.title}</Txt>
        </View>
      </View>
    </>
  );
}
