import { cardColors,profileColors } from "../../data/cosmetics";
import { lookColors } from "../../data/profileLook";
import { useApp } from "../../lib/store";
import { brand,shared } from "../system";
import { appThemes,brandColors,colourOf } from "../themeColors";
import { useTheme } from "../ui";

const NAMED = brandColors(shared, brand);
const SWATCH = appThemes(shared).light.violet as Record<string, string>;

/** Turns a catalogue colour name (data/cosmetics.ts) into a colour for the current theme. */
export function useCosmeticColor() {
  const c = useTheme() as Record<string, string>;
  return (name?: string) => colourOf(name, c, NAMED);
}

/** A catalogue colour as a fixed swatch, the same in light and dark (the theme and app icon tiles of Ilova ko'rinishi). */
export function swatchColor(name?: string) {
  return colourOf(name, SWATCH, NAMED);
}

/** The profile colour (as text and as a surface) and the card colour of a look, for the current theme (data/profileLook.ts). */
export function useLookColors(look: { color: string; cardColor: string }) {
  const colour = useCosmeticColor();
  return lookColors(look, useApp().isDark, colour, { profileColors, cardColors });
}
