import { useMemo } from "react";
import { Pressable,ScrollView,View } from "react-native";
import { shelfOrder,shows } from "../../../core/showcase.js";
import { awardsOf,badgesOf,type Award,type Badge } from "../data/awards";
import { testToolsEnabled } from "../lib/config";
import { profileFacts } from "../lib/progressExtras";
import { useApp } from "../lib/store";
import { useCosmeticColor } from "./customize/colors";
import { Effect } from "./Effects";
import { gold,Icon,Txt,useTheme,violet } from "./ui";
import { useDesignScale } from "./useDesignScale";

/** The awards (MUKOFOTLAR) and every badge a learner can pin, with theme colours worked out. Friend awards stay in test builds. */
export function useBadges() {
  const { events, progress: p } = useApp(), colour = useCosmeticColor();
  const awards = useMemo(() => awardsOf(profileFacts(events), p.level).filter((a) => testToolsEnabled || !a.testOnly), [events, p.level]);
  const badges = useMemo(() => badgesOf(awards, p.done), [awards, p.done]);
  const paint = <T extends Award>(a: T): T => ({ ...a, color: colour(a.color), soft: colour(a.soft) });
  return { awards: awards.map(paint), badges: badges.map(paint) };
}

/** One award as on the Profile tab: ring, picture, count pill, YANGI for two days, a twinkle once earned. */
export function AwardTile({ a, index, spotlight = false, hideNumbers = false }: { a: Award; index: number; spotlight?: boolean; hideNumbers?: boolean }) {
  const d = useDesignScale(), c = useTheme();
  return (
    <View style={{ width: d(110), alignItems: "center", gap: d(4) }}>
      <View style={{ width: d(100), height: d(104) }}>
        <View style={{ position: "absolute", left: d(8), top: d(6), width: d(84), height: d(84), borderRadius: d(28), borderWidth: d(3), borderColor: spotlight ? gold : a.value ? a.color : c.line, backgroundColor: a.value ? a.soft : c.surface }} />
        <View style={{ position: "absolute", left: d(20), top: d(12), filter: a.value ? undefined : [{ grayscale: 1 }], opacity: a.value ? 1 : .45 }}><Icon name={a.icon} size={d(60)} /></View>
        {hideNumbers ? null : <View style={{ position: "absolute", left: 0, right: 0, top: d(76), alignItems: "center" }}><Txt style={{ paddingHorizontal: d(10), paddingVertical: d(2), borderRadius: d(99), borderWidth: d(3), borderColor: c.card, backgroundColor: a.value ? a.color : c.edge, color: "#FFFFFF", fontSize: d(14), lineHeight: d(16.8), fontFamily: "Nunito_900Black" }}>{a.value}</Txt></View>}
        {a.value > 0 && a.at && new Date().getTime() - +new Date(a.at) < 172800000 ? <Txt style={{ position: "absolute", left: d(58), top: 0, fontSize: d(10), lineHeight: d(12), letterSpacing: d(.4), fontFamily: "Nunito_900Black", color: "#FFFFFF", backgroundColor: "#FF4B5C", borderRadius: d(8), borderWidth: d(2), borderColor: c.card, paddingHorizontal: d(7), paddingVertical: d(3) }}>YANGI</Txt> : null}
        {spotlight ? <Icon name="sparkles" size={d(28)} style={{ position: "absolute", left: 0, top: d(-4) }} /> : null}
        {a.value > 0 ? <Effect board="Twinkle" delay={index * 380} repeat={8400} style={{ position: "absolute", left: d(-25), top: d(-14), width: d(150), height: d(125) }} /> : null}
      </View>
      <Txt style={{ textAlign: "center", fontSize: d(14), fontFamily: "Nunito_900Black" }}>{a.title}</Txt>
      {hideNumbers ? null : <Txt style={{ fontSize: d(12), fontFamily: "Nunito_800ExtraBold", color: c.muted }}>{Math.min(a.value, a.goal)} / {a.goal}</Txt>}
    </View>
  );
}

/**
 * MUKOFOTLAR in the style the learner picked: grid (as before), row (one line that scrolls sideways) or shelf (rows of three on a ledge).
 * With the spotlight on, the rarest earned award comes first with a gold ring.
 */
