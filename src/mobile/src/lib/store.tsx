import {
createContext,
useCallback,
useContext,
useMemo,
useState,
type ReactNode,
} from "react";
import { progressOf } from "../../../core/progress.js";
import { units,type Cast } from "../data/content";
import { backendURL,internalBuild,speechURL } from "./config";
import { releaseSettings } from "./releasePolicy";
import { clientId,read,remove,write } from "./storage";

export type Settings = {
  dayShift?: number;
  dark: boolean;
  sound: boolean;
  speaking: boolean;
  saveVoice: boolean;
  reminder: string | null;
  cast: Cast;
  name: string;
  goal: string;
  openAll: boolean;
  server: string;
  speechServer: string;
  onboarded: boolean;
  needAccount: boolean;
  confidence: number;
  joined: string;
  /** unset: follow the measured level; true: still pictures; false: animate even on a phone measured as Still */
  lessMotion?: boolean;
  /** measured during onboarding: how smoothly this phone draws Dombi */
  dombiLevel: "full" | "light" | "still";
  /** true once the level above has been measured on this phone */
  dombiMeasured?: boolean;
  /** last time the app was opened (ISO), for "glad after a break" */
  lastOpen?: string;
  /** Match rush: the most pairs found in one minute */
  matchBest?: number;
  /** minutes a day picked in onboarding's plan */
  minutes?: number;
};
export type Event = {
  client_id: string;
  type: "onboarding" | "lesson" | "confidence" | "account" | "feedback";
  at: string;
  id?: string;
  accuracy?: number;
  mistakes?: number;
  speechRetries?: number;
  spokenMs?: number;
  skipped?: number;
  confidence?: number;
  value?: number;
  text?: string;
  synced?: boolean;
};
export type Resume = {
  id: string;
  ops: string[];
  spokenMs: number;
  speaking: boolean;
};
export type Recording = {
  phraseId: string;
  uri: string;
  at: string;
  ms: number;
  synced?: boolean;
};
const defaults: Settings = {
  dark: false,
  sound: true,
  speaking: true,
  saveVoice: false,
  reminder: null,
  cast: "uk",
  name: "",
  goal: "self",
  openAll: false,
  server: backendURL,
  speechServer: speechURL,
  onboarded: false,
  needAccount: false,
  confidence: 3,
  joined: "",
  dombiLevel: "full",
};

function useStore() {
  const [settings, updateSettings] = useState<Settings>(() => releaseSettings({
    ...defaults,
    ...read("settings", {}),
  }, backendURL, speechURL, internalBuild));
  const [events, updateEvents] = useState<Event[]>(() => read("events", []));
  const [recordings, updateRecordings] = useState<Recording[]>(() =>
    read("recordings", []),
  );
  const [resume, updateResume] = useState<Resume | null>(() =>
    read("resume", null),
  );
  const set = useCallback((patch: Partial<Settings>) => {
    updateSettings((s) => {
      const next = { ...s, ...patch };
      write("settings", next);
      return next;
    });
  }, []);
  const add = useCallback((event: Omit<Event, "client_id" | "at">) => {
    const entry = {
      ...event,
      client_id: clientId(),
      at: new Date(new Date().getTime() + (settings.dayShift || 0) * 86400000).toISOString(),
    };
    updateEvents((es) => {
      const next = [...es, entry];
      write("events", next);
      return next;
    });
    return entry;
  }, [settings.dayShift]);
  const replaceEvents = useCallback((next: Event[]) => {
    write("events", next);
    updateEvents(next);
  }, []);
  const saveResume = useCallback((next: Resume | null) => {
    write("resume", next);
    updateResume(next);
  }, []);
  const saveRecording = useCallback((recording: Recording) => {
    updateRecordings((rs) => {
      const next = [
        recording,
        ...rs.filter((r) => r.phraseId !== recording.phraseId),
      ];
      write("recordings", next);
      return next;
    });
  }, []);
  const deleteRecording = useCallback((id?: string) => {
    updateRecordings((rs) => {
      const next = id ? rs.filter((r) => r.phraseId !== id) : [];
      write("recordings", next);
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    for (const key of [
      "events",
      "settings",
      "resume",
      "recordings",
      "deletedRecordings",
    ])
      remove(key);
    updateEvents([]);
    updateSettings(defaults);
    updateResume(null);
    updateRecordings([]);
  }, []);
  const progress = useMemo(() => {
    const result = progressOf(units, events, { openAll: settings.openAll, now: new Date(new Date().getTime() + (settings.dayShift || 0) * 86400000) });
    return { ...result, done: result.done as Record<string, Event> };
  }, [events, settings.openAll, settings.dayShift]);
  return {
    settings,
    now: () => new Date(new Date().getTime() + (settings.dayShift || 0) * 86400000),
    set,
    events,
    add,
    replaceEvents,
    recordings,
    saveRecording,
    deleteRecording,
    resume,
    saveResume,
    progress,
    reset,
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is missing");
  return value;
}
