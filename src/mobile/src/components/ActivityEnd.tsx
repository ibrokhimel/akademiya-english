import { View } from "react-native";
import { Dombi } from "./Dombi";
import { brand, type } from "./system";
import { useDs } from "./TabChrome";
import { Button, Page, Txt } from "./ui";
import { useDesignScale } from "./useDesignScale";

// "C4 · End", the owner's pick B (round 4): Dombi centred, the kicker, how many were right. Shared by Catch, Overheard and Fix it.
export function ActivityEnd({ of, right, onDone }: { of: number; right: number; onDone: () => void }) {
  const d = useDesignScale(), ds = useDs();
  return (
    <Page>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: d(10) }}>
        <Dombi moment="activityEnd" size={d(80)} />
        <Txt style={{ ...type("label", d), color: brand.main }}>MASHQ TUGADI</Txt>
        <Txt style={{ ...type("title", d), color: ds.ink, textAlign: "center" }}>{of} tadan {right} tasi to&apos;g&apos;ri</Txt>
      </View>
      <Button label="DAVOM ETISH" onPress={onDone} />
    </Page>
  );
}
