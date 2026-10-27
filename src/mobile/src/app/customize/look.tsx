import { useState } from "react";
import { View } from "react-native";
import { ChoiceTiles,choicesFrom } from "../../components/customize/ChoiceTiles";
import { lookColors } from "../../components/customize/colors";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { Txt,useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { cardColors,profileColors } from "../../data/cosmetics";
import { useApp,useProfile,type Profile } from "../../lib/store";

/** The preview at the top of "Ranglar va fon": the letter in the profile colour, the name and two numbers on cards. */
function LookPreview({ look }: { look: Profile["look"] }) {
  const d = useDesignScale(), c = useTheme(), { settings, progress: p } = useApp();
  const name = settings.name.trim() || "Siz", colours = lookColors(look, settings.dark);
  const card = (text: string) => (
    <View style={{ flex: 1, height: d(48), justifyContent: "center", paddingHorizontal: d(12), borderRadius: d(14), backgroundColor: colours.card }}>
      <Txt numberOfLines={1} style={{ fontSize: d(15), color: colours.text, fontFamily: "Nunito_900Black" }}>{text}</Txt>
    </View>
  );
  return (
    <View style={{ padding: d(14), gap: d(12), borderRadius: d(20), borderWidth: d(2), borderColor: c.line, backgroundColor: c.bg, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}>
        <View style={{ width: d(44), height: d(44), borderRadius: d(22), backgroundColor: colours.fill, alignItems: "center", justifyContent: "center" }}>
          <Txt style={{ fontSize: d(20), color: "#FFFFFF", fontFamily: "Nunito_900Black" }}>{(name[0] || "?").toUpperCase()}</Txt>
        </View>
        <Txt numberOfLines={1} style={{ flex: 1, fontSize: d(20), color: colours.text, fontFamily: "Nunito_900Black" }}>{name}</Txt>
      </View>
      <View style={{ flexDirection: "row", gap: d(10) }}>
        {card(`${p.streak.count} kun`)}
        {card(`${p.phrases} ibora`)}
      </View>
    </View>
  );
}

/** Ranglar va fon (screen OPgwZ): the profile colour, the card colour and the background behind the Profile tab. */
export default function LookEditor() {
  const d = useDesignScale(), { profile, setProfile, earned } = useProfile();
  const [look, setLook] = useState(profile.look);
  const set = (patch: Partial<Profile["look"]>) => setLook((x) => ({ ...x, ...patch }));
  return (
    <EditorScreen title="Ranglar va fon" onSave={() => setProfile((p) => ({ ...p, look: { ...p.look, color: look.color, cardColor: look.cardColor } }))}>
      <LookPreview look={look} />
      <SectionLabel>PROFIL RANGI</SectionLabel>
      <ChoiceTiles items={choicesFrom(profileColors, earned)} value={look.color} onSelect={(color) => set({ color })} tileHeight={d(48)} />
      <SectionLabel>KARTALAR RANGI</SectionLabel>
      <ChoiceTiles items={choicesFrom(cardColors, earned)} value={look.cardColor} onSelect={(cardColor) => set({ cardColor })} tileHeight={d(48)} />
    </EditorScreen>
  );
}
