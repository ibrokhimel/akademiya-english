import { Pressable,View } from "react-native";
import { sound } from "../../lib/audio";
import { useApp } from "../../lib/store";
import { Icon,Txt,useTheme,violet } from "../ui";
import { useDesignScale } from "../useDesignScale";

export type ChipOption = {
  id: string;
  label: string;
  /** a locked chip cannot be picked and shows a lock */
  locked?: boolean;
  /** colour of the label, for chips that preview a colour */
  textColor?: string;
};
type Single = { multi?: false; value: string | null; onChange: (id: string) => void };
type Multi = { multi: true; value: string[]; onChange: (ids: string[]) => void; max?: number };

/** Pill chips in a wrapping row. Single select calls onChange(id); multi select toggles ids in an array. */
export function Chips({ options, ...pick }: { options: ChipOption[] } & (Single | Multi)) {
  const d = useDesignScale(), c = useTheme(), { settings } = useApp();
  const on = (id: string) => (pick.multi ? pick.value.includes(id) : pick.value === id);
  const press = (id: string) => {
    if (pick.multi) {
      const has = pick.value.includes(id);
      if (!has && pick.max !== undefined && pick.value.length >= pick.max) return;
      sound("pick", settings.sound);
      pick.onChange(has ? pick.value.filter((v) => v !== id) : [...pick.value, id]);
    } else {
      sound("pick", settings.sound);
      pick.onChange(id);
    }
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: d(10) }}>
      {options.map((o) => {
        const selected = on(o.id);
        return (
          <Pressable
            key={o.id}
            accessibilityRole={pick.multi ? "checkbox" : "radio"}
            accessibilityLabel={o.label}
            accessibilityState={{ selected, disabled: !!o.locked }}
            disabled={o.locked}
            onPress={() => press(o.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: d(6),
              height: d(40),
              paddingHorizontal: d(14),
              borderRadius: d(20),
              borderWidth: d(2),
              borderColor: selected ? violet : c.line,
              backgroundColor: selected ? c.soft : o.locked ? c.surface : c.card,
            }}
          >
            {o.locked ? <Icon name="glyph-lock-grey" size={d(16)} /> : null}
            <Txt style={{ fontSize: d(14), lineHeight: d(18), fontFamily: "Nunito_900Black", color: o.locked ? c.muted : o.textColor ?? (selected ? violet : c.text) }}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
