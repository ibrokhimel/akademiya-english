import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { DombiPlay } from "./DombiPlay";
import { Effect } from "./Effects";

/**
 * The small Dombi in the answer panel. After a right answer he holds up a hand for a high-five (motion-plan §8;
 * owner, 2026-10-27: here, at 48): a tap on him claps, with a pop; ignored for 2.8 s, he plays it off.
 */
export function PanelDombi({ right, size }: { right: boolean; size: number }) {
  const eventsRef = useRef<((type: string) => void) | null>(null), [pops, setPops] = useState(0);
  useEffect(() => { if (right) eventsRef.current?.("highfive"); }, [right]);
  return (
    <View style={{ width: size, height: size }}>
      <DombiPlay moment={right ? "correct" : "notYet"} size={size} rule="nocarry" eventsRef={eventsRef} onPop={() => setPops((n) => n + 1)} />
      {pops ? (
        <View key={pops} pointerEvents="none" style={{ position: "absolute", left: -size, top: -size, width: size * 3, height: size * 3 }}>
          <Effect board="Pop" style={{ flex: 1 }} />
        </View>
      ) : null}
    </View>
  );
}
