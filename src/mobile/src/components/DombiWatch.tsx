import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { View, type GestureResponderEvent } from "react-native";

type Finger = (x: number, y: number) => void;
const Watch = createContext<{ add: (f: Finger) => () => void } | null>(null);

/**
 * Lets Dombi's eyes follow a finger anywhere on the tabs (motion-plan §8 "eye tracking"). The view only watches
 * touches as they pass; it never takes one, so buttons and scrolling work as before.
 */
export function DombiWatch({ children }: { children: ReactNode }) {
  const fingers = useRef(new Set<Finger>());
  const value = useMemo(() => ({ add: (f: Finger) => { fingers.current.add(f); return () => { fingers.current.delete(f); }; } }), []);
  const tell = (e: GestureResponderEvent) => { const { pageX, pageY } = e.nativeEvent; for (const f of fingers.current) f(pageX, pageY); };
  return (
    <Watch.Provider value={value}>
      <View style={{ flex: 1 }} onTouchStart={tell} onTouchMove={tell}>{children}</View>
    </Watch.Provider>
  );
}

/** Calls onFinger with a finger's screen point while `on`; outside a DombiWatch nothing happens. */
export function useFinger(on: boolean, onFinger: Finger) {
  const watch = useContext(Watch), latest = useRef(onFinger);
  useEffect(() => { latest.current = onFinger; }, [onFinger]);
  useEffect(() => (on && watch ? watch.add((x, y) => latest.current(x, y)) : undefined), [on, watch]);
}
