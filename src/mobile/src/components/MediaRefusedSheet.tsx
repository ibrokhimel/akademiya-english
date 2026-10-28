import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheet,SheetHandle } from "./BottomSheet";
import { Button,Icon,Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";

/**
 * "Video juda uzun" (screen bOPGj): a GIF or video over 6 seconds or 8 MB. One sheet for both, the copy covers both.
 * Nothing is trimmed (Ruling 7); BOSHQASINI TANLASH opens the gallery again.
 */
export function MediaRefusedSheet({ visible, onClose, onPickAnother }: { visible: boolean; onClose: () => void; onPickAnother: () => void }) {
  const d = useDesignScale(), c = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.card, borderTopLeftRadius: d(28), borderTopRightRadius: d(28), borderWidth: d(2), borderBottomWidth: 0, borderColor: c.line }}>
        <View style={{ paddingHorizontal: d(20), paddingTop: d(10), paddingBottom: d(28), gap: d(12), alignItems: "center" }}>
          <SheetHandle />
          <Icon name="pet-black-thinking" size={d(44)} />
          <Txt style={{ fontSize: d(20), lineHeight: d(26), fontFamily: "Nunito_900Black", textAlign: "center" }}>Video juda uzun</Txt>
          <Txt style={{ fontSize: d(13), lineHeight: d(18), color: c.muted, textAlign: "center" }}>6 soniyagacha va 8 MB gacha bo&apos;lgan video tanlang.</Txt>
          <View style={{ alignSelf: "stretch", marginTop: d(4) }}>
            <Button label="BOSHQASINI TANLASH" onPress={() => { onClose(); onPickAnother(); }} />
          </View>
        </View>
      </SafeAreaView>
    </BottomSheet>
  );
}

/**
 * The refused sheet wired to a pick: `refuse(key)` opens it for that pick; BOSHQASINI TANLASH closes it and calls
 * `pickAgain(key)` once the sheet is gone (iOS cannot open the gallery over a closing sheet).
 */
export function useRefusedSheet<K>(pickAgain: (key: K) => void) {
  const [refused, setRefused] = useState<{ key: K } | null>(null);
  const sheet = (
    <MediaRefusedSheet
      visible={refused !== null}
      onClose={() => setRefused(null)}
      onPickAnother={() => { if (refused) { const { key } = refused; setTimeout(() => pickAgain(key), 450); } }}
    />
  );
  return { refuse: (key: K) => setRefused({ key }), sheet };
}
