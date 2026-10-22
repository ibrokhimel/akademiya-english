import type { TextStyle } from "react-native";
import tokens from "../../../../design/system/tokens.json";

// The Akademiya design system (design/system), shared with Akademiya Math.
// Screens take type steps and colours from here instead of writing sizes inline.

export const brand = tokens.color.app.english;
export const shared = tokens.color;
export const radius = tokens.radius;
export const lip = tokens.lip;

export type TypeStep = keyof typeof tokens.type;

const family: Record<number, string> = {
  700: "Nunito_700Bold",
  800: "Nunito_800ExtraBold",
  900: "Nunito_900Black",
};

// A type step as a text style, scaled by the screen's design scale `d`.
export function type(step: TypeStep, d: (n: number) => number = (n) => n): TextStyle {
  const t = tokens.type[step] as { size: number; line: number; weight: number; letterSpacing?: number; uppercase?: boolean };
  return {
    fontSize: d(t.size),
    lineHeight: d(t.line),
    fontFamily: family[t.weight],
    ...(t.letterSpacing ? { letterSpacing: d(t.letterSpacing) } : null),
  };
}

export const springs = tokens.motion.springs;
export const STAGGER_MS = tokens.motion.staggerMs;
