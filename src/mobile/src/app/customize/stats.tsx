import { useState } from "react";
import { Pressable,ScrollView,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toggleStat } from "../../../../core/showcase.js";
import { BottomSheet,SheetHandle } from "../../components/BottomSheet";
import { Chips } from "../../components/customize/Chips";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { RowGroup } from "../../components/customize/RowGroup";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { TextField } from "../../components/customize/TextField";
import { ToggleRow } from "../../components/customize/ToggleRow";
import { FavouritePhraseRow } from "../../components/ProfileStats";
import { Txt,useTheme,violet } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { P } from "../../data/content";
import { statRows } from "../../data/stats";
import { newestPhrases } from "../../lib/progressExtras";
import { useApp,useProfile } from "../../lib/store";

/** The phrases the learner has met, newest first; tapping one picks it. */
function PhraseSheet({ visible, value, onPick, onClose }: { visible: boolean; value: string | null; onPick: (id: string) => void; onClose: () => void }) {
  const d = useDesignScale(), c = useTheme(), { events } = useApp();
  const ids = newestPhrases(events, Infinity).filter((id) => P[id]);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SafeAreaView edges={["bottom"]} style={{ maxHeight: "80%", backgroundColor: c.card, borderTopLeftRadius: d(28), borderTopRightRadius: d(28), borderWidth: d(2), borderBottomWidth: 0, borderColor: c.line }}>
        <View style={{ paddingHorizontal: d(20), paddingTop: d(10), gap: d(12) }}>
          <SheetHandle />
          <Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black" }}>Sevimli ibora</Txt>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: d(20), paddingTop: d(12), paddingBottom: d(24), gap: d(8) }}>
          {ids.map((id) => (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === id }}
              accessibilityLabel={P[id].en}
              onPress={() => { onPick(id); onClose(); }}
              style={{ padding: d(12), borderRadius: d(16), borderWidth: d(2), borderColor: value === id ? violet : c.line, backgroundColor: value === id ? c.soft : c.card, gap: d(2) }}
            >
              <Txt style={{ fontSize: d(16), fontFamily: "Nunito_900Black", color: value === id ? violet : c.text }}>{P[id].en}</Txt>
              <Txt style={{ fontSize: d(12), color: c.muted }}>{P[id].uz}</Txt>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </BottomSheet>
  );
}

/**
 * Statistika (screen sMQbm): the layout, which numbers show, the favourite phrase (played in the learner's own voice when
 * saving the voice is on and a recording exists), the word of the week and private mode.
 */
export default function StatsEditor() {
  const { events } = useApp(), { profile, setProfile } = useProfile(), s = profile.stats;
  const [layout, setLayout] = useState(s.layout), [shown, setShown] = useState(s.shown);
  const [favouritePhrase, setFavouritePhrase] = useState(s.favouritePhrase), [wordOfWeek, setWordOfWeek] = useState(s.wordOfWeek);
  const [hidden, setHidden] = useState(s.private), [sheet, setSheet] = useState(false);
  const hasPhrases = newestPhrases(events, 1).length > 0;
  const toggle = (id: string, on: boolean) => setShown((list) => toggleStat(list, id, on));
  return (
    <EditorScreen title="Statistika" onSave={() => setProfile((p) => ({ ...p, stats: { layout, shown, favouritePhrase, wordOfWeek: wordOfWeek.trim(), private: hidden } }))}>
      <SectionLabel first>KO&apos;RINISHI</SectionLabel>
      <Chips options={[{ id: "big", label: "Bitta katta" }, { id: "grid", label: "2 × 2" }]} value={layout} onChange={(id) => setLayout(id as typeof layout)} />
      <SectionLabel>QAYSI RAQAMLAR</SectionLabel>
      <RowGroup>
        {statRows.map((r) => <ToggleRow key={r.id} icon={r.icon} label={r.label} value={shown.includes(r.id)} onChange={(on) => toggle(r.id, on)} />)}
      </RowGroup>
      <SectionLabel>SEVIMLI IBORA</SectionLabel>
      <FavouritePhraseRow phraseId={favouritePhrase} onPress={hasPhrases ? () => setSheet(true) : undefined} empty={hasPhrases ? "Ibora tanlang" : "Hali ibora yo'q"} />
      <SectionLabel>HAFTA SO&apos;ZI</SectionLabel>
      <TextField accessibilityLabel="Hafta so'zi" value={wordOfWeek} onChangeText={setWordOfWeek} maxLength={30} autoCapitalize="none" />
      <RowGroup>
        <ToggleRow icon="glyph-shield-grey" label="Shaxsiy rejim" detail="Profilda hech qanday raqam ko'rinmaydi" value={hidden} onChange={setHidden} />
      </RowGroup>
      <PhraseSheet visible={sheet} value={favouritePhrase} onPick={setFavouritePhrase} onClose={() => setSheet(false)} />
    </EditorScreen>
  );
}
