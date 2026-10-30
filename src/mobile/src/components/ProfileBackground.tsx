import { memo } from "react";
import { StyleSheet,View } from "react-native";
import { backgrounds,type Cosmetic } from "../data/cosmetics";
import type { Profile } from "../lib/store";
import { useCosmeticColor } from "./customize/colors";
import { ProfileMedia } from "./ProfileMedia";
import { Txt,useTheme,violet } from "./ui";

/**
 * Behind the whole Profile tab (screen OPgwZ "Fon"): nothing for "Oddiy" (the page itself), a colour, a catalogue
 * background (no art yet: its colour with the symbol as a pattern stand-in, Ruling 2) or the learner's own picture, GIF or
 * video (a still phone shows the first frame, as everywhere ProfileMedia is used). `dim` (FON XIRALIGI, 0 to 0.8) lays a
 * veil in the page colour over it, so the tab's text keeps reading on any picture in light and dark.
 * It fills its parent and takes no touches. `items` is the catalogue the id comes from (the lesson backgrounds use it too).
 */
export function ProfileBackground({ background, dim, items = backgrounds }: { background: Profile["look"]["background"]; dim: number; items?: Cosmetic[] }) {
  const c = useTheme(), colour = useCosmeticColor();
  const media = background.kind === "media" && background.uri && background.mediaType ? background : null;
  if (!media && background.id === "plain") return null;
  const item = items.find((b) => b.id === background.id) ?? items[0];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {media ? <ProfileMedia uri={media.uri!} mediaType={media.mediaType} /> : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colour(item.color), overflow: "hidden" }]}>
          {item.symbol ? <Pattern symbol={item.symbol} /> : null}
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, opacity: dim }]} />
    </View>
  );
}

/** The stand-in pattern: a short symbol repeated in rows, a name written large and pale. Memoised: the dim slider redraws the veil only. */
const Pattern = memo(function Pattern({ symbol }: { symbol: string }) {
  if (symbol.length > 3)
    return <Txt fixed numberOfLines={1} style={{ position: "absolute", top: "18%", alignSelf: "center", fontSize: 64, color: violet, opacity: 0.18, fontFamily: "Nunito_900Black" }}>{symbol}</Txt>;
  return (
    <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", gap: 28, padding: 18, opacity: 0.22 }}>
      {Array.from({ length: 120 }, (_, i) => <Txt fixed key={i} style={{ fontSize: 20, color: violet, fontFamily: "Nunito_900Black" }}>{symbol}</Txt>)}
    </View>
  );
});
