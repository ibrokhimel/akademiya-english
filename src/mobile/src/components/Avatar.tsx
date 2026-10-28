import { View } from "react-native";
import { avatarBackgrounds,builtParts,skinTones } from "../data/cosmetics";
import type { Profile } from "../lib/store";
import { useCosmeticColor } from "./customize/colors";
import { ProfileMedia } from "./ProfileMedia";
import { Icon,Txt,useTheme,violet } from "./ui";

/** Mixes a #RRGGBB colour toward white by `amount` (0..1); other colour strings come back unchanged. */
export function lighter(hex: string, amount: number) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * amount).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/**
 * The learner's avatar, any kind, filling a `size` circle: letter (colour, background, own picture under the letter),
 * photo, GIF / video, Dombi (still picture, Ruling 4, with his doppi when he wears it), built face (Ruling 5) and the moving
 * avatar's still stand-in (Ruling 6). ProfileHeader, the hub preview and the editors all draw it.
 */
export function Avatar({ avatar, name, size, dombiOutfit = "none" }: {
  avatar: Profile["avatar"];
  name: string;
  size: number;
  dombiOutfit?: string;
}) {
  const c = useTheme();
  const box = { width: size, height: size, borderRadius: size / 2, overflow: "hidden" as const, alignItems: "center" as const, justifyContent: "center" as const };
  const own = avatar.uri && avatar.mediaType ? { uri: avatar.uri, mediaType: avatar.mediaType } : null;
  if ((avatar.kind === "photo" || avatar.kind === "media") && own)
    return <View style={[box, { backgroundColor: c.soft }]}><ProfileMedia uri={own.uri} mediaType={own.mediaType} /></View>;
  if (avatar.kind === "dombi")
    return (
      <View style={[box, { backgroundColor: c.soft }]}>
        <Icon name="pet-black-happy" size={size * 0.72} style={{ marginTop: size * 0.12 }} />
        {dombiOutfit === "doppi" ? <Icon name="top-hat" size={size * 0.34} style={{ position: "absolute", top: size * 0.06 }} /> : null}
      </View>
    );
  if (avatar.kind === "moving")
    return <View style={[box, { backgroundColor: c.soft }]}><Icon name="face-smile" size={size * 0.62} /></View>;
  if (avatar.kind === "built") return <BuiltFace built={avatar.built} expression={avatar.expression} size={size} />;
  return <LetterAvatar avatar={avatar} name={name} size={size} />;
}

function LetterAvatar({ avatar, name, size }: { avatar: Profile["avatar"]; name: string; size: number }) {
  const colour = useCosmeticColor();
  const fill = colour(avatar.color);
  const ownPicture = avatar.bg === "own" && avatar.uri && avatar.mediaType ? avatar.uri : null;
  const pattern = avatarBackgrounds.find((b) => b.id === avatar.bg && b.symbol && b.id !== "gradient")?.symbol;
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: fill,
        ...(avatar.bg === "gradient" ? { experimental_backgroundImage: `linear-gradient(135deg, ${lighter(fill, 0.45)}, ${fill})` } : null),
      }}
    >
      {ownPicture ? <ProfileMedia uri={ownPicture} mediaType={avatar.mediaType} /> : null}
      {pattern && !ownPicture ? (
        // the pattern stand-in: its symbol repeated faintly behind the letter until the pattern art lands
        <View pointerEvents="none" style={{ position: "absolute", inset: 0, flexDirection: "row", flexWrap: "wrap", alignContent: "center", justifyContent: "center", opacity: 0.22 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <Txt fixed key={i} style={{ width: size / 3, textAlign: "center", fontSize: size * 0.14, lineHeight: size / 3, color: "#FFFFFF", fontFamily: "Nunito_900Black" }}>{pattern}</Txt>
          ))}
        </View>
      ) : null}
      <Txt
        fixed
        style={{
          fontSize: size * 0.45, lineHeight: size * 0.6, color: "#FFFFFF", fontFamily: "Nunito_900Black",
          ...(ownPicture ? { textShadowColor: "#00000066", textShadowRadius: size * 0.04, textShadowOffset: { width: 0, height: 1 } } : null),
        }}
      >
        {(name.trim()[0] || "?").toUpperCase()}
      </Txt>
    </View>
  );
}

const ink = "#2B2B3C", hairInk = "#3B2A20";

/**
 * The built face: layered Views over a skin-colour circle. Each part reads its entry in the builtParts catalogue, so real part art can replace a layer later.
 * The expression (IFODA) shapes the mouth: calm a line, smile a curve, focus a short line.
 */
