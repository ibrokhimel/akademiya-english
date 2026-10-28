import type { ReactNode } from "react";
import { Pressable,View,type ViewProps } from "react-native";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { ToggleControl } from "./ToggleControl";
import { Icon,Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";
export function ScreenHeader({ title, onBack, sub }: {
    title: string;
    onBack: () => void;
    sub?: string;
}) {
    const d = useDesignScale(), c = useTheme();
    const { settings } = useApp();
    return (<View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: d(sub ? 10 : 8),
            paddingHorizontal: d(sub ? 12 : 10),
            paddingTop: d(4),
            paddingBottom: d(sub ? 8 : 12),
        }}>
      <Pressable accessibilityLabel="Ortga" onPress={() => {
            sound("back", settings.sound);
            onBack();
        }} style={{
            width: d(32),
            height: d(32),
            alignItems: "center",
            justifyContent: "center",
        }}>
        <Icon name="glyph-chevron-left-grey" size={d(32)}/>
      </Pressable>
      <View><Txt style={{ fontSize: d(22), lineHeight: d(sub ? 26.4 : 30.8), fontFamily: "Nunito_900Black" }}>{title}</Txt>{sub ? <Txt style={{ fontSize: d(13), fontFamily: "Nunito_800ExtraBold", color: c.muted }}>{sub}</Txt> : null}</View>
    </View>);
}
export function SettingGroup({ children, style }: ViewProps) {
    const d = useDesignScale();
    const c = useTheme();
    return (<View style={[
            {
                borderRadius: d(16),
                borderWidth: d(2),
                borderColor: c.line,
                overflow: "hidden",
            },
            style,
        ]}>
      {children}
    </View>);
}
export function SettingRow({ icon, label, detail, value, right, onPress, danger = false, }: {
    icon: string;
    label: string;
    detail?: ReactNode;
    value?: string;
    right?: ReactNode;
    onPress?: () => void;
    danger?: boolean;
}) {
    const d = useDesignScale();
    const c = useTheme();
    const { settings } = useApp();
    const content = (<>
      <Icon name={icon} size={d(24)}/>
      <View style={{ flex: 1, gap: d(2) }}>
        <Txt style={{
            fontSize: d(15),
            color: danger ? "#FF4B5C" : c.text,
            fontFamily: "Nunito_800ExtraBold",
        }}>
          {label}
        </Txt>
        {detail ? typeof detail === "string" ? <Txt style={{ fontSize: d(12), lineHeight: d(15.6), color: c.muted }}>{detail}</Txt> : detail : null}
      </View>
      {value ? (<Txt style={{ fontSize: d(14), color: c.accentText, fontFamily: "Nunito_900Black" }}>
          {value}
        </Txt>) : null}
      {right || (onPress && !danger) ? (<>{right || <Icon name="glyph-chevron-right-grey" size={d(22)}/>}</>) : null}
    </>);
    return onPress ? (<Pressable onPress={() => {
            sound("button", settings.sound);
            onPress();
        }} style={{
            flexDirection: "row",
            alignItems: "center",
            gap: d(12),
            paddingHorizontal: d(14),
            paddingVertical: d(10),
            minHeight: d(48),
        }}>
      {content}
    </Pressable>) : (<View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: d(12),
            paddingHorizontal: d(14),
            paddingVertical: d(10),
            minHeight: d(48),
        }}>
      {content}
    </View>);
}
export function SettingToggle({ label, value, onChange, }: {
    label: string;
    value: boolean;
    onChange: (on: boolean) => void;
}) {
    const c = useTheme();
    return <ToggleControl label={label} value={value} onChange={onChange} offColor={c.line} onColor={c.accent} />;
}
