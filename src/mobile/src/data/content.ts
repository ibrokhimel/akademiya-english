import uk from "../../../content/audio/uk/index.json";
import us from "../../../content/audio/us/index.json";
import phrases from "../../../content/phrases.json";
import traps from "../../../content/traps.json";
import unit1 from "../../../content/unit-1.json";
import unit2 from "../../../content/unit-2.json";
import unit3 from "../../../content/unit-3.json";

export type Voice = "aziz" | "malika" | "waiter" | "seller";
export type Cast = "uk" | "us";
export type Item = {
  ex: "meet" | "say" | "echo" | "tiles" | "heard" | "fix" | "gap";
  p?: string;
  of?: string;
  en?: string;
  uz?: string;
  voice?: Voice;
  pic?: string;
  task?: string;
  ctx?: string;
  right?: number | string;
  words?: string[];
  bad?: number;
  gap?: number;
  put?: string;
  trap?: string;
  extra?: string[];
  accept?: string[];
  also?: string[];
  review?: boolean;
  talk?: [Voice, string][];
  lead?: [Voice, string];
  q?: string;
  opts?: [string, string][];
  step?: number;
};
export type Lesson = {
  id: string;
  n?: number;
  title: string;
  skill?: string;
  new?: string[];
  items: Item[];
  checkpoint?: boolean;
  levelUp?: number;
  steps?: string[];
  unit: number;
};
export type Unit = {
  unit: number;
  name: string;
  icon: string;
  lessons: Lesson[];
  checkpoint: Lesson;
};
export type Phrase = {
  id: string;
  en: string;
  uz: string;
  pic: string;
  voice: Voice;
  lesson: number;
  loose?: string[];
};
export type ClipPart = {
  ms: number;
  volume: number;
  words: [string, number, number][];
  mouth: [number, number][];
};
export type Clip = ClipPart & { slow: ClipPart };
export const units = [unit1, unit2, unit3].map((u) => ({
  ...u,
  lessons: u.lessons.map((l) => ({ ...l, unit: u.unit })),
  checkpoint: { ...u.checkpoint, unit: u.unit, checkpoint: true },
})) as unknown as Unit[];
export const lessons = units.flatMap((u) => [...u.lessons, u.checkpoint]);
export const P = Object.fromEntries(
  phrases.phrases.map((p) => [p.id, p]),
) as Record<string, Phrase>;
export const T = Object.fromEntries(traps.traps.map((t) => [t.id, t]));
export const clips = { uk: uk.clips, us: us.clips } as unknown as Record<
  Cast,
  Record<string, Clip>
>;
export const names: Record<Voice, string> = {
  aziz: "Aziz",
  malika: "Malika",
  waiter: "Ofitsiant",
  seller: "Sotuvchi",
};
export const goals = [
  ["school", "backpack", "Maktab"],
  ["ielts", "notepad", "IELTS"],
  ["travel", "plane", "Sayohat"],
  ["work", "briefcase", "Ish"],
  ["self", "heart", "O'zim uchun"],
];
