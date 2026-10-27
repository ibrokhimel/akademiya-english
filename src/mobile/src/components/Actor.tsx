import {
Fit,
RiveView,
useRiveFile,
useViewModelInstance,
type RiveFile,
} from "@rive-app/react-native";
import { createContext,useContext,useEffect,useRef,type ReactNode,type RefObject } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { watchMotion } from "../lib/audio";
import { useApp } from "../lib/store";

/** Direct control of the rig, for touch play: triggers, the `play` enum, mood, numbers and booleans. */
export type Rig = {
  fire: (trigger: string) => void;
  play: (value: string) => void;
  mood: (value: string) => void;
  num: (name: string, value: number) => void;
  bool: (name: string, value: boolean) => void;
};

// The hats the rig can draw (its DombiHat enum, design/rive/dombi_full.js): every other outfit waits for its art (Ruling 3).
const RIVE_HATS = ["none", "doppi"];

const FileContext = createContext<RiveFile | null>(null);
export function useActorFile() {
  return useContext(FileContext);
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SOURCE = require("../../../../design/rive/out/waiters.riv");
export function Actors({ children }: { children: ReactNode }) {
  const { riveFile } = useRiveFile(SOURCE);
  return (
    <FileContext.Provider value={riveFile ?? null}>
      {children}
    </FileContext.Provider>
  );
}
export function Actor({
  who = "dombi",
  size = 155,
  mood = "smirk",
  gesture = "none",
  trigger,
  talking,
  listening,
  rigRef,
  onReady,
  outfit,
}: {
  who?: string;
  size?: number;
  mood?: string;
  gesture?: string;
  /** fired once when the moment starts: correct, wrong or celebrate */
  trigger?: string;
  talking?: boolean;
  listening?: boolean;
  rigRef?: RefObject<Rig | null>;
  /** called once the rig is loaded and drawing */
  onReady?: () => void;
  /** Dombi's outfit when it is not the saved one (the Dombi editor's preview) */
  outfit?: string;
}) {
  const file = useContext(FileContext);
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      {file ? (
        <View
          style={
            who === "dombi"
              ? {
                  position: "absolute",
                  width: size * 1.32,
                  height: size * 1.32,
                  left: size * -0.164,
                  top: size * -0.231,
                }
              : { flex: 1 }
          }
        >
          <LoadedActor file={file} who={who} mood={mood} gesture={gesture} trigger={trigger} talking={talking} listening={listening} rigRef={rigRef} onReady={onReady} outfit={outfit} />
        </View>
      ) : null}
    </View>
  );
}
function LoadedActor({
  file,
  who,
  mood,
  gesture,
  trigger,
  talking,
  listening,
  rigRef,
  onReady,
  outfit,
}: {
  file: RiveFile;
  who: string;
  mood: string;
  gesture: string;
  trigger?: string;
  talking?: boolean;
  listening?: boolean;
  rigRef?: RefObject<Rig | null>;
  onReady?: () => void;
  outfit?: string;
}) {
  const { settings } = useApp(),
    reduce = useReducedMotion();
  const board =
    (
      {
        dombi: "Dombi",
        aziz: "Aziz",
        malika: "Malika",
        waiter: "Waiter A",
        seller: "Waiter C",
      } as Record<string, string>
    )[who] || "Dombi";
  const { instance } = useViewModelInstance(file, {
    artboardName: board,
    async: true,
  });
  useEffect(() => {
    if (!instance || !rigRef) return;
    rigRef.current = {
      fire: (name) => instance.triggerProperty(name)?.trigger(),
      play: (value) => instance.enumProperty("play")?.set(value),
      mood: (value) => instance.enumProperty("mood")?.set(value),
      num: (name, value) => instance.numberProperty(name)?.set(value),
      bool: (name, value) => instance.booleanProperty(name)?.set(value),
    };
    return () => { rigRef.current = null; };
  }, [instance, rigRef]);
  useEffect(() => {
    if (!instance || !onReady) return;
    // The view draws its first frame a moment after the instance exists.
    const t = setTimeout(onReady, 120);
    return () => clearTimeout(t);
  }, [instance, onReady]);
  // His outfit from the profile: the hat goes on at once when he appears; a change plays his quick `dress` hop-turn and
  // the new hat lands in it (as in design/rive/moments.html). Neck, hand and glasses items and the corner props have no
  // Rive art yet, so nothing else is set.
  const wearing = outfit ?? settings.profile.dombi.outfit, hat = RIVE_HATS.includes(wearing) ? wearing : "none";
  const worn = useRef<{ instance: unknown; hat: string } | null>(null);
  useEffect(() => {
    if (!instance || who !== "dombi") return;
    const before = worn.current?.instance === instance ? worn.current.hat : null;
    if (before === hat) return;
    // worn records a hat only once it is on, so a run cut short inside the 90 ms (Reduce Motion flipping) tries again
    if (before === null || reduce) { instance.enumProperty("hat")?.set(hat); worn.current = { instance, hat }; return; }
    instance.triggerProperty("dress")?.trigger();
    const t = setTimeout(() => { instance.enumProperty("hat")?.set(hat); worn.current = { instance, hat }; }, 90);
    return () => clearTimeout(t);
  }, [instance, who, hat, reduce]);
  useEffect(() => {
    if (!instance) return;
    instance.booleanProperty("dark")?.set(settings.dark);
    if (who === "dombi") {
      instance.enumProperty("mood")?.set(mood);
      if (!reduce) instance.enumProperty("gesture")?.set(gesture);
      if (talking !== undefined) instance.booleanProperty("talking")?.set(talking);
      if (listening !== undefined) instance.booleanProperty("listening")?.set(listening);
      if (trigger && !reduce) instance.triggerProperty(trigger)?.trigger();
    }
    return watchMotion((event) => {
      if (event.who !== who) return;
      instance.booleanProperty("talking")?.set(event.talking);
      if (event.reaction) instance.triggerProperty(event.reaction)?.trigger();
      instance.numberProperty("viseme")?.set(event.viseme ?? 0);
      if (who === "dombi") {
        instance.booleanProperty("listening")?.set(event.listening ?? false);
        instance.numberProperty("amp")?.set(event.amp ?? 0);
      }
    });
  }, [instance, who, mood, gesture, trigger, talking, listening, settings.dark, reduce]);
  return instance ? (
    <RiveView
      file={file}
      artboardName={board}
      stateMachineName={who === "dombi" ? "Dombi" : "Waiter"}
      dataBind={instance}
      fit={Fit.Contain}
      autoPlay
      style={{ flex: 1 }}
    />
  ) : null;
}
