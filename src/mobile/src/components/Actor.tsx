import {
Fit,
RiveView,
useRiveFile,
useViewModelInstance,
type RiveFile,
} from "@rive-app/react-native";
import { createContext,useContext,useEffect,type ReactNode } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { watchMotion } from "../lib/audio";
import { useApp } from "../lib/store";

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
}: {
  who?: string;
  size?: number;
  mood?: string;
  gesture?: string;
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
          <LoadedActor file={file} who={who} mood={mood} gesture={gesture} />
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
}: {
  file: RiveFile;
  who: string;
  mood: string;
  gesture: string;
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
    if (!instance) return;
    instance.booleanProperty("dark")?.set(settings.dark);
    if (who === "dombi") {
      instance.enumProperty("mood")?.set(mood);
      if (!reduce) instance.enumProperty("gesture")?.set(gesture);
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
  }, [instance, who, mood, gesture, settings.dark, reduce]);
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
