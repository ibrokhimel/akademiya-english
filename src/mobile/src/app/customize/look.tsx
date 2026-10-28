import { useEffect,useState } from "react";
import { View } from "react-native";
import { ChoiceTiles,choicesFrom,type Choice } from "../../components/customize/ChoiceTiles";
import { contrastRatio } from "../../../../core/showcase.js";
import { useLookColors } from "../../components/customize/colors";
import { DimSlider } from "../../components/customize/DimSlider";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { useRefusedSheet } from "../../components/MediaRefusedSheet";
import { ProfileBackground } from "../../components/ProfileBackground";
import { shared } from "../../components/system";
import { Txt,useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { backgrounds,cardColors,profileColors } from "../../data/cosmetics";
import { onCropped,pickMedia,removeUnusedProfileFiles,type PickedMedia } from "../../lib/media";
import { useApp,useProfile,type Profile } from "../../lib/store";

/** The preview at the top of "Ranglar va fon": the letter in the profile colour, the name and two numbers on cards. */
function LookPreview({ look }: { look: Profile["look"] }) {
  const d = useDesignScale(), c = useTheme(), { settings, progress: p } = useApp();
  const name = settings.name.trim() || "Siz", colours = useLookColors(look);
  // the letter in white or ink, whichever reads better on the profile colour (white on gold does not)
  const letterInk = contrastRatio(shared.light.surface, colours.fill) >= contrastRatio(shared.light.ink, colours.fill) ? shared.light.surface : shared.light.ink;
  const card = (text: string) => (
    <View style={{ flex: 1, height: d(48), justifyContent: "center", paddingHorizontal: d(12), borderRadius: d(14), backgroundColor: colours.card }}>
      <Txt numberOfLines={1} style={{ fontSize: d(15), color: colours.text, fontFamily: "Nunito_900Black" }}>{text}</Txt>
    </View>
  );
  return (
    <View style={{ padding: d(14), gap: d(12), borderRadius: d(20), borderWidth: d(2), borderColor: c.line, backgroundColor: c.bg, overflow: "hidden" }}>
      <ProfileBackground background={look.background} dim={look.dim} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}>
        <View style={{ width: d(44), height: d(44), borderRadius: d(22), backgroundColor: colours.fill, alignItems: "center", justifyContent: "center" }}>
          <Txt style={{ fontSize: d(20), color: letterInk, fontFamily: "Nunito_900Black" }}>{(name[0] || "?").toUpperCase()}</Txt>
        </View>
        <Txt numberOfLines={1} style={{ flex: 1, fontSize: d(20), color: colours.name ?? c.text, fontFamily: "Nunito_900Black" }}>{name}</Txt>
      </View>
      <View style={{ flexDirection: "row", gap: d(10) }}>
        {card(`${p.streak.count} kun`)}
        {card(`${p.phrases} ibora`)}
      </View>
    </View>
  );
}

/**
 * Ranglar va fon (screen OPgwZ): the profile colour, the card colour, the background behind the Profile tab (colour,
 * pattern, or the learner's own picture, GIF or video on the same path and limits as the banner) and FON XIRALIGI.
 */
export default function LookEditor() {
  const d = useDesignScale(), c = useTheme(), { profile, setProfile, earned } = useProfile();
  const [look, setLook] = useState(profile.look);
  const set = (patch: Partial<Profile["look"]>) => setLook((x) => ({ ...x, ...patch }));
  const applyMedia = (m: PickedMedia) => setLook((x) => ({ ...x, background: { kind: "media", id: x.background.id, uri: m.uri, mediaType: m.mediaType } }));
  useEffect(() => onCropped("background", applyMedia), []);
  const { refuse, sheet } = useRefusedSheet(() => void upload());
  async function upload() {
    const r = await pickMedia({ source: "library", target: "background", key: "background" });
    if (r.kind === "refused") refuse("background");
    if (r.kind === "media") applyMedia(r.media);
  }
  const own: Choice = { id: "own", label: "O'z rasmim, GIF yoki video", content: <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Txt style={{ fontSize: d(24), color: c.accentText, fontFamily: "Nunito_900Black" }}>+</Txt></View> };
  const pickBackground = (id: string) => {
    if (id === "own") { void upload(); return; }
    // colours are kind "color"; the pattern and city stand-ins are catalogue items
    const item = backgrounds.find((b) => b.id === id);
    set({ background: { kind: item?.symbol ? "item" : "color", id, uri: null, mediaType: null } });
  };
  const save = () => {
    setProfile((p) => ({ ...p, look: { ...p.look, color: look.color, cardColor: look.cardColor, background: look.background, dim: look.dim } }));
    removeUnusedProfileFiles([profile.avatar.uri, profile.banner.uri, look.background.kind === "media" ? look.background.uri : null]);
  };
  return (
    <EditorScreen title="Ranglar va fon" onSave={save}>
      <LookPreview look={look} />
      <SectionLabel>PROFIL RANGI</SectionLabel>
      <ChoiceTiles items={choicesFrom(profileColors, earned)} value={look.color} onSelect={(color) => set({ color })} tileHeight={d(48)} />
      <SectionLabel>KARTALAR RANGI</SectionLabel>
      <ChoiceTiles items={choicesFrom(cardColors, earned)} value={look.cardColor} onSelect={(cardColor) => set({ cardColor })} tileHeight={d(48)} />
      <SectionLabel>FON</SectionLabel>
      <ChoiceTiles items={[...choicesFrom(backgrounds, earned), own]} value={look.background.kind === "media" ? "own" : look.background.id} onSelect={pickBackground} />
      <SectionLabel>FON XIRALIGI</SectionLabel>
      <DimSlider value={look.dim} onChange={(dim) => set({ dim })} />
      {sheet}
    </EditorScreen>
  );
}
