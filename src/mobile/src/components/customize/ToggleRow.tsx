import type { ReactNode } from "react";
import { View } from "react-native";
import { SettingToggle } from "../SettingsControls";
import { Icon,Txt,useTheme } from "../ui";
import { useDesignScale } from "../useDesignScale";

/** A row with a label, an optional small line under it and a switch. Lives inside a RowGroup. */
export function ToggleRow({ label, detail, value, onChange, icon, dimWhenOff = false, left }: {
  label: string;
  detail?: string;
  value: boolean;
  onChange: (on: boolean) => void;
  icon?: string;
  /** grey the label while the switch is off (the "what shows" list) */
  dimWhenOff?: boolean;
  /** something before the label, such as a drag handle */
  left?: ReactNode;
}) {
  const d = useDesignScale(), c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), paddingHorizontal: d(14), paddingVertical: d(10), minHeight: d(52) }}>
      {left}
      {icon ? <Icon name={icon} size={d(24)} /> : null}
      <View style={{ flex: 1, gap: d(2) }}>
        <Txt style={{ fontSize: d(15), fontFamily: "Nunito_800ExtraBold", color: dimWhenOff && !value ? c.muted : c.text }}>{label}</Txt>
        {detail ? <Txt style={{ fontSize: d(12), lineHeight: d(15.6), color: c.muted }}>{detail}</Txt> : null}
      </View>
      <SettingToggle label={label} value={value} onChange={onChange} />
    </View>
  );
}
