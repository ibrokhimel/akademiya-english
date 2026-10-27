import { router,type Href } from "expo-router";
import { useRef } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuditScroll } from "../../audit/layout";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { RowGroup } from "../../components/customize/RowGroup";
import { Avatar } from "../../components/Avatar";
import { AvatarFrame } from "../../components/AvatarFrame";
import { ProfileBanner } from "../../components/ProfileBanner";
import { ProfileHeader } from "../../components/ProfileHeader";
import { useLookColors } from "../../components/customize/colors";
import { ScreenHeader,SettingRow } from "../../components/SettingsControls";
import { useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { banners,dombiItems,frames,profileColors,themes } from "../../data/cosmetics";
import { useBack } from "../../lib/navigation";
import { useApp } from "../../lib/store";

const labelOf = (list: { id: string; label: string }[], id: string | null | undefined, fallback: string) =>
  list.find((x) => x.id === id)?.label ?? fallback;
const avatarKinds = { letter: "Harf", photo: "Rasm", media: "GIF / video", dombi: "Dombi", built: "Yasash", moving: "Harf" } as const;

/** Profilni bezash: the preview card and one row per editor. The editors are separate routes under /customize. */
export default function Customize() {
  const d = useDesignScale(), c = useTheme();
  const scroll = useRef<ScrollView>(null);
  useAuditScroll(scroll);
  const back = useBack("/(tabs)/profile");
  const { settings } = useApp(), p = settings.profile, look = useLookColors(p.look);
  const go = (path: string) => () => router.navigate(path as Href);
  const bannerValue = p.banner.kind === "color" ? "Rang" : p.banner.kind === "item" ? labelOf(banners, p.banner.id, "Rang") : p.banner.mediaType === "image" ? "Rasm" : "GIF / video";
  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Profilni bezash" onBack={back} />
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: d(20), paddingTop: d(4), paddingBottom: d(24), gap: d(10) }}>
        <ProfileHeader compact name={settings.name.trim() || "Siz"} nameColor={p.nameColor} accent={look.name} caption="Ko'rinishini quyida o'zgartiring" avatar={(size) => <Avatar avatar={p.avatar} name={settings.name.trim() || "Siz"} size={size} dombiOutfit={p.dombi.outfit} />} frame={(size, avatar) => <AvatarFrame id={p.frame} size={size}>{avatar}</AvatarFrame>} banner={<ProfileBanner banner={p.banner} height={d(84)} />} />
        <SectionLabel first>PROFIL</SectionLabel>
        <RowGroup>
          <SettingRow icon="glyph-user-grey" label="Avatar" value={avatarKinds[p.avatar.kind]} onPress={go("/customize/avatar")} />
          <SettingRow icon="crown" label="Ramka" value={labelOf(frames, p.frame, "Yo'q")} onPress={go("/customize/frame")} />
          <SettingRow icon="lesson-tashkent" label="Banner" value={bannerValue} onPress={go("/customize/banner")} />
          <SettingRow icon="glyph-message-grey" label="Ism va men haqimda" onPress={go("/customize/about")} />
        </RowGroup>
        <SectionLabel>KO&apos;RINISH</SectionLabel>
        <RowGroup>
          <SettingRow icon="glyph-sparkles-grey" label="Ranglar va fon" value={labelOf(profileColors, p.look.color, "Binafsha")} onPress={go("/customize/look")} />
          <SettingRow icon="glyph-list-grey" label="Nimalar ko'rinsin" onPress={go("/customize/sections")} />
        </RowGroup>
        <SectionLabel>YUTUQLAR</SectionLabel>
        <RowGroup>
          <SettingRow icon="medal-silver" label="Nishonlar" value={`${p.badges.pinned.length} ta`} onPress={go("/customize/badges")} />
          <SettingRow icon="glyph-chart-grey" label="Statistika" onPress={go("/customize/stats")} />
        </RowGroup>
        <SectionLabel>DOMBI</SectionLabel>
        <RowGroup>
          <SettingRow icon="pet-black-happy" label="Dombi" value={labelOf(dombiItems, p.dombi.outfit, "Yo'q")} onPress={go("/customize/dombi")} />
        </RowGroup>
        <SectionLabel>ILOVA</SectionLabel>
        <RowGroup>
          {/* the app theme is not stored yet; until the theme work lands every install is on the first one */}
          <SettingRow icon="glyph-moon-grey" label="Ilova ko'rinishi" value={themes[0].label} onPress={go("/customize/app")} />
          <SettingRow icon="glyph-shield-grey" label="Hisob" onPress={() => router.navigate("/account")} />
        </RowGroup>
      </ScrollView>
    </SafeAreaView>
  );
}
