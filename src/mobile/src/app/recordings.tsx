import { useEffect,useRef,useState } from "react";
import { Pressable,ScrollView,View } from "react-native";
import Animated,{ FadeOut,LinearTransition,ReduceMotion } from "react-native-reanimated";
import { useConfirmation } from "../components/ConfirmDialog";
import { AudioBars } from "../components/Motion";
import { ScreenHeader,SettingGroup,SettingRow,SettingToggle } from "../components/SettingsControls";
import { Button,coral,Icon,Page,Txt,useTheme } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { P } from "../data/content";
import { sound,stopAudio } from "../lib/audio";
import { deleteVoiceFiles } from "../lib/backend";
import { useBack } from "../lib/navigation";
import { shortDate } from "../lib/progressExtras";
import { useApp } from "../lib/store";
import { getVisualAudit } from "../lib/visualAudit";
import { playVoice,voicePlaybackError } from "../lib/voicePlayback";
export default function Recordings() {
  const d = useDesignScale(), back = useBack("/settings"), { settings, set, recordings, deleteRecording } = useApp(), c = useTheme(), { ask, dialog } = useConfirmation();
  const [playing, setPlaying] = useState<string | null>(() => getVisualAudit()?.id === "recordings-playing" ? recordings[0]?.phraseId || null : null), generation = useRef(0), [error, setError] = useState("");
  useEffect(() => () => { generation.current++; stopAudio(); }, []);
  const remove = (id?: string) => { generation.current++; stopAudio(); setPlaying(null); sound("close", settings.sound); void deleteVoiceFiles(id ? recordings.filter(r => r.phraseId === id) : recordings); deleteRecording(id); };
  const listen = async (id: string, uri: string) => { const n = ++generation.current; stopAudio(); if (playing === id) { setPlaying(null); return; } setPlaying(id); setError(""); try { await playVoice(uri, () => n === generation.current); } catch (error) { if (n === generation.current) setError(voicePlaybackError(error)); } finally { if (n === generation.current) setPlaying(null); } };
  return <Page style={{ padding: 0, gap: 0 }}><ScreenHeader title="Ovoz yozuvlari" onBack={() => { stopAudio(); back(); }} /><ScrollView contentContainerStyle={{ paddingHorizontal: d(20), paddingTop: d(4), paddingBottom: d(24), gap: d(14) }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(14), borderRadius: d(16), backgroundColor: c.good }}><Icon name="glyph-shield-dark" size={d(30)} style={settings.dark ? { tintColor: "#F4F4F6" } : undefined} /><Txt style={{ flex: 1, fontSize: d(13), lineHeight: d(18.2), fontFamily: "Nunito_800ExtraBold" }}>Yozuvlaringizni faqat siz eshitasiz. Ular shaxsiy saqlanadi.</Txt></View>
    <SettingGroup><SettingRow icon="glyph-mic-grey" label="Ovozimni saqlash" detail="Ba'zi gapirish savollarida ovozingiz saqlanadi — keyin taraqqiyotingizni eshitasiz" right={<SettingToggle label="Ovozimni saqlash" value={settings.saveVoice} onChange={saveVoice => set({ saveVoice })} />} /></SettingGroup>
    <Txt style={{ marginTop: d(6), fontSize: d(12), color: c.muted, letterSpacing: d(.6), fontFamily: "Nunito_900Black" }}>SAQLANGAN YOZUVLAR · {recordings.length}</Txt>
    <View style={{ gap: d(10) }}>{recordings.map(r => <Animated.View key={r.phraseId} exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)} layout={LinearTransition.duration(180).reduceMotion(ReduceMotion.System)} style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderWidth: d(2), borderColor: c.line, borderRadius: d(16), overflow: "hidden" }}><Pressable accessibilityLabel={`Tinglash ${P[r.phraseId]?.en || ""}`} onPress={() => { void listen(r.phraseId, r.uri); }} style={{ width: d(40), height: d(40), borderRadius: d(12), backgroundColor: c.coralSoft, alignItems: "center", justifyContent: "center" }}>{playing === r.phraseId ? <AudioBars color={coral} size={d(18)} /> : <Icon name="glyph-play-dark" size={d(22)} style={settings.dark ? { tintColor: "#F4F4F6" } : undefined} />}</Pressable><View style={{ flex: 1 }}><Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>{P[r.phraseId]?.en || r.phraseId}</Txt><Txt style={{ fontSize: d(12), color: c.muted }}>Mening ovozim · {shortDate(r.at)}</Txt></View><Pressable accessibilityLabel="O'chirish" onPress={() => remove(r.phraseId)} style={{ width: d(34), height: d(34), alignItems: "center", justifyContent: "center" }}><Icon name="glyph-trash-dark" size={d(22)} style={settings.dark ? { tintColor: "#F4F4F6" } : undefined} /></Pressable></Animated.View>)}{!recordings.length ? <Txt style={{ paddingVertical: d(4), paddingHorizontal: d(2), fontSize: d(14), color: c.muted }}>{settings.saveVoice ? "Hali yozuv yo'q. Darslarda gapirganingizda ovozingiz shu yerga saqlanadi." : "Ovozingiz saqlanmayapti."}</Txt> : null}</View>{error ? <Txt style={{ fontSize: d(13), color: coral }}>{error}</Txt> : null}
  </ScrollView>{recordings.length ? <View style={{ paddingHorizontal: d(20), paddingTop: d(12), paddingBottom: d(30) }}><Button label="BARCHA YOZUVLARNI O'CHIRISH" kind="danger" onPress={() => ask({ icon: "trash", title: "Ovoz yozuvlarini o'chirasizmi?", text: "Hamma yozuvlar butunlay o'chadi. Buni qaytarib bo'lmaydi.", yes: "O'CHIRISH", danger: true, onConfirm: () => remove() })} /></View> : null}{dialog}</Page>;
}
