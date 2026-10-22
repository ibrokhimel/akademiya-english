import { useEffect,useState } from "react";
import { Modal,Pressable,View } from "react-native";
import Animated,{ ReduceMotion,ZoomIn,ZoomOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { Button,Icon,Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";
export type Confirmation = { title: string; text: string; yes: string; icon?: string; danger?: boolean; cancelLabel?: string | null; onConfirm: () => void };
export function useConfirmation() {
  const [question, ask] = useState<Confirmation | null>(null);
  return { ask, dialog: <ConfirmDialog question={question} onClose={() => ask(null)} /> };
}
export function ConfirmDialog({ question, onClose }: { question: Confirmation | null; onClose: () => void }) {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp();
  const [previous, setPrevious] = useState(question);
  if (question && previous !== question) setPrevious(question);
  const shown = question || previous;
  useEffect(() => { if (question) sound("pop", settings.sound); }, [question, settings.sound]);
  const close = () => { sound("close", settings.sound); onClose(); };
  return <Modal transparent statusBarTranslucent navigationBarTranslucent visible={!!question} animationType="fade" onRequestClose={close}><SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#14141E73", alignItems: "center", justifyContent: "center" }}><Pressable accessibilityLabel="Yopish" onPress={close} style={{ position: "absolute", inset: 0 }} />{shown ? <Animated.View entering={ZoomIn.duration(220).reduceMotion(ReduceMotion.System)} exiting={ZoomOut.duration(140).reduceMotion(ReduceMotion.System)} accessibilityViewIsModal style={{ width: d(300), marginBottom: d(44), maxWidth: "90%", padding: d(24), borderRadius: d(24), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, gap: d(12), alignItems: "center", boxShadow: "0 12px 32px rgba(43,43,60,.13)" }}>{shown.icon ? <Icon name={shown.icon} size={d(46)} /> : null}<Txt style={{ width: "100%", fontSize: d(19), fontFamily: "Nunito_900Black" }}>{shown.title}</Txt><Txt style={{ width: "100%", fontSize: d(14), color: c.muted }}>{shown.text}</Txt><View style={{ width: "100%" }}><Button label={shown.yes} kind={shown.danger ? "danger" : "primary"} onPress={() => { close(); shown.onConfirm(); }} /></View>{shown.cancelLabel !== null ? <View style={{ width: "100%" }}><Button label={shown.cancelLabel || "BEKOR QILISH"} kind="secondary" onPress={close} /></View> : null}</Animated.View> : null}</SafeAreaView></Modal>;
}
