import { cardColors,profileColors } from "../../data/cosmetics";
import { lookColors } from "../../data/profileLook";
import { useApp } from "../../lib/store";
import { brand,shared } from "../system";
import { brandColors,colourOf } from "../themeColors";
import { useTheme } from "../ui";

/** Text on the brand violet (a picked pill): the light surface, the same in both themes since violet does not change. */
export const onAccent = shared.light.surface;
const NAMED = brandColors(shared, brand);

/** Turns a catalogue colour name (data/cosmetics.ts) into a colour for the current theme. */
export function useCosmeticColor() {
  const c = useTheme() as Record<string, string>;
  return (name?: string) => colourOf(name, c, NAMED);
}

/** The profile colour (as text and as a surface) and the card colour of a look, for the current theme (data/profileLook.ts). */
export function useLookColors(look: { color: string; cardColor: string }) {
  const colour = useCosmeticColor();
  return lookColors(look, useApp().settings.dark, colour, { profileColors, cardColors });
}
