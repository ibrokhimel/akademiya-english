import { lookPalette } from "../../data/profileLook";
import { useApp } from "../../lib/store";
import { shared } from "../system";
import { coral,gold,green,useTheme,violet } from "../ui";

/** Text on the brand violet (a picked pill): the light surface, the same in both themes since violet does not change. */
export const onAccent = shared.light.surface;

/** Turns a catalogue colour name (data/cosmetics.ts) into a colour for the current theme. */
export function useCosmeticColor() {
  const c = useTheme() as Record<string, string>;
  return (name?: string) => {
    if (!name) return c.soft;
    if (name.startsWith("#")) return name;
    if (name === "violet") return violet;
    if (name === "coral") return coral;
    if (name === "gold") return gold;
    if (name === "green") return green;
    if (name === "danger") return shared.light.danger;
    return c[name] ?? c.soft;
  };
}

/** The profile colour (as text and as a surface) and the card colour of a look, for the current theme (data/profileLook.ts). */
export function lookColors(look: { color: string; cardColor: string }, dark: boolean) {
  const t = lookPalette[dark ? "dark" : "light"];
  return { text: t.text[look.color] ?? t.text.violet, fill: t.fill[look.color] ?? t.fill.violet, card: t.cards[look.cardColor] ?? t.cards.white };
}
export function useLookColors(look: { color: string; cardColor: string }) {
  return lookColors(look, useApp().settings.dark);
}
