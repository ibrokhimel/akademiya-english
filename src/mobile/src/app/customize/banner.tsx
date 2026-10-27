import { useEffect,useState } from "react";
import { Pressable,View } from "react-native";
import { Avatar } from "../../components/Avatar";
import { AvatarFrame } from "../../components/AvatarFrame";
import { ChoiceTiles,choicesFrom } from "../../components/customize/ChoiceTiles";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { useLookColors } from "../../components/customize/colors";
import { useRefusedSheet } from "../../components/MediaRefusedSheet";
import { ProfileBanner } from "../../components/ProfileBanner";
import { ProfileHeader } from "../../components/ProfileHeader";
import { Icon,Txt,useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { bannerGroups,banners } from "../../data/cosmetics";
import { onCropped,pickMedia,removeUnusedProfileFiles,type PickedMedia } from "../../lib/media";
import { useApp,useProfile,type Profile } from "../../lib/store";

/**
 * Banner (screen YaZK1): the preview card, then colours (4 a row) and wide tiles for cities, lesson scenes and Dombi.
 * Scene banners open when their unit is finished. O'ZINGIZNIKI uploads a picture (cropped to the banner strip), GIF or video.
 */
export default function BannerEditor() {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp(), { profile, setProfile, earned } = useProfile();
  const [draft, setDraft] = useState(profile.banner);
  const name = settings.name.trim() || "Siz", look = useLookColors(profile.look);
  const applyMedia = (m: PickedMedia) => setDraft((b) => ({ ...b, kind: "media", uri: m.uri, mediaType: m.mediaType }));
  useEffect(() => onCropped("banner", applyMedia), []);
  const { refuse, sheet } = useRefusedSheet(() => void upload());
  async function upload() {
    const r = await pickMedia({ source: "library", target: "banner", key: "banner" });
    if (r.kind === "refused") refuse("banner");
    if (r.kind === "media") applyMedia(r.media);
  }
  const choose = (group: string) => (id: string) =>
    setDraft({ kind: group === "color" ? "color" : "item", id, uri: null, mediaType: null } as Profile["banner"]);
  const save = () => {
    setProfile({ banner: draft });
    removeUnusedProfileFiles([profile.avatar.uri, draft.uri, profile.look.background.uri]);
  };
  const caption = draft.kind === "media" ? (draft.mediaType === "image" ? "Rasm" : "GIF / video") : banners.find((b) => b.id === draft.id)?.label ?? "";
  return (
    <EditorScreen title="Banner" onSave={save}>
      <ProfileHeader
        compact
        name={name}
        nameColor={profile.nameColor}
        accent={look.name}
        caption={caption}
        banner={<ProfileBanner banner={draft} height={d(84)} />}
        avatar={(size) => <Avatar avatar={profile.avatar} name={name} size={size} dombiOutfit={profile.dombi.outfit} />}
        frame={(size, avatar) => <AvatarFrame id={profile.frame} size={size}>{avatar}</AvatarFrame>}
      />
      {bannerGroups.map((g) => {
        const wide = g.id !== "color";
        return (
          <View key={g.id} style={{ gap: d(12) }}>
            <SectionLabel>{g.label.toUpperCase()}</SectionLabel>
            <ChoiceTiles
              items={choicesFrom(banners.filter((b) => b.group === g.id), earned)}
              value={draft.kind === "media" ? null : draft.id}
              onSelect={choose(g.id)}
              columns={wide ? 2 : 4}
              tileHeight={wide ? d(64) : undefined}
            />
          </View>
        );
      })}
      <SectionLabel>O&apos;ZINGIZNIKI</SectionLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Rasm, GIF yoki video yuklash"
        accessibilityState={{ selected: draft.kind === "media" }}
        onPress={() => void upload()}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: d(10), height: d(72), borderRadius: d(18), borderWidth: d(2), borderColor: c.accent, backgroundColor: c.soft, opacity: pressed ? 0.7 : 1 })}
      >
        <Icon name="glyph-play-violet" size={d(18)} />
        <Txt style={{ fontSize: d(15), color: c.accent, fontFamily: "Nunito_900Black" }}>Rasm, GIF yoki video yuklash</Txt>
      </Pressable>
      <Txt style={{ fontSize: d(12), lineHeight: d(17), color: c.muted }}>GIF va video: 6 soniyagacha, 8 MB gacha. Ovozsiz, takrorlanib turadi.</Txt>
      {sheet}
    </EditorScreen>
  );
}
