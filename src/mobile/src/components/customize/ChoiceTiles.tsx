import type { ReactNode } from "react";
import { Pressable,View,useWindowDimensions } from "react-native";
import { isOpen,shown,type Cosmetic } from "../../data/cosmetics";
import { sound } from "../../lib/audio";
import { useApp } from "../../lib/store";
import { Icon,Txt,useTheme } from "../ui";
import { useDesignScale } from "../useDesignScale";
import { useCosmeticColor } from "./colors";

export type Choice = {
  id: string;
  label: string;
  /** what the tile shows: see CosmeticFace for catalogue entries */
  content: ReactNode;
  locked?: boolean;
  /** shown instead of the label while locked: the goal that opens it ("100 kun") */
  caption?: string;
};

/** The stand-in picture of a catalogue entry: its colour, a picture from assets.ts or a short symbol. */
export function CosmeticFace({ item, locked = false }: { item: Cosmetic; locked?: boolean }) {
  const d = useDesignScale(), c = useTheme(), colour = useCosmeticColor();
  const solid = !!item.color && !item.symbol && !item.picture;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: item.color ? colour(item.color) : undefined, opacity: locked ? 0.5 : 1 }}>
      {item.picture ? <View style={locked ? { filter: [{ grayscale: 1 }] } : undefined}><Icon name={item.picture} size={d(40)} /></View> : null}
      {item.symbol && !item.picture ? <Txt numberOfLines={1} style={{ fontSize: d(item.symbol.length > 3 ? 12 : 18), fontFamily: "Nunito_900Black", color: solid ? "#FFFFFF" : locked ? c.muted : c.accent }}>{item.symbol}</Txt> : null}
    </View>
  );
}

/** Catalogue entries as tiles (entries without ready art are left out); entries the learner has not earned yet come out locked with their goal as caption. */
export function choicesFrom(list: Cosmetic[], earned: ReadonlySet<string>): Choice[] {
  return shown(list).map((x) => {
    const locked = !isOpen(x, earned);
    return { id: x.id, label: x.label, locked, caption: locked ? x.label : undefined, content: <CosmeticFace item={x} locked={locked} /> };
  });
}

/**
 * A grid of picture tiles with the name under each. States: default, selected (violet border and check badge),
 * locked (greyed, lock badge, goal caption). `columns` per row (4 by default); `tileHeight` overrides the square.
 */
export function ChoiceTiles({ items, value, onSelect, columns = 4, tileHeight, round = false }: {
  items: Choice[];
  value: string | null;
  onSelect: (id: string) => void;
  columns?: number;
  tileHeight?: number;
  /** circular tiles */
  round?: boolean;
}) {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp(), { width } = useWindowDimensions();
  const gap = d(10), side = d(20);
  const size = Math.floor((width - side * 2 - gap * (columns - 1)) / columns);
  const height = tileHeight ?? size;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: gap, rowGap: d(12) }}>
      {items.map((o) => {
        const selected = value === o.id;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityLabel={o.locked && o.caption ? `${o.caption}, yopiq` : o.label}
            accessibilityState={{ selected, disabled: !!o.locked }}
            disabled={o.locked}
            onPress={() => { sound("pick", settings.sound); onSelect(o.id); }}
            style={{ width: size, alignItems: "center", gap: d(6) }}
          >
            <View
              style={{
                width: size,
                height,
                borderRadius: round ? height / 2 : d(18),
                borderWidth: d(selected ? 3 : 2),
                borderColor: selected ? c.accent : c.line,
                backgroundColor: o.locked ? c.surface : c.soft,
                overflow: "hidden",
              }}
            >
              {o.content}
            </View>
            {selected ? (
              <View style={{ position: "absolute", top: d(8), right: d(8), width: d(20), height: d(20), borderRadius: d(10), backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
                <Icon name="glyph-check-white" size={d(14)} />
              </View>
            ) : null}
            {o.locked ? <Icon name="glyph-lock-grey" size={d(18)} style={{ position: "absolute", top: d(8), right: d(8) }} /> : null}
            <Txt numberOfLines={2} style={{ fontSize: d(12), lineHeight: d(15), textAlign: "center", fontFamily: "Nunito_900Black", color: o.locked ? c.muted : selected ? c.accent : c.text }}>
              {o.locked && o.caption ? o.caption : o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