function BuiltFace({ built, expression, size }: { built: Profile["avatar"]["built"]; expression: string; size: number }) {
  const c = useTheme();
  const u = (n: number) => (n / 100) * size;
  const skin = skinTones[built.skin]?.color ?? skinTones[2].color!;
  const has = (group: string, id: string | null) => !!id && builtParts.some((p) => p.group === group && p.id === id);
  const eye = (left: number) =>
    built.eyes === "happy" ? (
      <View style={{ position: "absolute", left: u(left - 5), top: u(39), width: u(10), height: u(10), borderTopLeftRadius: u(5), borderTopRightRadius: u(5), borderWidth: u(2.4), borderBottomWidth: 0, borderColor: ink }} />
    ) : (
      <View style={{ position: "absolute", left: u(left - 4), top: u(38), width: u(8), height: u(8), borderRadius: u(4), backgroundColor: ink }} />
    );
  const brow = (left: number, side: 1 | -1) => (
    <View style={{ position: "absolute", left: u(left - 6), top: u(built.brows === "arched" ? 29 : 30), width: u(12), height: u(2.6), borderRadius: u(2), backgroundColor: hairInk, transform: built.brows === "arched" ? [{ rotate: `${side * -12}deg` }] : undefined }} />
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: c.surface }}>
      <View style={{ position: "absolute", inset: 0, borderRadius: size / 2, backgroundColor: skin }} />
      {has("clothes", built.clothes) ? (
        <View style={{ position: "absolute", left: u(14), right: u(14), bottom: u(-12), height: u(26), borderTopLeftRadius: u(14), borderTopRightRadius: u(14), backgroundColor: built.clothes === "chapan" ? "#3D5BA9" : violet, borderTopWidth: built.clothes === "chapan" ? u(4) : 0, borderColor: "#E9B949" }} />
      ) : null}
      {has("hijab", built.hijab) ? <View style={{ position: "absolute", inset: 0, borderRadius: size / 2, borderWidth: u(14), borderColor: "#5E6AD2" }} /> : null}
      {has("hair", built.hair) && !has("hijab", built.hijab) ? (
        <>
          <View style={{ position: "absolute", left: u(8), right: u(8), top: u(-6), height: u(32), borderBottomLeftRadius: u(built.hair === "curly" ? 18 : 6), borderBottomRightRadius: u(built.hair === "curly" ? 18 : 6), backgroundColor: hairInk }} />
          {built.hair === "long" ? <><View style={{ position: "absolute", left: 0, top: u(14), width: u(14), height: u(56), backgroundColor: hairInk }} /><View style={{ position: "absolute", right: 0, top: u(14), width: u(14), height: u(56), backgroundColor: hairInk }} /></> : null}
        </>
      ) : null}
      {has("doppi", built.doppi) ? <Icon name="top-hat" size={u(40)} style={{ position: "absolute", left: u(30), top: u(-4) }} /> : null}
      {has("brows", built.brows) ? <>{brow(38, 1)}{brow(62, -1)}</> : null}
      {eye(38)}
      {eye(62)}
      {has("glasses", built.glasses) ? (
        [38, 62].map((x) => <View key={x} style={{ position: "absolute", left: u(x - 9), top: u(33), width: u(18), height: u(built.glasses === "sun" ? 12 : 18), borderRadius: u(built.glasses === "sun" ? 4 : 9), borderWidth: u(2.4), borderColor: ink, backgroundColor: built.glasses === "sun" ? ink : undefined }} />)
      ) : null}
      {has("beard", built.beard) ? (
        built.beard === "full"
          ? <View style={{ position: "absolute", left: u(26), right: u(26), top: u(56), height: u(26), borderBottomLeftRadius: u(14), borderBottomRightRadius: u(14), backgroundColor: hairInk }} />
          : <View style={{ position: "absolute", left: u(30), right: u(30), top: u(60), height: u(18), borderBottomLeftRadius: u(10), borderBottomRightRadius: u(10), backgroundColor: hairInk, opacity: 0.35 }} />
      ) : null}
      {expression === "smile" ? (
        <View style={{ position: "absolute", left: u(41), top: u(54), width: u(18), height: u(9), borderBottomLeftRadius: u(9), borderBottomRightRadius: u(9), borderWidth: u(2.6), borderTopWidth: 0, borderColor: built.beard === "full" ? skin : ink }} />
      ) : (
        <View style={{ position: "absolute", left: u(expression === "focus" ? 45 : 42), top: u(58), width: u(expression === "focus" ? 10 : 16), height: u(3), borderRadius: u(2), backgroundColor: built.beard === "full" ? skin : ink }} />
      )}
    </View>
  );
}
