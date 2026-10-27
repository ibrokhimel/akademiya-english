// The awards on the Profile tab (MUKOFOTLAR): what each counts and its goal.
// `color` and `soft` are colour names as in data/cosmetics.ts (useCosmeticColor): a hex, a brand name or a useTheme() key.
import type { profileFacts } from "../lib/progressExtras";
import { units } from "./content";
import { unitSlugs } from "./cosmetics";

export type Award = {
  id: string;
  icon: string;
  color: string;
  soft: string;
  goal: number;
  title: string;
  value: number;
  /** when it was first earned (ISO) */
  at?: string;
  /** shown only in builds with test tools (friends do not exist yet) */
  testOnly?: boolean;
};

export function awardsOf(f: ReturnType<typeof profileFacts>, level: number): Award[] {
  return [
    { id: "perfect", icon: "target", color: "#3DCB6C", soft: "good", goal: 5, title: "Xatosiz yakun", value: f.perfect.length, at: f.perfect[0]?.at },
    { id: "friendly", icon: "hands-up", color: "#F25CA2", soft: "tilePink", goal: 10, title: "Do'stona", value: 0, at: undefined, testOnly: true },
    { id: "early", icon: "bell", color: "#E0A400", soft: "goldSoft", goal: 10, title: "Erta turuvchi", value: f.early.length, at: f.early[0]?.at },
    { id: "speaker", icon: "studio-mic", color: "violet", soft: "soft", goal: 10, title: "Gapiruvchi", value: f.minutes, at: f.minuteAt },
    { id: "fixer", icon: "bulb-tip", color: "#FF6B5B", soft: "coralSoft", goal: 10, title: "Xato ovchisi", value: f.fixed.length, at: f.fixed[0]?.at },
    { id: "legend", icon: "crown", color: "#E0A400", soft: "goldSoft", goal: 1, title: "Afsona", value: level, at: f.levelAt },
  ];
}

// Checkpoint trophies, one per unit: earned when the unit's checkpoint is done (KUBOKLAR JAVONI, screen E7QQz).
const trophyNames: Record<string, string> = { salom: "Salom", cafe: "Kafe", shop: "Do'kon" };
export type Badge = Award & { earned: boolean; /** the line under a badge that is not earned yet */ hint: string; trophy?: boolean };

export function trophiesOf(done: Record<string, { at: string }>): Badge[] {
  return units.filter((u) => unitSlugs[u.unit]).map((u) => {
    const slug = unitSlugs[u.unit], name = trophyNames[slug] ?? u.name, at = done[u.checkpoint.id]?.at;
    return { id: `trophy.${slug}`, icon: "trophy-unit", color: "gold", soft: "goldSoft", goal: 1, title: `${name} kubogi`, value: at ? 1 : 0, at, earned: !!at, hint: `${name} bo'limini tugating`, trophy: true };
  });
}
/** Every badge a learner can pin: the awards (earned once counted at least once), then the checkpoint trophies. */
export function badgesOf(awards: Award[], done: Record<string, { at: string }>): Badge[] {
  return [
    ...awards.map((a) => ({ ...a, earned: a.value > 0, hint: `${Math.min(a.value, a.goal)} / ${a.goal}` })),
    ...trophiesOf(done),
  ];
}
