// The app's light and dark palettes and the brand colour names, with no app imports, so node tests read the very
// values the app draws with. components/ui.tsx builds useTheme() from appThemes(); colours.ts resolves catalogue names.
import { accentInk,THEME_IDS } from "../../../core/look.js";

type Mode = Record<string, string>;
/** `shared` is design/system/tokens.json `color`, `brand` its `app.english`. */
export function makeThemes(shared: { light: Mode; dark: Mode }, brand: Mode) {
  const L = shared.light, D = shared.dark;
  return {
    light: {
      bg: "#FFFFFF",
      card: "#FFFFFF",
      surface: L.paper,
      line: L.line,
      text: L.ink,
      muted: L.muted,
      soft: brand.wash,
      good: L.correctWash,
      bad: L.notYetWash,
      goodText: L.correctText,
      notYet: L.notYet,
      notYetText: L.notYetText,
      edge: "#B7B7B7",
      softLine: "#C9BDFF",
      goldSoft: "#FFF4D1",
      blueSoft: "#E8F6FD",
      ice: "#DDF4FF",
      orangeWash: "#FFF1DC", iceText: "#1491C9", cream: "#FFFDF3", coralSoft: "#FFEDEA", orangeBand: "#FFE2B8", faint: "#B7B7B7", tileOrange: "#FFF1E0", tileGold: "#FFF8E0", tileGrey: "#F1F3F7", tilePink: "#FFE8F3", goldText: "#C98A00",
      dangerFill: "#FF4B5C", dangerLip: "#C02A3D", onFill: "#FFFFFF",
    },
    dark: {
      bg: "#121214",
      card: "#1B1B1F",
      surface: "#242429",
      line: "#34343B",
      text: D.ink,
      muted: D.muted,
      soft: "#26214A",
      good: D.correctWash,
      bad: D.notYetWash,
      goodText: D.correctText,
      notYet: D.notYet,
      notYetText: D.notYetText,
      edge: "#26262B",
      softLine: "#463C85",
      goldSoft: "#383014",
      blueSoft: "#12303F",
      ice: "#11323F",
      orangeWash: "#33240F", iceText: "#5BC8F5", cream: "#24211A", coralSoft: "#3A1F1B", orangeBand: "#4A3212", faint: "#5F5F69", tileOrange: "#33240F", tileGold: "#2E2812", tileGrey: "#24262B", tilePink: "#3A1C2B", goldText: "#FFC93C",
      dangerFill: "#FF4B5C", dangerLip: "#C02A3D", onFill: "#FFFFFF",
    },
  };
}
type Base = ReturnType<typeof makeThemes>["light"];

/**
 * A base palette with a colour theme (MAVZU) laid on: `accent` is what `violet` was for buttons, picks and progress,
 * `accentLip` its button edge, `accentWash`/`accentWashLine` (also `soft`/`softLine`) its pale fill and border, and
 * `onAccent` the text on an accent fill. Binafsha gives back today's palette.
 */
export function withTheme(base: Base, palette: Mode, ink: string) {
  return {
    ...base,
    soft: palette.wash,
    softLine: palette.washLine,
    accent: palette.main,
    accentLip: palette.lip,
    accentWash: palette.wash,
    accentWashLine: palette.washLine,
    onAccent: accentInk(palette.main, ink),
  };
}
export type Theme = ReturnType<typeof withTheme>;

/** Every theme in light and dark: `color` is tokens.json `color` (its `themes` hold the palettes). */
export function appThemes(color: { light: Mode; dark: Mode; app: { english: Mode }; themes: { light: Record<string, Mode>; dark: Record<string, Mode> } }) {
  const base = makeThemes(color, color.app.english);
  const build = (mode: "light" | "dark") =>
    Object.fromEntries(THEME_IDS.map((id) => [id, withTheme(base[mode], color.themes[mode][id], color.light.ink)])) as Record<string, Theme>;
  return { light: build("light"), dark: build("dark") };
}

/** The brand colours catalogue entries name: violet, coral, gold, green, and danger. */
export function brandColors(shared: { light: Mode }, brand: Mode) {
  return { violet: brand.main, coral: "#FF6B5B", gold: shared.light.reward, green: shared.light.correct, danger: shared.light.danger } as Record<string, string>;
}

/** A catalogue colour name (data/cosmetics.ts) for a theme: a hex as it is, a brand name, or a theme key; anything else is `soft`. */
export function colourOf(name: string | undefined, theme: Record<string, string>, named: Record<string, string>) {
  if (!name) return theme.soft;
  if (name.startsWith("#")) return name;
  return named[name] ?? theme[name] ?? theme.soft;
}
