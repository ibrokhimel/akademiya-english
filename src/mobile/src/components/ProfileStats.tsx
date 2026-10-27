import { useFocusEffect } from "expo-router";
import { useCallback,useRef,useState,type ReactNode } from "react";
import { Pressable,View } from "react-native";
import { statsToShow } from "../../../core/showcase.js";
import { P } from "../data/content";
import { statRows } from "../data/stats";
import { play,stopAudio } from "../lib/audio";
import { prediction } from "../lib/progressExtras";
import { useApp } from "../lib/store";
import { playVoice } from "../lib/voicePlayback";
import { AudioBars,Count } from "./Motion";
import { Icon,Txt,useTheme,violet } from "./ui";
import { useDesignScale } from "./useDesignScale";

type Value = { value: number; suffix: string } | { text: string };

/** Today's value of every stat; a stat with nothing to say (no prediction once level 1 is reached) is left out. */
export function useStatValues() {
  const { events, facts: f, progress: p } = useApp();
  const values = new Map<string, Value>([
    ["phrases", { value: p.phrases, suffix: " ibora" }],
    ["streak", { value: p.streak.count, suffix: " kun" }],
    ["minutesSpoken", { value: f.minutes, suffix: " daqiqa" }],
    ["lessons", { value: Object.keys(p.done).length, suffix: " dars" }],
    ["level", { value: p.level, suffix: "-daraja" }],
  ]);
  const guess = prediction(events, p.level);
  if (guess) values.set("prediction", { text: guess });
  return values;
}

/**
 * UMUMIY KO'RINISH: the stats the learner picked, as a 2 x 2 grid or the first one big with the rest under it; nothing in private mode.
 * `label` is the section heading, drawn only when there is something under it. `extra` keeps the test-build tiles.
 */
export function StatsBlock({ label, extra }: { label: ReactNode; extra?: ReactNode }) {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp(), values = useStatValues();
  const ids = statsToShow(settings.profile, new Set(values.keys()));
  const big = settings.profile.stats.layout === "big" && ids.length ? ids[0] : null;
  const number = (id: string, size: number) => {
    const v = values.get(id)!;
    return "text" in v ? <Txt style={{ fontSize: d(size), fontFamily: "Nunito_900Black" }}>{v.text}</Txt> : <Count value={v.value} suffix={v.suffix} style={{ fontSize: d(size) }} />;
  };
  if (!ids.length && !extra) return null;
  return (<>
    {label}
    <View style={{ gap: d(14) }}>
      {big ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: d(14), padding: d(16), borderRadius: d(20), backgroundColor: c.soft }}>
          <Icon name={statRows.find((s) => s.id === big)!.icon} size={d(48)} />
          {number(big, 32)}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: d(14), columnGap: d(10) }}>
        {ids.filter((id) => id !== big).map((id) => (
          <View key={id} style={{ width: d(170), flexDirection: "row", alignItems: "center", gap: d(10) }}>
            <Icon name={statRows.find((s) => s.id === id)!.icon} size={d(30)} />
            {number(id, 18)}
          </View>
        ))}
        {extra}
      </View>
    </View>
  </>);
}

/** Plays a phrase: the learner's own recording when saving the voice is on and one exists, otherwise the course audio. */
export function usePhrasePlayer() {
  const { settings, recordings } = useApp();
  const [playing, setPlaying] = useState(false), run = useRef(0);
  useFocusEffect(useCallback(() => () => { run.current++; setPlaying(false); stopAudio(); }, []));
  // the newest recording of the phrase (the list is kept newest first, but older stores may hold more than one)
  const own = (id: string | null) => (settings.saveVoice && id ? recordings.filter((r) => r.phraseId === id).sort((a, b) => b.at.localeCompare(a.at))[0] : undefined);
  const toggle = async (id: string) => {
    const n = ++run.current, ph = P[id];
    stopAudio();
    if (playing || !ph) { setPlaying(false); return; }
    setPlaying(true);
    try {
      const recording = own(id);
      if (recording) {
        try { await playVoice(recording.uri, () => run.current === n); } catch { if (run.current === n) await play(ph.voice, ph.en, settings.cast); }
      } else await play(ph.voice, ph.en, settings.cast);
    } catch {
      // nothing to say: the button just stops
    } finally {
      if (run.current === n) setPlaying(false);
    }
  };
  return { playing, toggle, ownVoice: (id: string | null) => !!own(id) };
}

/** The favourite phrase: a speaker tile, the phrase and whose voice plays. In the editor a chevron opens the phrase list. */
export function FavouritePhraseRow({ phraseId, onPress, empty }: { phraseId: string | null; onPress?: () => void; /** the line when no phrase is picked */ empty?: string }) {
  const d = useDesignScale(), c = useTheme(), player = usePhrasePlayer(), ph = phraseId ? P[phraseId] : undefined;
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? ph?.en ?? empty : undefined}
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: d(12), padding: d(12), borderRadius: d(18), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card }}
    >
      <Pressable
        disabled={!ph}
        accessibilityRole="button"
        accessibilityLabel={ph ? `Tinglash: ${ph.en}` : undefined}
        onPress={() => { if (phraseId) void player.toggle(phraseId); }}
        style={{ width: d(44), height: d(44), borderRadius: d(12), backgroundColor: c.soft, alignItems: "center", justifyContent: "center", opacity: ph ? 1 : 0.5 }}
      >
        {player.playing ? <AudioBars color={violet} size={d(18)} /> : <Icon name="glyph-speaker-violet" size={d(24)} />}
      </Pressable>
      <View style={{ flex: 1, gap: d(2) }}>
        <Txt style={{ fontSize: d(16), fontFamily: "Nunito_900Black", color: ph ? c.text : c.muted }}>{ph ? ph.en : empty}</Txt>
        {ph ? <Txt style={{ fontSize: d(12), color: c.muted }}>{player.ownVoice(phraseId) ? "O'z ovozingiz bilan" : ph.uz}</Txt> : null}
      </View>
      {onPress ? <Icon name="glyph-chevron-right-grey" size={d(22)} /> : null}
    </Pressable>
  );
}
