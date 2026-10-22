import { File,Paths } from "expo-file-system";
import { useEffect,useRef,useState } from "react";
import { Share,TextInput,View } from "react-native";
import Animated,{ FadeInDown,FadeOutUp,ReduceMotion } from "react-native-reanimated";
import { SafeAreaView,useSafeAreaInsets } from "react-native-safe-area-context";
import { captureScreen } from "react-native-view-shot";
import { Actor } from "../components/Actor";
import { BottomSheet,SheetHandle } from "../components/BottomSheet";
import { RaisedPressable } from "../components/RaisedPressable";
import { SettingToggle } from "../components/SettingsControls";
import { Button,Txt,useTheme,violet } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { sound } from "../lib/audio";
import { feedback,pb } from "../lib/backend";
import { cloudEnabled } from "../lib/config";
import { useBack } from "../lib/navigation";
import { read,remove,write } from "../lib/storage";
import { useApp } from "../lib/store";
import { getVisualAudit } from "../lib/visualAudit";

export default function Feedback() {
  const audit = getVisualAudit(), d = useDesignScale(), c = useTheme(), insets = useSafeAreaInsets();
  const back = useBack("/(tabs)/profile"), { add, settings } = useApp();
  const [text, setText] = useState(() => read<string>("draft.feedback", ""));
  const [chips, setChips] = useState(() => read<string[]>("draft.feedback.chips", []));
  const [screenshot, setScreenshot] = useState(() => read<boolean>("draft.feedback.shot", true));
  const [uri, setUri] = useState(() => read<string>("draft.feedback.image", ""));
  const [visible, setVisible] = useState(!!audit && !audit.result), [sent, setSent] = useState(!!audit?.result), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const closing = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const canDeliver = cloudEnabled && pb.authStore.isValid;
  useEffect(() => {
    if (audit) return;
    let active = true;
    const open = async () => {
      if (canDeliver && !uri && screenshot) try {
        const source = await captureScreen({ format: "png", result: "tmpfile", handleGLSurfaceViewOnAndroid: true });
        if (!active) return;
        const target = new File(Paths.document, `feedback-${Date.now()}.png`); new File(source).copy(target); setUri(target.uri); write("draft.feedback.image", target.uri);
      } catch { if (active) setScreenshot(false); }
      if (active) setVisible(true);
    };
    void open();
    return () => { active = false; clearTimeout(timer.current); };
    // A screenshot belongs to the screen the learner was viewing on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => { if (closing.current) return; closing.current = true; setVisible(false); timer.current = setTimeout(back, 200); };
  const send = async () => {
    if (busy || (!text.trim() && !chips.length)) return;
    setBusy(true); setError("");
    const body = [chips.join(", "), text.trim()].filter(Boolean).join("\n");
    try {
      if (!canDeliver) {
        const result = await Share.share({ title: "Akademiya English: fikr", message: `Akademiya English Android MVP\n\n${body}` });
        if (result.action === Share.sharedAction) {
          setVisible(false); setSent(true); sound("sent", settings.sound);
          if (!audit) timer.current = setTimeout(back, 3000);
        }
        return;
      }
      await feedback(body, "mobile", screenshot ? uri : undefined);
      add({ type: "feedback", text: body });
      for (const key of ["draft.feedback", "draft.feedback.chips", "draft.feedback.shot", "draft.feedback.image"]) remove(key);
      if (uri && pb.authStore.isValid) try { new File(uri).delete(); } catch {}
      setVisible(false); setSent(true); sound("sent", settings.sound);
      if (!audit) timer.current = setTimeout(back, 3000);
    } catch { setError("Serverga ulanib bo'lmadi. Internetni tekshiring va yana urinib ko'ring."); }
    finally { setBusy(false); }
  };
  return <View style={{ flex: 1 }}>
    <BottomSheet visible={visible} onClose={close} scrimColor="#2B2B3C66"><SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.bg, borderTopLeftRadius: d(28), borderTopRightRadius: d(28) }}><View style={{ paddingHorizontal: d(20), paddingTop: d(10), paddingBottom: d(30), gap: d(12), alignItems: "center" }}><SheetHandle /><Actor size={d(80)} mood={chips.length ? "happy" : "smirk"} />
      <Txt style={{ width: "100%", textAlign: "center", fontSize: d(22), lineHeight: d(27.5), fontFamily: "Nunito_900Black" }}>Nimadir xato ketdimi?</Txt><Txt style={{ width: "100%", textAlign: "center", fontSize: d(14), lineHeight: d(20), color: c.muted }}>Ayting — tuzatamiz. Sizning fikringiz ilovani yaxshilaydi.</Txt>
      <View style={{ width: "100%", flexDirection: "row", flexWrap: "wrap", gap: d(8) }}>{["Javob xato", "Ovoz ishlamadi", "Tushunarsiz", "Boshqa"].map(label => <RaisedPressable key={label} accessibilityLabel={label} accessibilityState={{ selected: chips.includes(label) }} onPress={() => { const next = chips.includes(label) ? chips.filter(c => c !== label) : [...chips, label]; setChips(next); write("draft.feedback.chips", next); }} radius={d(14)} depth={0} soundName="seg" backgroundColor={chips.includes(label) ? c.soft : c.bg} edgeColor={c.line} style={{ width: d(171) }} faceStyle={{ paddingVertical: d(10), paddingHorizontal: d(12), borderWidth: d(2), borderColor: chips.includes(label) ? violet : c.line, alignItems: "center" }}><Txt numberOfLines={1} style={{ width: "100%", textAlign: "center", fontSize: d(13), fontFamily: "Nunito_900Black", color: chips.includes(label) ? violet : c.text }}>{label}</Txt></RaisedPressable>)}</View>
      <TextInput accessibilityLabel="Fikringiz" multiline textAlignVertical="top" maxLength={4800} value={text} onChangeText={value => { setText(value); write("draft.feedback", value); }} placeholder="Mikrofonni bosdim, lekin hech narsa bo'lmadi…" placeholderTextColor={c.muted} style={{ width: "100%", height: d(76), borderWidth: d(2), borderColor: text ? violet : c.line, borderRadius: d(14), padding: d(12), fontFamily: "Nunito_700Bold", fontSize: d(13), lineHeight: d(18.2), color: c.text }} />
      {canDeliver ? <View style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: d(10) }}><Txt style={{ fontSize: d(14), fontFamily: "Nunito_800ExtraBold" }}>Ekran rasmini qo&apos;shish</Txt><SettingToggle label="Ekran rasmini qo'shish" value={screenshot} onChange={value => { setScreenshot(value); write("draft.feedback.shot", value); }} /></View> : null}
      {error ? <Txt accessibilityRole="alert" style={{ color: "#D9483A", fontSize: d(13) }}>{error}</Txt> : null}
      <View style={{ width: "100%", marginTop: d(4) }}><Button label={busy ? "KUTILMOQDA..." : canDeliver ? "YUBORISH" : "ULASHISH"} disabled={busy || (!text.trim() && !chips.length)} onPress={() => { void send(); }} /></View>
    </View></SafeAreaView></BottomSheet>
    {sent ? <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} exiting={FadeOutUp.duration(180).reduceMotion(ReduceMotion.System)} style={{ position: "absolute", left: d(16), top: insets.top + d(16), width: d(358), borderRadius: d(18), backgroundColor: settings.dark ? "#3A3A4E" : "#2B2B3C", flexDirection: "row", alignItems: "center", gap: d(12), paddingLeft: d(12), paddingRight: d(14), paddingVertical: d(12), boxShadow: "0 6px 16px rgba(0,0,0,.2)" }}><View style={{ width: d(52), height: d(52), borderRadius: d(12), backgroundColor: "#8A8A9C", alignItems: "center", justifyContent: "center" }}><Actor size={d(52)} mood="happy" /></View><View style={{ flex: 1 }}><Txt style={{ fontSize: d(14), fontFamily: "Nunito_900Black", color: "#FFFFFF" }}>{canDeliver ? "Rahmat! Xabaringiz yetib keldi" : "Ulashish oynasi ochildi"}</Txt><Txt style={{ fontSize: d(12), color: "#FFFFFFB3" }}>{canDeliver ? "Tez orada tuzatamiz." : "Qoralama shu telefonda saqlanadi."}</Txt></View></Animated.View> : null}
  </View>;
}
