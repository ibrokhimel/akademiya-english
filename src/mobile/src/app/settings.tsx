import { router } from "expo-router";
import { useEffect,useRef,useState } from "react";
import { Alert,Pressable,ScrollView,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuditScroll } from "../audit/layout";
import { BottomSheet,SheetHandle } from "../components/BottomSheet";
import { useConfirmation } from "../components/ConfirmDialog";
import { GoalSheet } from "../components/GoalSheet";
import { SegmentControl } from "../components/SegmentControl";
import { ScreenHeader,SettingGroup,SettingRow,SettingToggle,} from "../components/SettingsControls";
import { TimeWheel } from "../components/TimeWheel";
import { Button,Icon,LinkButton,Page,Section,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { goals } from "../data/content";
import { sound } from "../lib/audio";
import { deleteVoiceFiles,pb } from "../lib/backend";
import { cloudEnabled,testToolsEnabled } from "../lib/config";
import { useBack } from "../lib/navigation";
import { notificationPermission,reminders,validTime,} from "../lib/notifications";
import { clearPrivateFiles } from "../lib/privateFiles";
import { longDate } from "../lib/progressExtras";
import { clearLocalData,read,remove,write } from "../lib/storage";
import { useApp } from "../lib/store";
import { useReducedMotion } from "react-native-reanimated";
import { useDombiLevel } from "../lib/dombiLevel";
import { getVisualAudit } from "../lib/visualAudit";
export default function SettingsScreen() {
    const d = useDesignScale();
    const scroll = useRef<ScrollView>(null);
    useAuditScroll(scroll);
    const back = useBack("/(tabs)/profile");
    const app = useApp(), { settings, set } = app, c = useTheme();
    const confirm = useConfirmation();
    const [windowsOpen, setWindowsOpen] = useState(false);
    const signedIn = !!getVisualAudit() || (cloudEnabled && pb.authStore.isValid);
    const [time, setTime] = useState(settings.reminder || "19:00");
    const saveTime = async () => {
        if (!validTime(time)) {
            Alert.alert("19:00", "Vaqtni 19:00 shaklida kiriting.");
            return;
        }
        if (await notificationPermission()) {
            set({ reminder: time });
            void reminders({ ...settings, reminder: time }, app.events).catch(() => Alert.alert("Eslatma saqlanmadi", "Eslatmani qayta saqlab ko'ring."));
        }
        else {
            Alert.alert("Eslatmalar yopiq", "Sozlamalardan eslatmalarni yoqing.");
            return false;
        }
        return true;
    };
    const logOut = () => confirm.ask({ title: "Hisobdan chiqasizmi?", text: "Qaytib kirganingizda natijalaringiz joyida bo'ladi.", yes: "CHIQISH", onConfirm: () => {
      if (pb.authStore.record) write(`profile.${pb.authStore.record.id}`, { settings, events: app.events, recordings: app.recordings, deletedRecordings: read<string[]>("deletedRecordings", []) });
      pb.authStore.clear(); app.reset(); router.replace("/onboarding");
    } });
    const erase = async () => { try { const user = cloudEnabled ? pb.authStore.record?.id : undefined; if (user) { await pb.collection("users").delete(user); remove(`profile.${user}`); } deleteVoiceFiles(app.recordings); clearPrivateFiles(); await reminders({ ...settings, onboarded: false, reminder: null }, []); clearLocalData(); pb.authStore.clear(); app.reset(); router.replace("/onboarding"); } catch { router.navigate("/problem?kind=error"); } };
    const deleteAccount = () => confirm.ask({ icon: "trash", title: signedIn ? "Hisobni o'chirasizmi?" : "Ma'lumotlarni o'chirasizmi?", text: "Hamma natijalar, seriya va ovoz yozuvlari butunlay o'chadi. Buni qaytarib bo'lmaydi.", yes: "O'CHIRISH", danger: true, onConfirm: () => { void erase(); } });
    const restart = () => confirm.ask({ icon: "trash", title: "Boshidan boshlaysizmi?", text: "Hamma natijalar, seriya va ovoz yozuvlari o'chadi.", yes: "HA, BOSHIDAN", danger: true, onConfirm: () => setTimeout(() => confirm.ask({ title: "Rostdan ham?", text: "Buni qaytarib bo'lmaydi.", yes: "O'CHIRISH", danger: true, onConfirm: () => { void erase(); } }), 180) });
    const [panel, setPanel] = useState<"goal" | "reminder" | null>(() => {
        const panel = getVisualAudit()?.panel;
        return panel === "goal" || panel === "reminder" ? panel : null;
    });
    const openReminder = () => {
        setTime(settings.reminder || "19:00");
        setPanel("reminder");
    };
    const wasOpen = useRef(false);
    useEffect(() => {
        if (panel)
            sound("whoosh", settings.sound);
        else if (wasOpen.current)
            sound("close", settings.sound);
        wasOpen.current = !!panel;
    }, [panel, settings.sound]);
    const goal = goals.find((g) => g[0] === settings.goal) || goals[4];
    // "Kamroq harakat" (owner pick B): on = Dombi as still pictures. Reduce Motion keeps it on and locked.
    const reduceMotion = useReducedMotion(), dombiLevel = useDombiLevel();
    const toggle = (label: string, value: boolean, onChange: (on: boolean) => void) => <SettingToggle label={label} value={value} onChange={onChange}/>;
    return (<Page style={{ padding: d(0), gap: d(0) }}>
      <ScreenHeader title="Sozlamalar" onBack={() => back()}/>
      <ScrollView ref={scroll} contentContainerStyle={{
            paddingHorizontal: d(20),
            paddingTop: d(4),
            paddingBottom: d(24),
            gap: d(10),
        }}>
        <Section style={{ marginTop: 0 }}>UMUMIY</Section>
        <SettingGroup>
          <SettingRow icon="glyph-speaker-grey" label="Ovozli effektlar" right={toggle("Ovozli effektlar", settings.sound, (sound) => set({ sound }))}/>
          <SettingRow icon="glyph-moon-grey" label="Tungi rejim" right={toggle("Tungi rejim", app.isDark, (dark) => set({ mode: dark ? "dark" : "light" }))}/>
          <SettingRow icon="glyph-sparkles-grey" label="Kamroq harakat" detail={reduceMotion ? "Telefoningizda harakat kamaytirilgan." : undefined} right={<View pointerEvents={reduceMotion ? "none" : "auto"} style={{ opacity: reduceMotion ? 0.4 : 1 }}>{toggle("Kamroq harakat", dombiLevel === "still", (lessMotion) => set({ lessMotion }))}</View>}/>
          <SettingRow icon="glyph-phone-grey" label="Telefon harakati" detail={`${settings.profile.dombi.name} telefon qiyshayganda o'sha tomonga yiqiladi.`} right={toggle("Telefon harakati", settings.phoneMotion === true, (phoneMotion) => set({ phoneMotion }))}/>
          <SettingRow icon="glyph-bell-grey" label="Eslatma vaqti" value={settings.reminder || "O'chiq"} onPress={openReminder}/>
          <SettingRow icon={goal[1]} label="Maqsad" value={goal[2]} onPress={() => setPanel("goal")}/>
        </SettingGroup>
        <Section>GAPIRISH</Section>
        <SettingGroup>
          <SettingRow icon="glyph-mic-grey" label="Gapirish mashqlari" detail="Mikrofon ishlatib bo'lmaydigan joyda vaqtincha o'chiring" right={toggle("Gapirish mashqlari", settings.speaking, (speaking) => set({ speaking }))}/>
          <SettingRow icon="glyph-shield-grey" label="Ovoz yozuvlari" onPress={() => router.navigate("/recordings")}/>
          <SettingRow icon="glyph-mic-grey" label="Nutqni tanish" onPress={() => router.navigate("/speech-settings")}/>
          <SettingRow icon="glyph-wave-grey" label="Inglizcha ovozlar" right={<SegmentControl options={[{ key: "uk", label: "Britancha" }, { key: "us", label: "Amerikacha" }]} value={settings.cast} onChange={cast => set({ cast: cast as "uk" | "us" })} />}/>
        </SettingGroup>
        <Section>HISOB</Section>
        <SettingGroup>
          <SettingRow icon="glyph-lock-grey" label="Maxfiylik" onPress={() => router.navigate("/privacy")}/>
          {cloudEnabled ? <SettingRow icon="glyph-logout-grey" label={signedIn ? "Chiqish" : "Kirish"} onPress={signedIn
            ? logOut
            : () => router.navigate("/account?mode=login")}/> : <SettingRow icon="glyph-user-violet" label="Ism" value={settings.name || "Siz"} onPress={() => router.navigate("/account")} />}
          <SettingRow icon="glyph-trash-red" label={signedIn ? "Hisobni o'chirish" : "Ma'lumotlarni o'chirish"} danger onPress={deleteAccount}/>
        </SettingGroup>
        {testToolsEnabled ? <>
        <View style={{ gap: d(2), marginTop: d(6) }}><Section style={{ marginTop: 0 }}>SINOV UCHUN</Section>
        <Txt style={{ fontSize: d(11), color: c.muted }}>
          Bu bo&apos;lim faqat sinov versiyasida bor.
        </Txt></View>
        <SettingGroup style={{ borderStyle: "dashed" }}>
          <SettingRow icon="glyph-list-grey" label="Hamma darslar ochiq" right={toggle("Hamma darslar ochiq", settings.openAll, (openAll) => set({ openAll }))}/>
          <SettingRow icon="glyph-timer-grey" label="Sanani surish" detail={<View><Txt style={{ fontSize: d(12), lineHeight: d(15.6), color: c.muted }}>Bugun: {longDate(app.now().toISOString())}</Txt><View style={{ flexDirection: "row", gap: d(6), marginTop: d(6) }}>{[1, 14, 0].map(days => <Pressable key={days} onPress={() => set({ dayShift: days ? (settings.dayShift || 0) + days : 0 })} style={{ paddingHorizontal: d(9), paddingVertical: d(6), borderRadius: d(10), backgroundColor: c.surface, borderWidth: d(2), borderColor: c.line }}><Txt style={{ fontSize: d(12), color: c.accent, fontFamily: "Nunito_900Black" }}>{days ? `+${days} kun` : "Bugun"}</Txt></Pressable>)}</View></View>} />
          <SettingRow icon="glyph-info-grey" label="Oynalarni ko'rish" onPress={() => setWindowsOpen(true)} />
          <SettingRow icon="glyph-replay-grey" label="Boshidan boshlash" danger onPress={restart} />
        </SettingGroup>
        </> : null}
        <SettingRow icon="glyph-message-grey" label="Fikr bildirish" onPress={() => router.navigate("/feedback")} />
      </ScrollView>
      <GoalSheet visible={panel === "goal"} onClose={() => setPanel(null)} />
      <BottomSheet visible={panel === "reminder"} onClose={() => setPanel(null)}><SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.card, borderTopLeftRadius: d(28), borderTopRightRadius: d(28), borderWidth: d(2), borderBottomWidth: 0, borderColor: c.line }}><View style={{ paddingHorizontal: d(20), paddingTop: d(10), paddingBottom: d(28), gap: d(14) }}><SheetHandle /><Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black" }}>Har kuni soat nechada eslatay?</Txt><TimeWheel initialValue={time} onChange={setTime} /><Button label="SAQLASH" onPress={() => { void saveTime().then(saved => { if(saved) setPanel(null); }); }} /><LinkButton compact label="ESLATMANI O'CHIRISH" color={c.muted} onPress={() => { set({ reminder: null }); void reminders({ ...settings, reminder: null }, app.events); setPanel(null); }} /></View></SafeAreaView></BottomSheet>
      <BottomSheet visible={windowsOpen} onClose={() => setWindowsOpen(false)}><SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.card, borderTopLeftRadius: d(28), borderTopRightRadius: d(28) }}><View style={{ padding: d(20), gap: d(14) }}><SheetHandle /><Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black" }}>Oynalarni ko&apos;rish</Txt>{[["feedback", "glyph-message-grey", "Fikr bildirish (29)"], ["confidence", "glyph-star-grey", "Ishonch savoli (30)"], ["offline", "glyph-wifi-off-grey", "Internet yo'q (31a)"], ["mic-blocked", "glyph-mic-off-grey", "Mikrofon yopiq (31b)"], ["speech-unavailable", "glyph-wave-grey", "Nutq tanilmayapti (31c)"], ["error", "glyph-info-grey", "Nimadir buzildi (31e)"], ["not-ready", "glyph-timer-grey", "Hali tayyor emas (31d)"], ["device-settings", "glyph-gear-grey", "Qurilma sozlamalari"]].map(([key, icon, label]) => <Pressable key={key} onPress={() => { setWindowsOpen(false); setTimeout(() => router.navigate(key === "feedback" ? "/feedback" : key === "confidence" ? "/confidence" : key === "device-settings" ? "/device-settings" : `/problem?kind=${key}`), 200); }} style={{ flexDirection: "row", gap: d(12), alignItems: "center", paddingVertical: d(13), paddingHorizontal: d(4), borderBottomWidth: d(2), borderColor: c.line }}><Icon name={icon} size={d(24)} /><Txt style={{ flex: 1, fontSize: d(16), fontFamily: "Nunito_800ExtraBold" }}>{label}</Txt><Icon name="glyph-chevron-right-grey" size={d(24)} /></Pressable>)}</View></SafeAreaView></BottomSheet>
      {confirm.dialog}
    </Page>);
}
