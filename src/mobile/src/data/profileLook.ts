// "Ranglar va fon" (screen OPgwZ): profile-only colour tokens for the Profile tab, one set per theme.
// `fill` is the profile colour as a surface (the swatch, the letter avatar of the preview); `text` is the same colour as
// text, darkened in light mode where the brand colour is too pale to read (gold, green, coral) and lightened in dark mode
// for violet. `cards` are the card colours. scripts/cosmetics.test.mjs checks every pair: the name colour reads on the page
// and on every card at 3:1 (large bold text) and body text on every card at 4.5:1, in both themes.
// The card hexes are the soft washes of components/ui.tsx useTheme() (card, coralSoft, blueSoft, cream).

export type LookTokens = {
  page: string;
  ink: string;
  fill: Record<string, string>;
  text: Record<string, string>;
  cards: Record<string, string>;
};

export const lookPalette: { light: LookTokens; dark: LookTokens } = {
  light: {
    page: "#FFFFFF",
    ink: "#14161B",
    fill: { violet: "#7B5CFF", coral: "#FF6B5B", gold: "#FFCB2E", green: "#1DB45A" },
    text: { violet: "#7B5CFF", coral: "#E5483A", gold: "#9A6A00", green: "#15934A" },
    cards: { white: "#FFFFFF", coral: "#FFEDEA", sky: "#E8F6FD", gold: "#FFFDF3" },
  },
  dark: {
    page: "#121214",
    ink: "#F4F4F6",
    fill: { violet: "#7B5CFF", coral: "#FF6B5B", gold: "#FFCB2E", green: "#1DB45A" },
    text: { violet: "#9F87FF", coral: "#FF6B5B", gold: "#FFCB2E", green: "#1DB45A" },
    cards: { white: "#1B1B1F", coral: "#3A1F1B", sky: "#12303F", gold: "#24211A" },
  },
};
