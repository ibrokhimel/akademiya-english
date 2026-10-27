import type { ReactNode } from "react";
import { View } from "react-native";
import { RaisedPressable } from "../RaisedPressable";
import { Icon, Txt, useTheme } from "../ui";

export type Scale = (n: number) => number;

/** A big centred heading. */
export function Heading({ text, d, size = 24 }: { text: string; d: Scale; size?: number }) {
  return <Txt style={{ fontSize: d(size), lineHeight: d(size * 1.3), textAlign: "center", fontFamily: "Nunito_900Black" }}>{text}</Txt>;
}

/** A small caps label over a group. */
export function Label({ text, d, color }: { text: string; d: Scale; color?: string }) {
  const c = useTheme();
  return <Txt style={{ fontSize: d(12), letterSpacing: d(0.6), fontFamily: "Nunito_900Black", color: color ?? c.muted }}>{text}</Txt>;
}

/** A soft grey panel that holds a group. */
export function Panel({ children, d, tint }: { children: ReactNode; d: Scale; tint?: string }) {
  const c = useTheme();
  return <View style={{ alignSelf: "stretch", padding: d(16), gap: d(12), borderRadius: d(20), backgroundColor: tint ?? c.surface }}>{children}</View>;
}

/** An icon (in a soft box when `boxed`) with a title and a line under it. */
export function InfoRow({ icon, title, detail, d, boxed }: { icon: string; title: string; detail?: string; d: Scale; boxed?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}>
      {boxed ? (
        <View style={{ width: d(44), height: d(44), borderRadius: d(14), backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={d(26)} />
        </View>
      ) : <Icon name={icon} size={d(icon.startsWith("lesson-") ? 40 : 30)} />}
      <View style={{ flex: 1, gap: d(2) }}>
        <Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>{title}</Txt>
        {detail ? <Txt style={{ fontSize: d(13), color: c.muted }}>{detail}</Txt> : null}
      </View>
    </View>
  );
}

/** A reward or summary tile: icon, a value and what it means. */
export function Tile({ icon, value, detail, d, tint }: { icon: string; value: string; detail: string; d: Scale; tint?: string }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, padding: d(14), gap: d(6), borderRadius: d(18), backgroundColor: tint ?? c.surface }}>
      <Icon name={icon} size={d(28)} />
      <Txt style={{ fontSize: d(18), fontFamily: "Nunito_900Black" }}>{value}</Txt>
      <Txt style={{ fontSize: d(13), color: c.muted }}>{detail}</Txt>
    </View>
  );
}

/** One answer of a question: a raised card with an icon, a label and an optional line or number. */
export function Choice({ label, icon, selected, dimmed, onPress, detail, number, d }: {
  label: string; icon: string; selected: boolean; dimmed?: boolean; onPress: () => void; detail?: string; number?: number; d: Scale;
}) {
  const c = useTheme();
  return (
    <RaisedPressable
      accessibilityRole="button"
      soundName="pick"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      backgroundColor={selected ? c.soft : c.card}
      edgeColor={selected ? "#7A5CFF" : c.line}
      radius={d(16)}
      depth={d(number ? 3 : 4)}
      style={{ opacity: dimmed ? 0.55 : 1 }}
      faceStyle={{ flexDirection: "row", alignItems: "center", gap: d(number ? 12 : 14), paddingVertical: d(number ? 10 : 14), paddingHorizontal: d(number ? 14 : 16), borderWidth: d(2), borderColor: selected ? c.accent : c.line }}
    >
      <Icon name={icon} size={d(detail ? 37 : number ? 34 : 28)} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt style={{ fontSize: d(number ? 16 : 17), fontFamily: "Nunito_900Black", color: selected ? c.accent : c.text }}>{label}</Txt>
        {detail ? <Txt style={{ fontSize: d(13), color: c.muted }}>{detail}</Txt> : null}
      </View>
      {number ? (
        <Txt style={{ fontSize: d(14), color: c.muted, fontFamily: "Nunito_900Black" }}>{number}</Txt>
      ) : !detail ? (
        <View style={{ width: d(24), height: d(24), borderRadius: 12, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", opacity: selected ? 1 : 0 }}>
          <Icon name="glyph-check-white" size={d(14)} />
        </View>
      ) : null}
    </RaisedPressable>
  );
}
