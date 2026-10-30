import { Redirect,useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect,useState } from "react";
import { ScrollView,View } from "react-native";
import cases from "../audit/cases.json";
import { auditFixture } from "../audit/fixture";
import { CaptureContext,createLayoutCapture } from "../audit/layout";
import { AppTabBar } from "../components/AppTabBar";
import { LessonMoment } from "../components/LessonMoment";
import { ProblemContent } from "../components/ProblemContent";
import { SettingToggle } from "../components/SettingsControls";
import { Button,Icon,LinkButton,Page,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { lessons } from "../data/content";
import { stopAudio } from "../lib/audio";
import type { ProblemKind } from "../lib/problem";
import { AppProvider } from "../lib/store";
import { beginVisualAudit,endVisualAudit,visualAuditEnabled,type VisualAuditConfig } from "../lib/visualAudit";
import { Player } from "../screens/LessonScreen";
import PracticeScreen from "../screens/PracticeScreen";
import Learn from "./(tabs)/index";
import Profile from "./(tabs)/profile";
import Progress from "../screens/ProgressScreen";
import Account from "./account";
import Calendar from "./calendar";
import Confidence from "./confidence";
import Feedback from "./feedback";
import Onboarding from "./onboarding";
import Phrases from "./phrases";
import Recordings from "./recordings";
import Settings from "./settings";

type CaptureCase = { id: string; native: VisualAuditConfig & { kind: string; speaking?: boolean; checkpoint?: boolean; perfect?: boolean; control?: string } };
export default function VisualAuditRoute() {
  const { id = "ob-welcome", dark = "0", speech, verdict } = useLocalSearchParams<{ id?: string; dark?: string; speech?: string; verdict?: string }>();
  if (!visualAuditEnabled) return <Redirect href="/(tabs)" />;
  const entry = cases.find(entry => entry.id === id) as CaptureCase | undefined;
  if (!entry) return <Page><Txt>Unknown capture case: {id}</Txt></Page>;
  const preview = speech === "right" || speech === "wrong" ? { ...entry, id: `speech-result-${speech}`, native: { ...entry.native, speaking: true, feedback: speech as "right" | "wrong" } } : verdict === "right" || verdict === "wrong" ? { ...entry, id: `${entry.id}-checked-${verdict}`, native: { ...entry.native, feedback: verdict as "right" | "wrong" } } : entry;
  return <Capture key={`${id}-${dark}-${speech || verdict || ""}`} entry={preview} dark={dark === "1"} />;
}
function Capture({ entry, dark }: { entry: CaptureCase; dark: boolean }) {
  const [layout] = useState(() => createLayoutCapture(entry.id, dark));
  const [session] = useState(() => {
    const control = entry.native.control;
    const config = { ...entry.native, id: entry.id, dark, populated: !!entry.native.populated,
      step: control === "options" ? 2 : entry.native.step,
      panel: control === "time-wheel" ? "reminder" as const : entry.native.panel,
      email: control === "text-input" || entry.native.email,
      result: control === "toast" || entry.native.result,
      saveVoice: entry.id === "recordings-off" ? false : undefined,
      speechError: entry.id === "problem-mic-blocked" ? "not-allowed" : entry.id === "problem-speech-unavailable" ? "service-not-allowed" : undefined,
      feedback: entry.id === "exercise-tiles-right" ? "right" as const : entry.id === "exercise-tiles-wrong" ? "wrong" as const : entry.native.feedback,
      speaking: entry.id === "exercise-tiles-right" || entry.id === "exercise-tiles-wrong" || entry.id === "control-progress" ? false : entry.native.speaking,
    };
    return beginVisualAudit(config, auditFixture(config));
  });
  useEffect(() => () => { stopAudio(); endVisualAudit(session); }, [session]);
  return <AppProvider><CaptureContext.Provider value={layout}><CaptureSurface><StatusBar style={dark ? "light" : "dark"} /><CaptureContent entry={entry} /></CaptureSurface></CaptureContext.Provider></AppProvider>;
}
function CaptureSurface({ children }: { children: ReactNode }) { const c = useTheme(); return <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>; }
function CaptureContent({ entry }: { entry: CaptureCase }) {
  const config = entry.native;
  const d = useDesignScale();
  const noop = () => {};
  switch (config.kind) {
    case "onboarding": return <Onboarding />;
    case "account": return entry.id === "login-no-account" ? <ProblemContent kind="not-ready" onChoice={noop} onHome={noop} onReport={noop} /> : <Account />;
    case "learn": return <View style={{ flex: 1 }}><Learn /><AppTabBar selected={0} onPress={noop} /></View>;
    case "progress": return <View style={{ flex: 1 }}><Progress /><AppTabBar selected={1} onPress={noop} /></View>;
    case "profile": return <View style={{ flex: 1 }}><Profile /><AppTabBar selected={2} onPress={noop} /></View>;
    case "settings": return <Settings />;
    case "recordings": return <Recordings />;
    case "phrases": return <Phrases />;
    case "calendar": return <Calendar />;
    case "feedback": return <Feedback />;
    case "confidence": return <Confidence />;
    case "moment": return <LessonMoment phase={config.phase || "result"} lesson={config.checkpoint ? lessons.find(lesson => lesson.checkpoint)! : lessons[0]} stats={{ accuracy: config.perfect ? 100 : 83, perfect: !!config.perfect, left: 3 }} spokenMs={83000} streak={7} onContinue={noop} />;
    case "exercise": {
      if (config.checkpoint) return <Player lesson={lessons.find(lesson => lesson.checkpoint)!} onExit={noop} />;
      const parent = lessons.find(lesson => !lesson.checkpoint && lesson.items.some(item => item.ex === config.exercise)) || lessons[0];
      const item = parent.items.find(item => item.ex === config.exercise) || parent.items[0];
      return <Player lesson={{ ...parent, id: "visual-audit", items: [item, ...parent.items.filter(other => other !== item)] }} onExit={noop} />;
    }
    case "practice": return <PracticeScreen id="hello" />;
    case "problem": return <ProblemContent kind={entry.id.replace("problem-", "") as ProblemKind} onChoice={noop} onHome={noop} onReport={noop} />;
    case "controls": {
      if (config.control === "options") return <Onboarding />;
      if (config.control === "segments" || config.control === "dialog" || config.control === "time-wheel") return <Settings />;
      if (config.control === "text-input") return <Account />;
      if (config.control === "toast") return <Feedback />;
      if (config.control === "streak-week") return <Progress />;
      if (config.control === "progress") return <Player lesson={lessons[0]} onExit={noop} />;
      if (config.control === "toggles") return <Page><SettingToggle label="On" value onChange={noop} /><SettingToggle label="Off" value={false} onChange={noop} /></Page>;
      if (config.control === "icons") return <Page><View style={{ flexDirection: "row", flexWrap: "wrap", gap: d(20) }}>{["tab-home", "tab-progress", "tab-profile", "flame-streak", "trophy-unit", "bubble-phrases", "repeat", "glyph-speaker-violet", "glyph-mic-grey", "face-pleading", "face-dizzy", "face-smile", "face-grin", "face-starstruck"].map(name => <Icon key={name} name={name} size={d(40)} />)}</View></Page>;
      return <Page><ScrollView contentContainerStyle={{ gap: d(16) }}>{(["primary", "secondary", "green", "gold", "danger"] as const).map(kind => <Button key={kind} label="DAVOM ETISH" kind={kind} onPress={noop} />)}<Button label="DAVOM ETISH" disabled onPress={noop} /><LinkButton label="KEYINROQ" onPress={noop} /></ScrollView></Page>;
    }
    default: return <View style={{ flex: 1 }}><Profile /><AppTabBar selected={2} onPress={noop} /></View>;
  }
}
