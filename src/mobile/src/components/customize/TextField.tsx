import { TextInput,View,type TextInputProps } from "react-native";
import { Txt,useTheme } from "../ui";
import { useDesignScale } from "../useDesignScale";

/** A label with an optional note at its right (a counter, "Band emas ✓"), and a rounded text box under it. */
export function TextField({ label, note, noteColor, ...input }: { label?: string; note?: string; noteColor?: string } & TextInputProps) {
  const d = useDesignScale(), c = useTheme();
  return (
    <View style={{ gap: d(6) }}>
      {label ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: d(8) }}>
          <Txt style={{ fontSize: d(14), fontFamily: "Nunito_900Black" }}>{label}</Txt>
          {note ? <Txt accessibilityLiveRegion="polite" style={{ fontSize: d(12), fontFamily: "Nunito_800ExtraBold", color: noteColor ?? c.muted }}>{note}</Txt> : null}
        </View>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...input}
        style={{ height: d(54), paddingHorizontal: d(16), borderRadius: d(16), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, color: c.text, fontSize: d(17), fontFamily: "Nunito_800ExtraBold" }}
      />
    </View>
  );
}
