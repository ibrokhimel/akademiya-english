import type { ViewProps } from "react-native";
import { SettingGroup } from "../SettingsControls";

/** A bordered, rounded group of rows (Settings look). */
export function RowGroup(props: ViewProps) {
  return <SettingGroup {...props} />;
}