export function AwardsSection({ awards, style, spotlightId, hideNumbers = false }: { awards: Award[]; style: "grid" | "row" | "shelf"; spotlightId: string | null; hideNumbers?: boolean }) {
  const d = useDesignScale(), c = useTheme();
  const list = spotlightId && awards.some((a) => a.id === spotlightId) ? [awards.find((a) => a.id === spotlightId)!, ...awards.filter((a) => a.id !== spotlightId)] : awards;
  const tiles = list.map((a, i) => <AwardTile key={a.id} a={a} index={i} spotlight={a.id === spotlightId} hideNumbers={hideNumbers} />);
  if (style === "row") return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: d(-20) }} contentContainerStyle={{ paddingHorizontal: d(20), gap: d(10) }}>{tiles}</ScrollView>;
  if (style === "shelf") {
    const rows = Array.from({ length: Math.ceil(tiles.length / 3) }, (_, i) => tiles.slice(i * 3, i * 3 + 3));
    return (
      <View style={{ gap: d(18) }}>
        {rows.map((row, i) => (
          <View key={i}>
            <View style={{ flexDirection: "row", columnGap: d(10) }}>{row}</View>
            <View style={{ height: d(10), marginTop: d(4), borderRadius: d(5), backgroundColor: c.orangeBand }} />
          </View>
        ))}
      </View>
    );
  }
  return <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: d(10), rowGap: d(18) }}>{tiles}</View>;
}

/** The pinned badges under the tags on the Profile tab (screen RnkvP), and the same tiles in the badge editor. */
export function PinnedTiles({ badges, empty = 0, onPress }: { badges: Badge[]; /** "Bo'sh joy" tiles after the badges (editor) */ empty?: number; onPress?: (id: string) => void }) {
  const d = useDesignScale(), c = useTheme();
  const tile = { flex: 1, height: d(96), borderRadius: d(18), alignItems: "center", justifyContent: "center", gap: d(6), paddingHorizontal: d(6) } as const;
  return (
    <View style={{ flexDirection: "row", gap: d(10) }}>
      {badges.map((b) => (
        <Pressable key={b.id} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={b.title} onPress={() => onPress?.(b.id)} style={{ ...tile, backgroundColor: c.soft, borderWidth: d(onPress ? 2 : 0), borderColor: violet }}>
          <Icon name={b.icon} size={d(36)} />
          <Txt numberOfLines={1} style={{ fontSize: d(12), fontFamily: "Nunito_900Black", color: violet }}>{b.title}</Txt>
        </Pressable>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <View key={`empty${i}`} style={{ ...tile, borderWidth: d(2), borderColor: c.line }}>
          <Txt style={{ fontSize: d(22), lineHeight: d(24), color: c.muted, fontFamily: "Nunito_900Black" }}>+</Txt>
          <Txt style={{ fontSize: d(12), fontFamily: "Nunito_800ExtraBold", color: c.muted }}>Bo&apos;sh joy</Txt>
        </View>
      ))}
    </View>
  );
}

/**
 * KUBOKLAR JAVONI: the checkpoint trophies in the learner's order, the ones not won yet faded.
 * In the editor a long press lifts a trophy and a tap on another place puts it there.
 */
export function TrophyShelf({ trophies, order, lifted, onLongPress, onPress }: {
  trophies: Badge[];
  order: string[];
  lifted?: string | null;
  onLongPress?: (id: string) => void;
  onPress?: (id: string, index: number) => void;
}) {
  const d = useDesignScale(), c = useTheme();
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const ordered = shelfOrder(order, trophies.map((t) => t.id)).map((id) => byId.get(id)!);
  const editing = !!onLongPress;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(16), borderRadius: d(20), backgroundColor: c.goldSoft }}>
      <View style={{ flexDirection: "row", gap: d(8), flexShrink: 0 }}>
        {ordered.map((t, i) => (
          <Pressable
            key={t.id}
            disabled={!editing}
            accessibilityRole={editing ? "button" : undefined}
            accessibilityLabel={t.title}
            accessibilityState={{ selected: lifted === t.id }}
            onLongPress={() => onLongPress?.(t.id)}
            onPress={() => onPress?.(t.id, i)}
            style={{ padding: d(4), borderRadius: d(14), borderWidth: d(2), borderColor: lifted === t.id ? violet : "transparent", transform: [{ scale: lifted === t.id ? 1.12 : 1 }], opacity: t.earned ? 1 : 0.4 }}
          >
            <Icon name={t.icon} size={d(44)} />
          </Pressable>
        ))}
      </View>
      {editing ? <Txt style={{ flex: 1, textAlign: "right", fontSize: d(13), lineHeight: d(17), fontFamily: "Nunito_900Black", color: c.goldText }}>Bosib turib, joyini o&apos;zgartiring</Txt> : null}
    </View>
  );
}

/** The Profile tab's pinned row: the learner's pinned badges they still hold, nothing when none (or the part is hidden). */
export function ProfilePinned() {
  const { settings } = useApp(), { badges } = useBadges(), p = settings.profile;
  if (!shows(p, "pinnedBadges")) return null;
  const list = p.badges.pinned.map((id) => badges.find((b) => b.id === id && b.earned)).filter((b): b is Badge => !!b);
  return list.length ? <PinnedTiles badges={list} /> : null;
}
