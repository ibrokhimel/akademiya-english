import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { brand, type } from "../../components/system";
import { DombiOverlay, TabHeader, useDs } from "../../components/TabChrome";
import { Icon, Txt } from "../../components/ui";
import { useHomeBack } from "../../lib/navigation";
import { showProblem } from "../../lib/problem";
import { useApp } from "../../lib/store";

// Practice tab: "Practice · Final" (R3rLh, the daily card is dropped) and "Practice · First time (C)" (MpuCW).
// The activities are not built in v1, so each opens the owner's "Bu bo'lim hali yaratilmoqda" page.
const GROUPS: { head: string; rows: [icon: string, title: string, note: string][] }[] = [
  { head: "Tinglash", rows: [["glyph-headphones", "Gapni tut", "Eshiting, so'zlarni tartiblang"], ["glyph-speaker-violet", "Eshitib qoldim", "Darsdagi suhbatlar · 6 ta"]] },
  { head: "So'zlar", rows: [["card", "Juftini top", "Inglizcha va o'zbekcha juftlar"], ["notepad", "Xatoni tuzat", "Ko'p uchraydigan xatolar · 9 ta"]] },
];

export default function Practice() {
  useHomeBack();
  const { progress: p } = useApp(), ds = useDs(), { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2), d = (n: number) => n * scale;
  const locked = Object.keys(p.done).length === 0;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: ds.surface }}>
      <TabHeader title="Mashq" />
      <ScrollView contentContainerStyle={{ paddingTop: d(4), paddingHorizontal: d(20), paddingBottom: d(110), gap: d(10) }}>
        {GROUPS.map((group) => (
          <View key={group.head} style={{ gap: d(8) }}>
            <Txt style={{ ...type("heading", d), color: ds.ink }}>{group.head}</Txt>
            {group.rows.map(([icon, title, note]) => (
              <Pressable
                key={title}
                accessibilityRole="button"
                accessibilityState={{ disabled: locked }}
                disabled={locked}
                onPress={() => void showProblem("not-ready")}
                style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderRadius: d(18), borderWidth: 2, borderColor: ds.line, backgroundColor: locked ? ds.paper : ds.surface }}
              >
                <View style={{ width: d(52), height: d(52), borderRadius: d(14), backgroundColor: locked ? ds.line : brand.wash, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={icon} size={d(28)} />
                </View>
                <View style={{ flex: 1, gap: d(2) }}>
                  <Txt style={{ ...type("body", d), fontFamily: "Nunito_900Black", color: locked ? ds.muted : ds.ink }}>{title}</Txt>
                  <Txt style={{ ...type("small", d), color: ds.muted }}>{note}</Txt>
                </View>
                <Icon name={locked ? "glyph-lock-grey" : "glyph-chevron-right-violet"} size={d(22)} />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <DombiOverlay moment={locked ? "guide" : "idle"} line={locked ? "Birinchi darsni tugatsangiz, bu yer to'ladi." : undefined} />
    </SafeAreaView>
  );
}
