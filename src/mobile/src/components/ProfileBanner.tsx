import { StyleSheet,View } from "react-native";
import { banners } from "../data/cosmetics";
import type { Profile } from "../lib/store";
import { useCosmeticColor } from "./customize/colors";
import { ProfileMedia } from "./ProfileMedia";
import { Icon,Txt,violet } from "./ui";

/**
 * The band at the top of the profile: a colour or gradient, a catalogue banner (city, lesson scene, Dombi, moving)
 * or the learner's own picture, GIF or video. It fills its parent. No art exists yet, so catalogue banners draw their
 * stand-in: the colour with the picture or the name on it; moving banners stay still until their Rive art lands (Ruling 6).
 */
export function ProfileBanner({ banner, height }: { banner: Profile["banner"]; /** the band's height, to size the stand-in picture and name */ height: number }) {
  const colour = useCosmeticColor();
  if (banner.kind === "media" && banner.uri && banner.mediaType)
    return <ProfileMedia uri={banner.uri} mediaType={banner.mediaType} />;
  const item = banners.find((b) => b.id === banner.id) ?? banners[0];
  const fill = colour(item.color);
  const gradient = item.id === "gradient" ? { experimental_backgroundImage: `linear-gradient(135deg, ${colour("soft")}, ${colour("softLine")})` } : null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill, alignItems: "center", justifyContent: "center" }, gradient]}>
      {banner.kind === "item" && item.picture ? <Icon name={item.picture} size={height * 0.5} /> : null}
      {banner.kind === "item" && item.symbol && !item.picture ? (
        <Txt numberOfLines={1} style={{ fontSize: height * 0.2, lineHeight: height * 0.27, color: violet, fontFamily: "Nunito_900Black", opacity: 0.85 }}>{item.symbol}</Txt>
      ) : null}
    </View>
  );
}
