import { useState } from "react";
import { View } from "react-native";
import { Avatar } from "../../components/Avatar";
import { Chips } from "../../components/customize/Chips";
import { ChoiceTiles,choicesFrom } from "../../components/customize/ChoiceTiles";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { useDesignScale } from "../../components/useDesignScale";
import { avatarBackgrounds,avatarColors,expressions } from "../../data/cosmetics";
import { useApp,useProfile,type Profile } from "../../lib/store";

type Tab = "letter" | "photo" | "media" | "dombi" | "built";
const tabs: { id: Tab; label: string }[] = [
  { id: "letter", label: "Harf" },
  { id: "photo", label: "Rasm" },
  { id: "media", label: "GIF / video" },
  { id: "dombi", label: "Dombi" },
  { id: "built", label: "Yasash" },
];
const tabOf = (kind: Profile["avatar"]["kind"]): Tab => (kind === "moving" ? "letter" : kind);

/** Avatar (screens cIJCI, poYrz, ZpeR2): the chips switch the body; every change goes to a draft that SAQLASH writes. */
export default function AvatarEditor() {
  const d = useDesignScale(), { settings } = useApp(), { profile, setProfile, earned } = useProfile();
  const [draft, setDraft] = useState(profile.avatar);
  const [tab, setTab] = useState<Tab>(tabOf(profile.avatar.kind));
  const name = settings.name.trim() || "Siz";
  const edit = (patch: Partial<Profile["avatar"]>) => setDraft((a) => ({ ...a, ...patch }));
  const chooseTab = (id: Tab) => {
    setTab(id);
    if (id === "letter" || id === "dombi" || id === "built") edit({ kind: id });
  };
  return (
    <EditorScreen title="Avatar" onSave={() => setProfile((p) => ({ ...p, avatar: draft }))}>
      <View style={{ alignItems: "center", paddingVertical: d(6) }}>
        <Avatar avatar={draft} name={name} size={d(130)} dombiOutfit={profile.dombi.outfit} />
      </View>
      <Chips options={tabs} value={tab} onChange={(id) => chooseTab(id as Tab)} />
      {tab === "letter" ? (
        <>
          <SectionLabel>RANG</SectionLabel>
          <ChoiceTiles items={choicesFrom(avatarColors, earned)} value={draft.kind === "letter" ? draft.color : null} onSelect={(id) => edit({ kind: "letter", color: id })} />
          <SectionLabel>FON</SectionLabel>
          <ChoiceTiles items={choicesFrom(avatarBackgrounds, earned)} value={draft.kind === "letter" ? draft.bg : null} onSelect={(id) => edit({ kind: "letter", bg: id })} />
          <SectionLabel>IFODA</SectionLabel>
          <Chips options={expressions} value={draft.expression} onChange={(id) => edit({ expression: id })} />
        </>
      ) : null}
    </EditorScreen>
  );
}
