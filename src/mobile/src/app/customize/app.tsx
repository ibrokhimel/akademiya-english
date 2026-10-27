import { useEffect,useState } from "react";
import { View } from "react-native";
import { MODES,TEXT_SIZES } from "../../../../core/look.js";
import { Chips } from "../../components/customize/Chips";
import { ChoiceTiles,choicesFrom,type Choice } from "../../components/customize/ChoiceTiles";
import { swatchColor } from "../../components/customize/colors";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { RowGroup } from "../../components/customize/RowGroup";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { ToggleRow } from "../../components/customize/ToggleRow";
import { Icon,Txt,useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { appIcons,lessonBackgrounds,pathSkins,themes,type Cosmetic } from "../../data/cosmetics";
import { applyAppIcon } from "../../lib/appIcon";
import { onCropped,pickMedia,removeUnusedProfileFiles,type PickedMedia } from "../../lib/media";
import { useApp,useProfile,type AppLook,type Settings } from "../../lib/store";

const MODE_LABELS: Record<Settings["mode"], string> = { light: "Yorug'", dark: "Qorong'i", system: "Telefondagidek" };
const SIZE_LABELS: Record<AppLook["textSize"], string> = { small: "Kichik", medium: "O'rta", large: "Katta", huge: "Juda katta" };

/** A theme or icon tile: its swatch as on the screen (the same in light and dark), with the icon's picture on it. */
function Swatch({ item }: { item: Cosmetic }) {
  const d = useDesignScale();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: swatchColor(item.color) }}>
      {item.picture ? <Icon name={item.picture} size={d(40)} /> : null}
    </View>
  );
}

/**
 * Ilova ko'rinishi (screen lAk24): MAVZU (the colour theme), REJIM (light, dark, like the phone), ILOVA BELGISI (the app
 * icon), DARS FONI (behind the lesson's exercises; own picture through the crop route), YO'L KO'RINISHI (stored; the
 * course map has no skins yet), MATN O'LCHAMI, the dyslexia font and the tab bar names. Nothing changes until SAQLASH.
 */
export default function AppLookEditor() {
  const d = useDesignScale(), c = useTheme(), { settings, set } = useApp(), { profile } = useProfile();
  const [mode, setMode] = useState(settings.mode);
  const [look, setLook] = useState(settings.appLook);
  const patch = (p: Partial<AppLook>) => setLook((x) => ({ ...x, ...p }));
  const applyPicture = (m: PickedMedia) => setLook((x) => ({ ...x, lessonBackground: { kind: "media", id: "plain", uri: m.uri } }));
  useEffect(() => onCropped("lessonBackground", applyPicture), []);
  const pickBackground = (id: string) => {
    if (id === "own") { void pickMedia({ source: "library", target: "background", key: "lessonBackground", imagesOnly: true }).then((r) => { if (r.kind === "media") applyPicture(r.media); }); return; }
    patch({ lessonBackground: { kind: "item", id, uri: null } });
  };
  const tiles = (list: Cosmetic[]): Choice[] => list.map((x) => ({ id: x.id, label: x.label, content: <Swatch item={x} /> }));
  const own: Choice = { id: "own", label: "O'z rasmim", content: <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Txt style={{ fontSize: d(24), color: c.accentText, fontFamily: "Nunito_900Black" }}>+</Txt></View> };
  const save = () => {
    set({ mode, appLook: look });
    if (look.icon !== settings.appLook.icon) void applyAppIcon(look.icon);
    removeUnusedProfileFiles([profile.avatar.uri, profile.banner.uri, profile.look.background.uri, look.lessonBackground.uri]);
  };
  return (
    <EditorScreen title="Ilova ko'rinishi" onSave={save}>
      <SectionLabel first>MAVZU</SectionLabel>
      <ChoiceTiles items={tiles(themes)} value={look.theme} onSelect={(theme) => patch({ theme })} columns={6} />
      <SectionLabel>REJIM</SectionLabel>
      <Chips options={MODES.map((id) => ({ id, label: MODE_LABELS[id as Settings["mode"]] }))} value={mode} onChange={(id) => setMode(id as Settings["mode"])} />
      <SectionLabel>ILOVA BELGISI</SectionLabel>
      <ChoiceTiles items={tiles(appIcons)} value={look.icon} onSelect={(icon) => patch({ icon })} />
      <SectionLabel>DARS FONI</SectionLabel>
      <ChoiceTiles items={[...choicesFrom(lessonBackgrounds, new Set()), own]} value={look.lessonBackground.kind === "media" ? "own" : look.lessonBackground.id} onSelect={pickBackground} />
      <SectionLabel>YO&apos;L KO&apos;RINISHI</SectionLabel>
      <Chips options={pathSkins} value={look.pathSkin} onChange={(pathSkin) => patch({ pathSkin })} />
      <SectionLabel>MATN O&apos;LCHAMI</SectionLabel>
      <Chips options={TEXT_SIZES.map((s) => ({ id: s.id, label: SIZE_LABELS[s.id as AppLook["textSize"]] }))} value={look.textSize} onChange={(id) => patch({ textSize: id as AppLook["textSize"] })} />
      <RowGroup>
        <ToggleRow icon="notepad" label="Disleksiya uchun shrift" value={look.dyslexiaFont} onChange={(dyslexiaFont) => patch({ dyslexiaFont })} dimWhenOff />
        <ToggleRow icon="glyph-list-grey" label="Menyuda yozuvlar" detail="Pastki menyuda belgilar ostida nom" value={look.tabLabels} onChange={(tabLabels) => patch({ tabLabels })} dimWhenOff />
      </RowGroup>
    </EditorScreen>
  );
}
