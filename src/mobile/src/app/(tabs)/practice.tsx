import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { brand, type } from "../../components/system";
import { DombiOverlay, TabHeader, useDs } from "../../components/TabChrome";
import { Icon, Txt } from "../../components/ui";
import { useHomeBack } from "../../lib/navigation";
import { router } from "expo-router";
import { MIN, practiceCounts } from "../../../../core/practice.js";
import { units } from "../../data/content";
import { useApp } from "../../lib/store";

// Practice tab: "Practice · Final" (R3rLh, the daily card is dropped) and "Practice · First time (C)" (MpuCW).
// Each row opens its activity once the finished lessons give it something to play; until then it shows the lock.
type Kind = "catch" | "overheard" | "match" | "fixit";
const GROUPS: { head: string; rows: [kind: Kind, icon: string, title: string, note: string, counted: boolean][] }[] = [
  { head: "Tinglash", rows: [["catch", "glyph-headphones", "Gapni tut", "Eshiting, so'zlarni tartiblang", false], ["overheard", "glyph-speaker-violet", "Eshitib qoldim", "Darsdagi suhbatlar", true]] },
  { head: "So'zlar", rows: [["match", "card", "Juftini top", "Inglizcha va o'zbekcha juftlar", false], ["fixit", "notepad", "Xatoni tuzat", "Ko'p uchraydigan xatolar", true]] },
];

export default function Practice() {
  useHomeBack();
  const { progress: p } = useApp(), ds = useDs(), { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2), d = (n: number) => n * scale;
  const first = Object.keys(p.done).length === 0, counts = practiceCounts(units, p.done);
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: ds.surface }}>
      <TabHeader title="Mashq" />
      <ScrollView contentContainerStyle={{ paddingTop: d(4), paddingHorizontal: d(20), paddingBottom: d(110), gap: d(10) }}>
        {GROUPS.map((group) => (
          <View key={group.head} style={{ gap: d(8) }}>
            <Txt style={{ ...type("heading", d), color: ds.ink }}>{group.head}</Txt>
            {group.rows.map(([kind, icon, title, note, counted]) => { const locked = counts[kind] < MIN[kind]; return (
              <Pressable
                key={title}
                accessibilityRole="button"
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => router.push(`/activity/${kind}`)}
                style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderRadius: d(18), borderWidth: 2, borderColor: ds.line, backgroundColor: locked ? ds.paper : ds.surface }}
              >
                <View style={{ width: d(52), height: d(52), borderRadius: d(14), backgroundColor: locked ? ds.line : brand.wash, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={icon} size={d(28)} />
                </View>
                <View style={{ flex: 1, gap: d(2) }}>
                  <Txt style={{ ...type("body", d), fontFamily: "Nunito_900Black", color: locked ? ds.muted : ds.ink }}>{title}</Txt>
                  <Txt style={{ ...type("small", d), color: ds.muted }}>{counted && counts[kind] ? `${note} · ${counts[kind]} ta` : note}</Txt>
                </View>
                <Icon name={locked ? "glyph-lock-grey" : "glyph-chevron-right-violet"} size={d(22)} />
              </Pressable>
            ); })}
          </View>
        ))}
      </ScrollView>
      <DombiOverlay moment={first ? "guide" : "idle"} line={first ? "Birinchi darsni tugatsangiz, bu yer to'ladi." : undefined} />
    </SafeAreaView>
  );
}
