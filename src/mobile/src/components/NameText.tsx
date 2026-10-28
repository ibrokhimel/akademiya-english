import type { StyleProp,TextStyle } from "react-native";
import { nameColors } from "../data/cosmetics";
import { useCosmeticColor } from "./customize/colors";
import { coral,Txt,violet } from "./ui";

// Two hex colours mixed: t = 0 is a, 1 is b.
function mix(a: string, b: string, t: number) {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return "#" + [0, 1, 2].map((i) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * t).toString(16).padStart(2, "0")).join("");
}

/**
 * The learner's name in the colour they picked (nameColors). The earned gradient runs violet to coral, letter by letter.
 * `plain` is the colour of "Oddiy" (the profile colour on the Profile tab); without it "Oddiy" is the text colour.
 */
export function NameText({ name, color, style, numberOfLines, plain }: { name: string; color: string; style?: StyleProp<TextStyle>; numberOfLines?: number; plain?: string }) {
  const colour = useCosmeticColor();
  if (color === "gradient") {
    const letters = [...name];
    return (
      <Txt numberOfLines={numberOfLines} style={style}>
        {letters.map((ch, i) => <Txt key={i} style={[style, { color: mix(violet, coral, letters.length > 1 ? i / (letters.length - 1) : 0) }]}>{ch}</Txt>)}
      </Txt>
    );
  }
  const item = nameColors.find((x) => x.id === color) ?? nameColors[0];
  return <Txt numberOfLines={numberOfLines} style={[style, { color: item.id === "default" && plain ? plain : colour(item.color) }]}>{name}</Txt>;
}
