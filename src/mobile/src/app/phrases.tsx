import { router,useFocusEffect } from "expo-router";
import { useCallback,useRef,useState } from "react";
import { Pressable,ScrollView,View } from "react-native";
import { AudioBars } from "../components/Motion";
import { ScreenHeader } from "../components/SettingsControls";
import { Icon,Page,Txt,useTheme,violet } from "../components/ui";
import { useDesignScale } from "../components/useDesignScale";
import { P,units } from "../data/content";
import { play,stopAudio } from "../lib/audio";
import { useBack } from "../lib/navigation";
import { useApp } from "../lib/store";
import { playVoice,voicePlaybackError } from "../lib/voicePlayback";
export default function Phrases() {
  const d = useDesignScale(), back = useBack("/(tabs)/profile"), { progress: p, settings, recordings } = useApp(), c = useTheme();
  const groups = units.map(unit => ({ unit, phrases: unit.lessons.filter(l => p.done[l.id]).flatMap(l => l.new || []) })).filter(g => g.phrases.length), [playing, setPlaying] = useState(""), [playError, setPlayError] = useState<{id: string; text: string} | null>(null), playingRef = useRef(""), generation = useRef(0);
  useFocusEffect(useCallback(() => () => { generation.current++; playingRef.current = ""; setPlaying(""); stopAudio(); }, []));
  const listen = async (id: string, own = false) => {
    const n = ++generation.current, key = `${own ? "voice" : "example"}:${id}`, ph = P[id];
    stopAudio(); setPlayError(null);
    if (playingRef.current === key) { playingRef.current = ""; setPlaying(""); return; }
    playingRef.current = key; setPlaying(key);
    try {
      if (own) {
        const recording = recordings.find(r => r.phraseId === id);
        if (!recording) throw new Error("No recording");
        await playVoice(recording.uri, () => generation.current === n);
      } else await play(ph.voice, ph.en, settings.cast);
    } catch (error) {
      if (generation.current === n) setPlayError({ id, text: own ? voicePlaybackError(error) : "Namuna ochilmadi. Yana urinib ko'ring." });
    } finally { if (generation.current === n) { playingRef.current = ""; setPlaying(""); } }
  };
  return <Page style={{ padding: 0, gap: 0 }}><ScreenHeader title="Ayta oladiganlarim" sub={`${p.phrases} ta ibora · ${groups.length} bo'lim`} onBack={() => { stopAudio(); back(); }} /><ScrollView contentContainerStyle={{ paddingHorizontal: d(20), paddingTop: d(8), paddingBottom: d(24), gap: d(10) }}>
    {groups.map(({ unit, phrases }) => <View key={unit.unit} style={{ gap: d(10) }}><View style={{ flexDirection: "row", alignItems: "center", gap: d(8), paddingTop: d(8) }}><Icon name={unit.icon} size={d(26)} /><Txt style={{ flex: 1, fontSize: d(13), letterSpacing: d(.6), color: c.muted, fontFamily: "Nunito_900Black" }}>{unit.name.replace("!", "").toUpperCase()}</Txt><Txt style={{ fontSize: d(13), color: c.muted, fontFamily: "Nunito_900Black" }}>{phrases.length}</Txt></View>{phrases.map(id => { const ph = P[id], recording = recordings.find(r => r.phraseId === id); return <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderRadius: d(16), borderWidth: d(2), borderColor: c.line }}><Pressable accessibilityLabel={`Tinglash: ${ph.en}`} onPress={() => { void listen(id); }} style={{ width: d(40), height: d(40), borderRadius: d(12), backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>{playing === `example:${id}` ? <AudioBars color={violet} size={d(18)} /> : <Icon name="glyph-speaker-violet" size={d(26)} />}</Pressable><View style={{ flex: 1, gap: d(2), alignItems: "flex-start" }}><Txt style={{ fontSize: d(16), fontFamily: "Nunito_900Black" }}>{ph.en}</Txt><Txt style={{ fontSize: d(12), color: c.muted }}>{ph.uz}</Txt>{recording ? <Pressable accessibilityLabel={`Mening ovozim: ${ph.en}`} accessibilityState={{ selected: playing === `voice:${id}` }} onPress={() => { void listen(id, true); }} style={{ flexDirection: "row", alignItems: "center", gap: d(4), marginTop: d(2), paddingVertical: d(3), paddingLeft: d(6), paddingRight: d(8), borderRadius: d(99), backgroundColor: c.coralSoft }}>{playing === `voice:${id}` ? <AudioBars color="#D9483A" size={d(16)} /> : <Icon name="glyph-user-coral" size={d(16)} />}<Txt style={{ fontSize: d(11), color: settings.dark ? "#FF8A7D" : "#D9483A", fontFamily: "Nunito_900Black" }}>{playing === `voice:${id}` ? "To‘xtatish ■" : "Mening ovozim ▶"}</Txt></Pressable> : null}{playError?.id === id ? <Txt accessibilityRole="alert" style={{ fontSize: d(12), color: c.muted }}>{playError.text}</Txt> : null}</View><Pressable accessibilityLabel={`Mashq: ${ph.en}`} onPress={() => { stopAudio(); router.navigate(`/practice/${id}`); }} style={{ width: d(36), height: d(36), alignItems: "center", justifyContent: "center" }}><Icon name="glyph-mic-violet" size={d(28)} /></Pressable></View>; })}</View>)}
    {!groups.length ? <Txt style={{ fontSize: d(14), fontFamily: "Nunito_800ExtraBold", color: c.muted, paddingVertical: d(16), textAlign: "center" }}>Birinchi darsdan keyin iboralaringiz shu yerda chiqadi.</Txt> : null}
  </ScrollView></Page>;
}
