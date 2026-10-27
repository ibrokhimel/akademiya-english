import { useState } from "react";
import { Pressable,View } from "react-native";
import { moveTo,rarestBadge,shelfOrder,togglePin } from "../../../../core/showcase.js";
import { PinnedTiles,TrophyShelf,useBadges } from "../../components/Badges";
import { Chips } from "../../components/customize/Chips";
import { onAccent } from "../../components/customize/colors";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { RowGroup } from "../../components/customize/RowGroup";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { ToggleRow } from "../../components/customize/ToggleRow";
import { Icon,Txt,useTheme,violet } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import type { Badge } from "../../data/awards";
import { sound } from "../../lib/audio";
import { shortDate } from "../../lib/progressExtras";
import { useApp,useProfile } from "../../lib/store";

const STYLES = [{ id: "grid", label: "Panjara" }, { id: "row", label: "Qator" }, { id: "shelf", label: "Javon" }] as const;

/** One line of BARCHA NISHONLAR: picture, name, when it was won (or the goal), and the pin pill or a lock. */
function BadgeRow({ b, pinned, full, onPin }: { b: Badge; pinned: boolean; full: boolean; onPin: () => void }) {
  const d = useDesignScale(), c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), paddingHorizontal: d(14), paddingVertical: d(10), minHeight: d(60) }}>
      <View style={{ opacity: b.earned ? 1 : 0.45, filter: b.earned ? undefined : [{ grayscale: 1 }] }}><Icon name={b.icon} size={d(32)} /></View>
      <View style={{ flex: 1, gap: d(2) }}>
        <Txt style={{ fontSize: d(16), fontFamily: "Nunito_900Black", color: b.earned ? c.text : c.muted }}>{b.title}</Txt>
        <Txt style={{ fontSize: d(12), color: c.muted }}>{b.earned ? (b.at ? `Qo'lga kiritildi · ${shortDate(b.at)}` : "Qo'lga kiritildi") : b.hint}</Txt>
      </View>
      {b.earned ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${b.title}: ${pinned ? "QADALGAN" : "QADASH"}`}
          accessibilityState={{ selected: pinned, disabled: !pinned && full }}
          disabled={!pinned && full}
          onPress={onPin}
          style={{ paddingHorizontal: d(12), paddingVertical: d(6), borderRadius: d(99), borderWidth: d(2), borderColor: violet, backgroundColor: pinned ? violet : c.card, opacity: !pinned && full ? 0.4 : 1 }}
        >
          <Txt style={{ fontSize: d(12), letterSpacing: d(.4), fontFamily: "Nunito_900Black", color: pinned ? onAccent : violet }}>{pinned ? "QADALGAN" : "QADASH"}</Txt>
        </Pressable>
      ) : <Icon name="glyph-lock-grey" size={d(20)} />}
    </View>
  );
}

/**
 * Nishonlar (screen E7QQz): pin up to 3 earned badges, the awards' look on the Profile tab, the trophy shelf order
 * (long press a trophy, then tap the place for it) and the rarest-badge spotlight.
 */
export default function BadgesEditor() {
  const { settings } = useApp(), { profile, setProfile } = useProfile(), { badges } = useBadges();
  const earned = badges.filter((b) => b.earned);
  const [pinned, setPinned] = useState(profile.badges.pinned.filter((id) => earned.some((b) => b.id === id)));
  const [style, setStyle] = useState(profile.badges.style);
  const trophies = badges.filter((b) => b.trophy);
  const [order, setOrder] = useState(() => shelfOrder(profile.badges.shelfOrder, trophies.map((t) => t.id)));
  const [lifted, setLifted] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState(profile.badges.spotlightRarest);
  const rarest = badges.find((b) => b.id === rarestBadge(badges));
  const pin = (id: string) => { sound("pick", settings.sound); setPinned((list) => togglePin(list, id)); };
  return (
    <EditorScreen title="Nishonlar" onSave={() => setProfile((p) => ({ ...p, badges: { pinned, style, shelfOrder: order, spotlightRarest: spotlight } }))}>
      <SectionLabel first>PROFILDA KO&apos;RINADI · 3 TA</SectionLabel>
      <PinnedTiles badges={pinned.map((id) => badges.find((b) => b.id === id)!).filter(Boolean)} empty={3 - pinned.length} onPress={pin} />
      <SectionLabel>KO&apos;RINISHI</SectionLabel>
      <Chips options={STYLES.map((s) => ({ id: s.id, label: s.label }))} value={style} onChange={(id) => setStyle(id as typeof style)} />
      <SectionLabel>BARCHA NISHONLAR</SectionLabel>
      <RowGroup>
        {badges.map((b) => <BadgeRow key={b.id} b={b} pinned={pinned.includes(b.id)} full={pinned.length >= 3} onPin={() => pin(b.id)} />)}
      </RowGroup>
      <SectionLabel>KUBOKLAR JAVONI</SectionLabel>
      <TrophyShelf
        trophies={trophies}
        order={order}
        lifted={lifted}
        onLongPress={(id) => { sound("pick", settings.sound); setLifted(id); }}
        onPress={(id, index) => {
          if (!lifted) return;
          if (id !== lifted) setOrder((list) => moveTo(list, lifted, index));
          setLifted(null);
        }}
      />
      <RowGroup>
        <ToggleRow icon="crown" label="Eng nodir nishonni ajratib ko'rsatish" detail={rarest ? `Hozir: ${rarest.title}` : undefined} value={spotlight} onChange={setSpotlight} />
      </RowGroup>
    </EditorScreen>
  );
}
