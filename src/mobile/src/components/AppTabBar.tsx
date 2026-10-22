import { Pressable,View,useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bounce } from "./Motion";
import { Icon,useTheme } from "./ui";

export function AppTabBar({ selected, onPress }: { selected: number; onPress: (index: number) => void }) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 390, 1.2);
  const labels = ["O'rganish", "Natijalar", "Profil"];
  const icons = ["tab-home", "tab-progress", "tab-profile"];
  return <SafeAreaView edges={["bottom", "left", "right"]} style={{ backgroundColor: c.card, borderTopWidth: 2 * scale, borderColor: c.line }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40 * scale, paddingTop: 14 * scale, paddingBottom: 30 * scale }}>
      {labels.map((label, index) => <Pressable key={label} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: selected === index }} onPress={() => onPress(index)}
        style={{ width: 52 * scale, height: 48 * scale, alignItems: "center", justifyContent: "center", borderRadius: 14 * scale, borderWidth: 2 * scale, borderColor: selected === index ? c.softLine : "transparent", backgroundColor: selected === index ? c.soft : "transparent" }}>
        <Bounce change={selected === index}><Icon name={icons[index]} size={32 * scale} /></Bounce>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}
