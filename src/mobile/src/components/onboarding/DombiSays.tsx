import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { dombiVoiceMs, hasDombiVoice, playDombi, stopAudio } from "../../lib/audio";
import { useApp } from "../../lib/store";
import { Dombi, type DombiMoment } from "../Dombi";
import { Txt, useTheme, violet } from "../ui";

const LINES = 3;

/**
 * Dombi with his speech bubble. The bubble shows three lines at most; a longer line scrolls inside it.
 * While he talks, the word being said gets a soft violet background and the text slides up so that word's
 * line is the bottom one. With a recording the highlight follows the voice; a line without one yet walks
 * at a talking pace. When he finishes the highlight goes and the learner can drag to read it all.
 */
export function DombiSays({ text, moment = "idle", size = 80, d }: { text: string; moment?: DombiMoment; size?: number; d: (n: number) => number }) {
  const c = useTheme(), { settings } = useApp();
  const words = useMemo(() => text.split(" "), [text]);
  // Where each word starts, as a share of the whole line by letters.
  const starts = useMemo(() => {
    const ends = words.reduce<number[]>((all, w) => [...all, (all.at(-1) ?? 0) + w.length + 1], []), total = ends.at(-1) ?? 1;
    return ends.map((end, i) => (end - words[i].length - 1) / total);
  }, [words]);
  // The word being said belongs to one line, so a new line starts with nothing highlighted.
  const [spoken, setSpoken] = useState({ text: "", i: -1 }), now = spoken.text === text ? spoken.i : -1;
  const setNow = useCallback((i: number) => setSpoken({ text, i }), [text]);
  const lh = d(22), [height, setHeight] = useState(0), [offset, setOffset] = useState(0);
  const tops = useRef<number[]>([]), scroll = useRef<ScrollView>(null), dragged = useRef(false);
  useEffect(() => {
    dragged.current = false;
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (!settings.sound) return;
    let stopped = false, walk: ReturnType<typeof setInterval> | undefined;
    const pick = (share: number) => {
      let i = 0;
      while (i + 1 < starts.length && starts[i + 1] <= share) i++;
      setNow(i);
    };
    const begin = setTimeout(() => {
      if (hasDombiVoice(text)) {
        const total = dombiVoiceMs(text) || 1;
        playDombi(text, true, (ms) => { if (!stopped) pick(ms / total); }).catch(() => {}).finally(() => { if (!stopped) setNow(-1); });
        return;
      }
      const total = words.reduce((n, w) => n + 180 + 55 * w.length, 0), from = Date.now();
      walk = setInterval(() => {
        const share = (Date.now() - from) / total;
        if (share >= 1) { clearInterval(walk); setNow(-1); } else pick(share);
      }, 60);
    }, 380);
    return () => { stopped = true; clearTimeout(begin); clearInterval(walk); stopAudio(); };
  }, [text, words, starts, settings.sound, setNow]);
  const shown = Math.min(height || lh, LINES * lh);
  useEffect(() => {
    if (now < 0 || dragged.current) return;
    const top = tops.current[now] ?? 0;
    scroll.current?.scrollTo({ y: Math.max(0, top - (LINES - 1) * lh), animated: true });
  }, [now, lh]);
  const more = height > shown + 1, fade = (top: boolean) => [0.85, 0.5, 0.2].map((o, i) => (
    <View key={i} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, height: d(4), [top ? "top" : "bottom"]: i * d(4), backgroundColor: c.card, opacity: o }} />
  ));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: d(12) }}>
      <Dombi moment={now >= 0 ? "explaining" : moment} size={d(size)} />
      <View accessible accessibilityLabel={text} style={{ flex: 1, flexDirection: "row", paddingVertical: d(12), paddingHorizontal: d(14), borderRadius: d(18), borderBottomLeftRadius: d(4), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card }}>
        <View style={{ flex: 1, height: shown }}>
          <ScrollView ref={scroll} showsVerticalScrollIndicator={false} scrollEnabled={more} onScrollBeginDrag={() => { dragged.current = true; }} onScroll={(e) => setOffset(e.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
            <View onLayout={(e) => setHeight(e.nativeEvent.layout.height)} style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -d(3) }}>
              {words.map((w, i) => (
                <View key={i} onLayout={(e) => { tops.current[i] = e.nativeEvent.layout.y; }} style={{ paddingHorizontal: d(3), borderRadius: d(6), backgroundColor: i === now ? c.soft : "transparent" }}>
                  <Txt importantForAccessibility="no" style={{ fontSize: d(16), lineHeight: lh, fontFamily: "Nunito_900Black", color: i === now ? violet : c.text }}>{w}</Txt>
                </View>
              ))}
            </View>
          </ScrollView>
          {more && offset > 1 ? fade(true) : null}
          {more && offset + shown < height - 1 ? fade(false) : null}
        </View>
        {more ? (
          <View style={{ width: d(4), height: shown, marginLeft: d(8), borderRadius: d(2), backgroundColor: c.line }}>
            <View style={{ position: "absolute", left: 0, right: 0, top: (offset / height) * shown, height: (shown / height) * shown, borderRadius: d(2), backgroundColor: violet }} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
