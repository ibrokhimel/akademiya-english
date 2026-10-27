import * as Haptics from "expo-haptics";
import { useSegments } from "expo-router";
import type { ReactNode } from "react";
import {
Image,
Text as NativeText,
Pressable,
ScrollView,
StyleSheet,
useWindowDimensions,
View,
type ImageStyle,
type StyleProp,
type TextProps,
type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { textScale } from "../../../core/look.js";
import { useAuditText } from "../audit/layout";
import { pictures } from "../data/assets";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { Shine } from "./Motion";
import { RaisedPressable } from "./RaisedPressable";
import { brand,shared,type } from "./system";
import { appThemes,brandColors } from "./themeColors";
import { ToggleControl } from "./ToggleControl";
import { useDesignScale } from "./useDesignScale";

// Interface colours come from the shared design system (design/system/tokens.json).
// App chrome (buttons, picks, progress) takes the theme's `c.accent`; `violet` stays the fixed brand violet for art
// stand-ins and catalogue colours (an avatar or a name picked as "Binafsha" stays violet in every theme).
const NAMED = brandColors(shared, brand);
export const violet = NAMED.violet,
  coral = NAMED.coral,
  green = NAMED.green,
  gold = NAMED.gold;
const THEMES = appThemes(shared);
/** The palette for the picked theme (MAVZU) in light or dark (REJIM). */
export function useTheme() {
  const { settings, isDark } = useApp();
  const mode = isDark ? THEMES.dark : THEMES.light;
  return mode[settings.appLook.theme] ?? mode.violet;
}
// Disleksiya uchun shrift: OpenDyslexic (assets/fonts, loaded in app/_layout.tsx) in place of Nunito's weights.
const DYSLEXIC: Record<string, string> = {
  Nunito_700Bold: "OpenDyslexic_400Regular",
  Nunito_800ExtraBold: "OpenDyslexic_700Bold",
  Nunito_900Black: "OpenDyslexic_700Bold",
};
export function Txt({ style, ...props }: TextProps) {
  const d = useDesignScale();
  const textStyle = StyleSheet.flatten(style);
  const auditText = useAuditText({ ...props, style });
  const c = useTheme();
  const { appLook } = useApp().settings;
  // MATN O'LCHAMI and the font, laid over the finished style so every size and family a screen sets follows them
  const k = textScale(appLook.textSize), size = textStyle?.fontSize ?? d(16);
  const look = k !== 1 || appLook.dyslexiaFont
    ? {
        fontSize: size * k,
        lineHeight: (textStyle?.lineHeight ?? size * 1.42) * k,
        ...(appLook.dyslexiaFont ? { fontFamily: DYSLEXIC[textStyle?.fontFamily ?? "Nunito_700Bold"] ?? DYSLEXIC.Nunito_700Bold } : null),
      }
    : null;
  return (
    <NativeText
      {...props}
      {...auditText}
      style={[
        {
          color: c.text,
          fontFamily: "Nunito_700Bold",
          fontSize: d(16),
          lineHeight: textStyle?.lineHeight ?? (textStyle?.fontSize ?? d(16)) * 1.42,
          includeFontPadding: false,
        },
        style,
        look,
      ]}
    />
  );
}
export function Icon({
  name,
  size = 26,
  style,
}: {
  name: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const source = pictures[name];
  return source ? (
    <Image
      source={source}
      onError={
        __DEV__
          ? (event) =>
              console.warn(`Artwork ${name}: ${event.nativeEvent.error}`)
          : undefined
      }
      resizeMode="contain"
      style={[{ width: size, height: size }, style]}
    />
  ) : (
    <View style={{ width: size, height: size }} />
  );
}
export function Picture({
  name,
  size = 150,
}: {
  name?: string;
  size?: number;
}) {
  if (!name) return null;
  return name.startsWith("text:") ? (
    <Txt style={{ fontSize: 32, textAlign: "center", padding: 12 }}>
      {name.slice(5)}
    </Txt>
  ) : (
    <Icon
      name={name.startsWith("icon:") ? name.slice(5) : `lesson-${name}`}
      size={size}
    />
  );
}
export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "green" | "gold" | "danger";
  disabled?: boolean;
  testID?: string;
}) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const d = (n: number) => n * Math.min(width / 390, 1.2);
  const bg = disabled
    ? c.line
    : kind === "secondary"
      ? c.card
      : kind === "green"
        ? green
        : kind === "gold"
          ? gold
          : kind === "danger"
            ? c.dangerFill
            : c.accent;
  return (
    <RaisedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      backgroundColor={bg}
      edgeColor={
        disabled
          ? c.edge
          : kind === "secondary"
            ? c.line
            : kind === "green"
              ? shared.light.correctLip
              : kind === "gold"
                ? shared.light.rewardLip
                : kind === "danger"
                  ? c.dangerLip
                  : c.accentLip
      }
      radius={d(16)}
      depth={d(4)}
      faceStyle={{
        borderWidth: kind === "secondary" && !disabled ? d(2) : 0,
        borderColor: c.line,
        // grows with MATN O'LCHAMI and the dyslexia font instead of clipping the label
        minHeight: d(48),
        paddingHorizontal: d(24),
        paddingVertical: d(10),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Txt
        style={{
          color: disabled
            ? c.muted
            : kind === "secondary"
              ? c.accentText
              : kind === "primary"
                ? c.onAccent
                : c.onFill,
          ...type("button", d),
          textAlign: "center",
        }}
      >
        {label}
      </Txt>
      {!disabled && kind !== "secondary" ? <Shine /> : null}
    </RaisedPressable>
  );
}
export function LinkButton({
  label,
  onPress,
  color,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  compact?: boolean;
}) {
  const c = useTheme();
  const { settings } = useApp();
  const { width } = useWindowDimensions();
  const d = (n: number) => n * Math.min(width / 390, 1.2);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        sound(/ORTGA|BEKOR/.test(label) ? "back" : "button", settings.sound);
        onPress();
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        paddingTop: d(compact ? 6 : 10),
        paddingBottom: d(compact ? 0 : 10),
        paddingHorizontal: d(8),
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <Txt
        style={{
          color: color ?? c.muted,
          fontSize: d(compact ? 14 : 13),
          letterSpacing: d(0.5),
          fontFamily: "Nunito_900Black",
          textAlign: "center",
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Page({
  children,
  scroll = false,
  style,
  backdrop,
}: ViewProps & { scroll?: boolean; /** drawn behind the content, filling the page (the lesson background) */ backdrop?: ReactNode }) {
  const c = useTheme(),
    segments = useSegments();
  const d = useDesignScale();
  const supplied = StyleSheet.flatten(style);
  const spacing = { padding: d(20), gap: d(16), paddingBottom: supplied?.paddingBottom ?? supplied?.paddingVertical ?? supplied?.padding ?? d(28) };
  return (
    <SafeAreaView
      edges={
        segments[0] === "(tabs)"
          ? ["top", "left", "right"]
          : ["top", "bottom", "left", "right"]
      }
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      {backdrop}
      {scroll ? (
        <ScrollView contentContainerStyle={[s.page, spacing, style]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[s.page, spacing, { flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
export function Title({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: string;
}) {
  const c = useTheme();
  const d = useDesignScale();
  return (
    <View style={{ gap: 8 }}>
      <Txt style={type("title", d)}>
        {children}
      </Txt>
      {sub ? <Txt style={{ color: c.muted, lineHeight: 23 }}>{sub}</Txt> : null}
    </View>
  );
}
export function Card({ children, style }: ViewProps) {
  const c = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderWidth: 2,
          borderColor: c.line,
          borderRadius: 20,
          padding: 18,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Row({ children }: { children: ReactNode }) {
  return <View style={s.row}>{children}</View>;
}
export function Section({ children, style }: { children: ReactNode; style?: TextProps["style"] }) {
  const c = useTheme();
  const d = useDesignScale();
  return (
    <Txt
      style={[{
        color: c.muted,
        ...type("label", d),
        marginTop: d(6),
      }, style]}
    >
      {children}
    </Txt>
  );
}
export const s = StyleSheet.create({
  page: { padding: 20, gap: 16, paddingBottom: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  heading: type("title"),
  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 16,
    minHeight: 54,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 9,
  },
});

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        justifyContent: "space-between",
        paddingVertical: 6,
      }}
    >
      <Txt style={{ flex: 1 }}>{label}</Txt>
      <ToggleControl
        label={label}
        value={value}
        onChange={onChange}
        offColor={c.line}
        onColor={c.accent}
      />
    </View>
  );
}
