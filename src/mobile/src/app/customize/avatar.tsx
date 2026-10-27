import { useEffect,useState } from "react";
import { Pressable,View,useWindowDimensions } from "react-native";
import { Avatar } from "../../components/Avatar";
import { Chips } from "../../components/customize/Chips";
import { ChoiceTiles,choicesFrom } from "../../components/customize/ChoiceTiles";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { ProfileMedia } from "../../components/ProfileMedia";
import { Button,Txt,useTheme,violet } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { avatarBackgrounds,avatarColors,expressions } from "../../data/cosmetics";
import { onCropped,pickMedia,remember,removeUnusedProfileFiles,useRecentMedia,type PickedMedia } from "../../lib/media";
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
  const d = useDesignScale(), c = useTheme(), { width } = useWindowDimensions(), { settings } = useApp(), { profile, setProfile, earned } = useProfile();
  const [draft, setDraft] = useState(profile.avatar);
  const [tab, setTab] = useState<Tab>(tabOf(profile.avatar.kind));
  const recent = useRecentMedia();
  const name = settings.name.trim() || "Siz";
  const edit = (patch: Partial<Profile["avatar"]>) => setDraft((a) => ({ ...a, ...patch }));
  const savedFiles = [profile.avatar.uri, profile.banner.uri, profile.look.background.uri];
  const applyMedia = (m: PickedMedia) => {
    edit({ kind: m.mediaType === "image" ? "photo" : "media", uri: m.uri, mediaType: m.mediaType });
    setTab(m.mediaType === "image" ? "photo" : "media");
  };
  const applyUnderLetter = (m: PickedMedia) => edit({ kind: "letter", bg: "own", uri: m.uri, mediaType: m.mediaType });
  // pictures come back from the crop route: as the avatar itself, or under the letter ("O'z rasmim")
  useEffect(() => {
    const off = [
      onCropped("avatar.photo", (m) => { applyMedia(m); remember(m, savedFiles); }),
      onCropped("avatar.bg", (m) => { applyUnderLetter(m); remember(m, savedFiles); }),
    ];
    return () => off.forEach((f) => f());
  });
  const pick = async (source: "library" | "camera", key: "avatar.photo" | "avatar.bg" = "avatar.photo") => {
    const r = await pickMedia({ source, target: "avatar", key });
    if (r.kind === "media") {
      if (key === "avatar.bg") applyUnderLetter(r.media);
      else applyMedia(r.media);
      remember(r.media, savedFiles);
    }
  };
  const save = () => {
    setProfile((p) => ({ ...p, avatar: draft }));
    removeUnusedProfileFiles([draft.uri, profile.banner.uri, profile.look.background.uri]);
  };
  const tile = Math.floor((width - d(40) - d(30)) / 4);
  const chooseTab = (id: Tab) => {
    setTab(id);
    if (id === "letter" || id === "dombi" || id === "built") edit({ kind: id });
  };
  return (
    <EditorScreen title="Avatar" onSave={save}>
      <View style={{ alignItems: "center", paddingVertical: d(6) }}>
        <Avatar avatar={draft} name={name} size={d(130)} dombiOutfit={profile.dombi.outfit} />
      </View>
      <Chips options={tabs} value={tab} onChange={(id) => chooseTab(id as Tab)} />
      {tab === "letter" ? (
        <>
          <SectionLabel>RANG</SectionLabel>
          <ChoiceTiles items={choicesFrom(avatarColors, earned)} value={draft.kind === "letter" ? draft.color : null} onSelect={(id) => edit({ kind: "letter", color: id })} />
          <SectionLabel>FON</SectionLabel>
          <ChoiceTiles
            items={[...choicesFrom(avatarBackgrounds, earned), { id: "own", label: "O'z rasmim", content: <OwnPictureFace uri={draft.bg === "own" ? draft.uri : null} /> }]}
            value={draft.kind === "letter" ? draft.bg : null}
            onSelect={(id) => (id === "own" ? void pick("library", "avatar.bg") : edit({ kind: "letter", bg: id }))}
          />
          <SectionLabel>IFODA</SectionLabel>
          <Chips options={expressions} value={draft.expression} onChange={(id) => edit({ expression: id })} />
        </>
      ) : null}
      {tab === "photo" || tab === "media" ? (
        <>
          <Button label="GALEREYADAN TANLASH" onPress={() => void pick("library")} />
          <Button kind="secondary" label="SURATGA OLISH" onPress={() => void pick("camera")} />
          {recent.length ? (
            <>
              <SectionLabel>OLDINGI RASMLARIM</SectionLabel>
              <View style={{ flexDirection: "row", gap: d(10) }}>
                {recent.map((m) => {
                  const on = (draft.kind === "photo" || draft.kind === "media") && draft.uri === m.uri;
                  return (
                    <Pressable
                      key={m.uri}
                      accessibilityRole="radio"
                      accessibilityLabel={m.mediaType === "image" ? "Rasm" : m.mediaType === "gif" ? "GIF" : "Video"}
                      accessibilityState={{ selected: on }}
                      onPress={() => applyMedia(m)}
                      style={{ width: tile, height: tile, borderRadius: tile / 2, overflow: "hidden", borderWidth: d(on ? 3 : 2), borderColor: on ? violet : c.line, backgroundColor: c.surface }}
                    >
                      <ProfileMedia uri={m.uri} mediaType={m.mediaType} still />
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
          <Txt style={{ fontSize: d(12), lineHeight: d(17), color: c.muted }}>Rasm: JPG yoki PNG. GIF va video: 6 soniyagacha, 8 MB gacha, ovozsiz takrorlanadi.</Txt>
        </>
      ) : null}
    </EditorScreen>
  );
}

/** The "O'z rasmim" tile: a plus until a picture is chosen, then that picture. */
function OwnPictureFace({ uri }: { uri: string | null }) {
  const d = useDesignScale();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {uri ? <ProfileMedia uri={uri} mediaType="image" still /> : <Txt style={{ fontSize: d(24), color: violet, fontFamily: "Nunito_900Black" }}>+</Txt>}
    </View>
  );
}
