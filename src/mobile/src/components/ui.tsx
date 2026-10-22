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
import { useAuditText } from "../audit/layout";
import { pictures } from "../data/assets";
import { sound } from "../lib/audio";
import { useApp } from "../lib/store";
import { Shine } from "./Motion";
import { RaisedPressable } from "./RaisedPressable";
import { ToggleControl } from "./ToggleControl";
import { useDesignScale } from "./useDesignScale";

export const violet = "#7B5CFF",
  coral = "#FF6B5B",
  green = "#3DCB6C",
  gold = "#FFC93C";
export function useTheme() {
  const { settings } = useApp();
  return settings.dark
    ? {
        bg: "#121214",
        card: "#1B1B1F",
        surface: "#242429",
        line: "#34343B",
        text: "#F4F4F6",
        muted: "#9C9CA6",
        soft: "#26214A",
        good: "#17352A",
        bad: "#3A1D22",
        edge: "#26262B",
        softLine: "#463C85",
        goldSoft: "#383014",
        blueSoft: "#12303F",
        ice: "#11323F",
        orangeWash: "#33240F", iceText: "#5BC8F5", cream: "#24211A", coralSoft: "#3A1F1B", orangeBand: "#4A3212", faint: "#5F5F69", tileOrange: "#33240F", tileGold: "#2E2812", tileGrey: "#24262B", tilePink: "#3A1C2B", goldText: "#FFC93C",
      }
    : {
        bg: "#FFFFFF",
        card: "#FFFFFF",
        surface: "#F6F6FA",
        line: "#E5E5E5",
        text: "#2B2B3C",
        muted: "#8A8AA0",
        soft: "#EFEBFF",
        good: "#E3F9EA",
        bad: "#FFE8EA",
        edge: "#B7B7B7",
        softLine: "#C9BDFF",
        goldSoft: "#FFF4D1",
        blueSoft: "#E8F6FD",
        ice: "#DDF4FF",
        orangeWash: "#FFF1DC", iceText: "#1491C9", cream: "#FFFDF3", coralSoft: "#FFEDEA", orangeBand: "#FFE2B8", faint: "#B7B7B7", tileOrange: "#FFF1E0", tileGold: "#FFF8E0", tileGrey: "#F1F3F7", tilePink: "#FFE8F3", goldText: "#C98A00",
      };
}
export function Txt({ style, ...props }: TextProps) {
  const d = useDesignScale();
  const textStyle = StyleSheet.flatten(style);
  const auditText = useAuditText({ ...props, style });
  const c = useTheme();
  return (
    <NativeText
      {...props}
      {...auditText}
      style={[
        {
          color: c.text,
          fontFamily: "Nunito_700Bold",
          fontSize: d(15),
          lineHeight: textStyle?.lineHeight ?? (textStyle?.fontSize ?? d(15)) * 1.4,
          includeFontPadding: false,
        },
        style,
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
            ? "#FF4B5C"
            : violet;
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
              ? "#27A852"
              : kind === "gold"
                ? "#E0A400"
                : kind === "danger"
                  ? "#C02A3D"
                  : "#5A3FD9"
      }
      radius={d(16)}
      depth={d(4)}
      faceStyle={{
        borderWidth: kind === "secondary" && !disabled ? d(2) : 0,
        borderColor: c.line,
        minHeight: d(48),
        paddingHorizontal: d(24),
        height: d(48),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Txt
        style={{
          color: disabled
            ? c.muted
            : kind === "secondary"
              ? violet
              : "#FFFFFF",
          fontFamily: "Nunito_900Black",
          fontSize: d(15),
          lineHeight: d(21),
          letterSpacing: d(0.6),
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
}: ViewProps & { scroll?: boolean }) {
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
  return (
    <View style={{ gap: 8 }}>
      <Txt
        style={{ fontSize: 27, lineHeight: 34, fontFamily: "Nunito_900Black" }}
      >
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
        fontSize: d(12),
        letterSpacing: d(.6),
        fontFamily: "Nunito_900Black",
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
  heading: { fontSize: 28, lineHeight: 35, fontFamily: "Nunito_900Black" },
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
      />
    </View>
  );
}
