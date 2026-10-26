import { router } from "expo-router";
import { Pressable, View, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useDombiLevel } from "../lib/dombiLevel";
import { useApp } from "../lib/store";
import { useActorFile } from "./Actor";
import { Effect } from "./Effects";
import { Dombi, type DombiMoment } from "./Dombi";
import { Bounce, Count } from "./Motion";
import { shared, type } from "./system";
import { Icon, Txt } from "./ui";

/** Light or dark design-system colours, following the "Tungi rejim" setting. */
export function useDs() {
  const { settings } = useApp();
  return settings.dark ? shared.dark : shared.light;
}

function useScale() {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2);
  return (n: number) => n * scale;
}

/** "Tab header" (Pencil L10x6): the tab's title, then the streak and phrases pills. */
export function TabHeader({ title }: { title: string }) {
  const d = useScale(), ds = useDs(), { progress: p } = useApp();
  const pill = (icon: string, value: number, color: string, to: "/calendar" | "/phrases") => (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate(to)}
      style={{ flexDirection: "row", alignItems: "center", gap: d(6), backgroundColor: ds.paper, borderRadius: d(14), paddingVertical: d(6), paddingHorizontal: d(12) }}
    >
      {icon === "flame-streak" ? <StreakFlame lit={p.streak.today} size={d(18)} /> : <Icon name={icon} size={d(18)} />}
      <Bounce change={String(value)}>
        <Count value={value} style={{ ...type("body", d), fontFamily: "Nunito_900Black", color }} />
      </Bounce>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: d(12), paddingHorizontal: d(20) }}>
      <Txt style={{ ...type("title", d), color: ds.ink }}>{title}</Txt>
      <View style={{ flexDirection: "row", gap: d(8) }}>
        {pill("flame-streak", p.streak.count, ds.rewardText, "/calendar")}
        {pill("bubble-phrases", p.phrases, shared.app.english.main, "/phrases")}
      </View>
    </View>
  );
}

/** "Dombi overlay" (Pencil IdIvY / S9cqrF): Dombi at 80 in the bottom-right corner, with an optional bubble. */
export function DombiOverlay({ moment, line, bottom = 8, onPress }: { moment: DombiMoment; line?: string; bottom?: number; onPress?: () => void }) {
  const d = useScale(), ds = useDs();
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", right: d(16), bottom: d(bottom), flexDirection: "row", alignItems: "flex-end", gap: d(4) }}>
      {line ? (
        <View style={{ paddingBottom: d(24) }}>
          <View style={{ width: d(210), backgroundColor: ds.surface, borderColor: ds.line, borderWidth: 2, borderRadius: d(18), borderBottomRightRadius: d(4), paddingVertical: d(10), paddingHorizontal: d(14), boxShadow: `0 ${d(3)}px 0 ${ds.line}` }}>
            <Txt style={{ ...type("small", d), color: ds.ink }}>{line}</Txt>
          </View>
        </View>
      ) : null}
      <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={onPress ? "Dombi" : undefined}>
        <Dombi moment={moment} size={d(80)} />
      </Pressable>
    </View>
  );
}

/** The streak flame burns (Rive "Streak Flame") once today's lesson is done; grey until then. */
function StreakFlame({ lit, size }: { lit: boolean; size: number }) {
  const file = useActorFile(), reduced = useReducedMotion(), still = useDombiLevel() === "still";
  return (
    <View style={{ width: size, height: size }}>
      {file && !reduced && !still
        ? <Effect board="Streak Flame" lit={lit} trigger={null} style={{ position: "absolute", left: 0, top: -size * 0.25, width: size, height: size * 1.27 }} />
        : <View style={{ filter: lit ? undefined : [{ grayscale: 1 }], opacity: lit ? 1 : 0.45 }}><Icon name="flame-streak" size={size} /></View>}
    </View>
  );
}
