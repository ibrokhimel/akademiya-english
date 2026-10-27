import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HELP_STEPS } from "../../../core/help.js";
import { BottomSheet, SheetHandle } from "./BottomSheet";
import { Dombi } from "./Dombi";
import { brand, type } from "./system";
import { useDs } from "./TabChrome";
import { Icon, Txt } from "./ui";
import { useDesignScale } from "./useDesignScale";
import { useApp } from "../lib/store";

/** Scrim behind a sheet: ink in light mode, paper in dark mode (ink is light there). */
export function useScrim() {
  const { isDark } = useApp(), ds = useDs();
  return isDark ? ds.paper + "B3" : "#14141E73";
}

/**
 * "Help sheet" (Pencil mSJbv): Dombi's four help steps in a lesson (owner's pick A).
 * Each row does its step when tapped; Uzbek explanation and the answer show in the row once used.
 */
export function HelpSheet({ visible, step, onClose, onStep, firstWord, uzbek, answer, onSlow }: {
  visible: boolean;
  step: number;
  onClose: () => void;
  onStep: (n: number) => void;
  firstWord: string;
  uzbek: string;
  answer: string;
  onSlow: () => void;
}) {
  const d = useDesignScale(), ds = useDs(), scrim = useScrim();
  const rows: Record<(typeof HELP_STEPS)[number], [icon: string, title: string, note: string]> = {
    slow: ["glyph-slow-violet", "Sekin tinglash", "Gapni sekinroq eshiting"],
    firstWord: ["bulb-tip", "Birinchi so'z", `"${firstWord} …"`],
    uzbek: ["speak-bubble", "O'zbekcha izoh", step >= 3 && uzbek ? uzbek : "Bu gap qachon aytiladi"],
    answer: ["notepad", "Javobni ko'rish", step >= 4 ? answer : "Keyin o'zingiz aytasiz"],
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} scrimColor={scrim}>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: ds.surface, borderTopLeftRadius: d(24), borderTopRightRadius: d(24), paddingHorizontal: d(20), paddingTop: d(12), paddingBottom: d(28), gap: d(12) }}>
        <SheetHandle />
        <View style={{ flexDirection: "row", alignItems: "center", gap: d(10) }}>
          <Dombi moment="helpSheet" size={d(48)} />
          <View style={{ flex: 1, backgroundColor: ds.paper, borderRadius: d(18), borderBottomLeftRadius: d(4), paddingVertical: d(10), paddingHorizontal: d(14) }}>
            <Txt style={{ ...type("small", d), color: ds.ink }}>Qaysi yordam kerak? Birinchisidan boshlang.</Txt>
          </View>
        </View>
        {HELP_STEPS.map((key, i) => {
          const [icon, title, note] = rows[key];
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={title}
              onPress={() => { if (key === "slow") onSlow(); onStep(i + 1); }}
              style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderRadius: d(16), borderWidth: 2, borderColor: step > i ? brand.main : ds.line }}
            >
              <View style={{ width: d(28), height: d(28), borderRadius: d(14), backgroundColor: brand.wash, alignItems: "center", justifyContent: "center" }}>
                <Txt style={{ ...type("small", d), color: brand.main }}>{i + 1}</Txt>
              </View>
              <Icon name={icon} size={d(28)} />
              <View style={{ flex: 1 }}>
                <Txt style={{ ...type("body", d), fontFamily: "Nunito_900Black", color: ds.ink }}>{title}</Txt>
                <Txt style={{ ...type("small", d), color: ds.muted }}>{note}</Txt>
              </View>
            </Pressable>
          );
        })}
      </SafeAreaView>
    </BottomSheet>
  );
}
