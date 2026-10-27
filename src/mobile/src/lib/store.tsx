import {
createContext,
useCallback,
useContext,
useMemo,
useState,
type ReactNode,
} from "react";
import { progressOf } from "../../../core/progress.js";
import { defaultProfile,earnedItems,normalizeProfile } from "../../../core/profile.js";
import { unitSlugs } from "../data/cosmetics";
import { units,type Cast } from "../data/content";
import { backendURL,internalBuild,speechURL } from "./config";
import { releaseSettings } from "./releasePolicy";
import { profileFacts } from "./progressExtras";
import { clientId,read,remove,write } from "./storage";

type Media = { uri: string | null; mediaType: "image" | "gif" | "video" | null };
/** What a learner chose for their profile (src/core/profile.js owns the shape and the rules). */
export type Profile = {
  v: 1;
  avatar: Media & {
    kind: "letter" | "photo" | "media" | "dombi" | "built";
    color: string; bg: string; expression: string;
    built: { skin: number; hair: string | null; eyes: string; brows: string | null; beard: string | null; glasses: string | null; hijab: string | null; doppi: string | null; clothes: string | null };
  };
  frame: string;
  banner: Media & { kind: "color" | "item" | "media"; id: string };
  username: string; bio: string; why: string | null; destination: string | null; nativeLanguage: string;
  city: string; showCity: boolean; birthday: string | null; title: string | null; nameColor: string;
  badges: { pinned: string[]; style: "grid" | "row" | "shelf"; shelfOrder: string[]; spotlightRarest: boolean };
  stats: { layout: string; shown: string[]; favouritePhrase: string | null; wordOfWeek: string; private: boolean };
  dombi: { outfit: string; pose: string; tint: string; name: string; visitorReaction: string };
  look: {
    color: string; cardColor: string; background: Media & { kind: "color" | "item" | "media"; id: string }; dim: number;
    sections: { id: string; shown: boolean }[];
  };
};

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
  /** Dombi falls and rolls with the phone's tilt and movement on the tabs; off unless turned on (owner 2026-10-28) */
  phoneMotion?: boolean;
  /** minutes a day picked in onboarding's plan */
  minutes?: number;
  /** the profile the learner builds (the display name stays in `name`) */
  profile: Profile;
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
  profile: defaultProfile() as Profile,
};

function useStore() {
  const [settings, updateSettings] = useState<Settings>(() => {
    const saved = read<Partial<Settings>>("settings", {});
    return releaseSettings({
      ...defaults,
      ...saved,
      // installs from before the profile existed have none: they get the defaults
      profile: normalizeProfile(saved.profile) as Profile,
    }, backendURL, speechURL, internalBuild);
  });
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
  const setProfile = useCallback((patch: Partial<Profile> | ((p: Profile) => Profile)) => {
    updateSettings((s) => {
      const profile = normalizeProfile(typeof patch === "function" ? patch(s.profile) : { ...s.profile, ...patch }) as Profile;
      const next = { ...s, profile };
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
      "profileMedia",
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
    setProfile,
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
/** The profile, a way to change it, and the ids of everything real progress has earned so far ("ever reached", not "right now"). */
export function useProfile() {
  const { settings, setProfile, events, progress } = useApp();
  const earned = useMemo(() => {
    const facts = profileFacts(events);
    return earnedItems({
      bestStreak: facts.best,
      perfectLessons: facts.perfect.length,
      minutesSpoken: facts.minutes,
      earlyLessons: facts.early.length,
      level: progress.level,
      unitsDone: units.filter((u) => progress.done[u.checkpoint.id]).map((u) => unitSlugs[u.unit]).filter(Boolean),
    }) as Set<string>;
  }, [events, progress]);
  return { profile: settings.profile, setProfile, earned };
}
