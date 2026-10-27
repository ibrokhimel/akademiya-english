import type { ReactNode } from "react";
import { View } from "react-native";
import { frameShown } from "../../../core/customize.js";
import { frames,type Cosmetic } from "../data/cosmetics";
import { useApp } from "../lib/store";
import { useCosmeticColor } from "./customize/colors";
import { Icon,Txt,useTheme,violet } from "./ui";

/** Ring colour by frame group when the entry has no colour of its own (stand-ins until the frame art lands). */
const groupRing: Record<string, string> = { streak: "notYet", unit: "violet", special: "violet" };

/**
 * The chosen frame drawn around any avatar kind, inside the avatar's own `size` box (so ProfileHeader's layout does not move).
 * Stand-ins (Ruling 2): a coloured ring with a thin card-colour gap; pattern and holiday frames repeat their symbol on the ring;
 * picture frames (streak, unit, speaker) and level frames add a small badge. "none" is the plain card-colour ring.
 * A seasonal frame is drawn only inside its date window.
 */
export function AvatarFrame({ id, size, children }: { id: string; size: number; children: ReactNode }) {
  const c = useTheme(), colour = useCosmeticColor(), { now } = useApp();
  const item = frames.find((f) => f.id === frameShown(id, now()) && f.ready !== false);
  if (!item || item.id === "none") return <Ring size={size} width={size * 0.042} color={c.card}>{children}</Ring>;
  const width = size * (item.id === "perfect" ? 0.035 : 0.07);
  const ring = colour(item.color ?? groupRing[item.group ?? ""] ?? "violet");
  const marks = item.symbol && (item.group === "pattern" || item.group === "special") && item.id !== "perfect" ? item.symbol : null;
  return (
    <View style={{ width: size, height: size }}>
      <Ring size={size} width={width} color={ring} gap={c.card}>{children}</Ring>
      {marks ? <Marks size={size} width={width} symbol={marks} /> : null}
      {item.picture || item.group === "unit" ? <Badge size={size} item={item} /> : null}
    </View>
  );
}

function Ring({ size, width, color, gap, children }: { size: number; width: number; color: string; gap?: string; children: ReactNode }) {
  return (
    <View style={{ width: size, height: size }}>
      {children}
      <View pointerEvents="none" style={{ position: "absolute", inset: 0, borderRadius: size / 2, borderWidth: width, borderColor: color }} />
      {gap ? <View pointerEvents="none" style={{ position: "absolute", inset: width, borderRadius: size / 2 - width, borderWidth: Math.max(1, size * 0.02), borderColor: gap }} /> : null}
    </View>
  );
}

/** Eight copies of the frame's symbol around the ring. */
function Marks({ size, width, symbol }: { size: number; width: number; symbol: string }) {
  const glyph = [...symbol][0];
  const r = size / 2 - width / 2, box = width * 1.6;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <Txt
            key={i}
            accessible={false}
            style={{ position: "absolute", left: size / 2 + r * Math.sin(a) - box / 2, top: size / 2 - r * Math.cos(a) - box / 2, width: box, height: box, lineHeight: box, textAlign: "center", fontSize: width * 0.95, color: violet, fontFamily: "Nunito_900Black" }}
          >
            {glyph}
          </Txt>
        );
      })}
    </>
  );
}

/** A small round badge at the bottom right: the frame's picture, or its symbol (A1, A2). */
function Badge({ size, item }: { size: number; item: Cosmetic }) {
  const c = useTheme(), b = size * 0.32;
  return (
    <View pointerEvents="none" style={{ position: "absolute", right: -size * 0.02, bottom: -size * 0.02, width: b, height: b, borderRadius: b / 2, backgroundColor: c.card, borderWidth: Math.max(1, size * 0.015), borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
      {item.picture ? <Icon name={item.picture} size={b * 0.7} /> : <Txt style={{ fontSize: b * 0.36, lineHeight: b * 0.5, color: violet, fontFamily: "Nunito_900Black" }}>{item.symbol}</Txt>}
    </View>
  );
}
