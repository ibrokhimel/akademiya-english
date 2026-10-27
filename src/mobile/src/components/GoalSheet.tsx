import { useEffect,useRef } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { goals } from "../data/content";
import { useApp } from "../lib/store";
import { BottomSheet,SheetHandle } from "./BottomSheet";
import { RaisedPressable } from "./RaisedPressable";
import { Icon,Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";

export function GoalSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const d = useDesignScale(), c = useTheme(), { settings, set } = useApp();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <BottomSheet visible={visible} onClose={onClose}><SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.card, borderTopLeftRadius: d(28), borderTopRightRadius: d(28), borderWidth: d(2), borderBottomWidth: 0, borderColor: c.line }}>
    <View style={{ paddingHorizontal: d(20), paddingTop: d(10), paddingBottom: d(28), gap: d(14) }}><SheetHandle /><Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black" }}>Ingliz tili sizga nima uchun kerak?</Txt>
      <View style={{ gap: d(10) }}>{goals.map(([key, icon, label]) => <RaisedPressable key={key} accessibilityLabel={label} accessibilityState={{ selected: settings.goal === key }} soundName="pick" onPress={() => { set({ goal: key }); clearTimeout(timer.current); timer.current = setTimeout(onClose, 380); }} radius={d(16)} depth={d(4)} backgroundColor={settings.goal === key ? c.soft : c.card} edgeColor={settings.goal === key ? c.softLine : c.line} faceStyle={{ flexDirection: "row", alignItems: "center", gap: d(14), paddingHorizontal: d(16), paddingVertical: d(12), borderWidth: d(2), borderColor: settings.goal === key ? c.accent : c.line }}>
        <Icon name={icon} size={d(28)} /><Txt style={{ flex: 1, fontSize: d(17), fontFamily: "Nunito_900Black", color: settings.goal === key ? c.accent : c.text }}>{label}</Txt><View style={{ width: d(24), height: d(24), borderRadius: d(12), backgroundColor: c.accent, opacity: settings.goal === key ? 1 : 0, alignItems: "center", justifyContent: "center" }}><Icon name="glyph-check-white" size={d(14)} /></View>
      </RaisedPressable>)}</View>
    </View></SafeAreaView></BottomSheet>;
}
