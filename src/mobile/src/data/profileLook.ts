// "Ranglar va fon" (screen OPgwZ). The swatches, the cards and the page come from the app's own palettes
// (components/themeColors.ts via the catalogue colour names in data/cosmetics.ts); the only profile-only values are the
// profile colours as text where the brand colour does not read on the page or the cards: darker coral, gold and green in
// light mode, lighter violet in dark mode. scripts/cosmetics.test.mjs runs lookColors() on the same palettes and checks the
// name colour on the page and every card at 3:1 (large bold text) and body text on every card at 4.5:1, in both themes.
// No imports: node tests load this file as it is.

export const profileText: { light: Record<string, string>; dark: Record<string, string> } = {
  light: { coral: "#E5483A", gold: "#9A6A00", green: "#15934A" },
  dark: { violet: "#9F87FF" },
};
/** The look a new install starts with (src/core/profile.js defaultProfile). */
export const DEFAULT_LOOK = { color: "violet", cardColor: "white" };

type Entry = { id: string; color?: string };
/**
 * A look's colours for one theme. `colour` resolves a catalogue colour name for that theme (colourOf / useCosmeticColor).
 * fill: the profile colour as a surface; text: the same as text; card: the card colour; custom: a card colour was picked
 * (the default keeps each card's own look); name: the name's colour while the name colour is "Oddiy", undefined for the
 * default profile colour (the name stays in the text ink).
 */
export function lookColors(look: { color: string; cardColor: string }, dark: boolean, colour: (name?: string) => string, lists: { profileColors: Entry[]; cardColors: Entry[] }) {
  const p = lists.profileColors.find((x) => x.id === look.color) ?? lists.profileColors[0];
  const k = lists.cardColors.find((x) => x.id === look.cardColor) ?? lists.cardColors[0];
  const fill = colour(p.color), text = profileText[dark ? "dark" : "light"][p.id] ?? fill;
  return { fill, text, card: colour(k.color), custom: k.id !== DEFAULT_LOOK.cardColor, name: p.id === DEFAULT_LOOK.color ? undefined : text };
}
