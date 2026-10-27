import type { ReactNode } from "react";
import { View } from "react-native";
import { Arrive } from "./Motion";
import { Icon,Txt,useTheme,violet } from "./ui";
import { useDesignScale } from "./useDesignScale";

/**
 * Banner, avatar overlapping it, name and a line beside the avatar. The Profile tab and the Customize hub preview both use it.
 * Today it draws the soft banner colour and a letter avatar. The slots let the avatar, frame and banner work replace those:
 *  - `banner` fills the banner area (behind `actions` and `date`)
 *  - `avatar(size)` replaces the letter inside the avatar circle
 *  - `frame(size, avatar)` wraps the avatar; the default is a ring in the card colour
 */
export function ProfileHeader({ name, level, caption, date, actions, banner, avatar, frame, compact = false, animate = false }: {
  name: string;
  /** shows the "N-daraja" pill */
  level?: number;
  /** small grey line under the name (the hub preview) */
  caption?: string;
  /** small text at the banner's bottom right (join month) */
  date?: string;
  /** buttons at the banner's top right (Profile tab only) */
  actions?: ReactNode;
  banner?: ReactNode;
  avatar?: (size: number) => ReactNode;
  frame?: (size: number, avatar: ReactNode) => ReactNode;
  /** the smaller card used by the hub preview */
  compact?: boolean;
  /** fade the name row in, like the rest of the Profile tab */
  animate?: boolean;
}) {
  const d = useDesignScale(), c = useTheme();
  const size = d(compact ? 62 : 96), ring = d(compact ? 3 : 4), over = compact ? 30 : 26;
  const letter = (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: violet, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {avatar ? avatar(size) : (
        <Txt style={{ fontSize: d(compact ? 28 : 43), color: "#FFFFFF", fontFamily: "Nunito_900Black" }}>{(name[0] || "?").toUpperCase()}</Txt>
      )}
    </View>
  );
  const framed = frame ? frame(size, letter) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring, borderColor: c.card, overflow: "hidden" }}>{letter}</View>
  );
  const row = (
    <>
      <View style={{ position: "absolute", left: 0, top: d(-over), width: size, height: size }}>{framed}</View>
      <Txt
        numberOfLines={1}
        style={{
          position: "absolute",
          left: d(compact ? 78 : 110),
          right: level === undefined ? 0 : d(104),
          top: d(compact ? 10 : 24),
          fontSize: d(compact ? 20 : 26),
          lineHeight: d(compact ? 24 : 29),
          fontFamily: "Nunito_900Black",
        }}
      >
        {name}
      </Txt>
      {caption ? (
        <Txt numberOfLines={1} style={{ position: "absolute", left: d(78), right: 0, top: d(38), fontSize: d(12), color: c.muted, fontFamily: "Nunito_700Bold" }}>
          {caption}
        </Txt>
      ) : null}
      {level !== undefined ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            top: d(29),
            flexDirection: "row",
            gap: d(6),
            alignItems: "center",
            paddingVertical: d(6),
            paddingHorizontal: d(8),
            borderRadius: 99,
            backgroundColor: c.soft,
          }}
        >
          <Icon name="level-badge" size={d(18)} />
          <Txt style={{ fontSize: d(12), color: violet, fontFamily: "Nunito_900Black" }}>{level}-daraja</Txt>
        </View>
      ) : null}
    </>
  );
  const rowStyle = { height: d(compact ? 72 : 68) };
  return (
    <View
      style={compact ? { borderRadius: d(20), borderWidth: d(2), borderColor: c.line, backgroundColor: c.card, overflow: "hidden" } : undefined}
    >
      <View style={{ height: d(compact ? 84 : 199), backgroundColor: c.soft, position: "relative" }}>
        {banner}
        {actions ? <View style={{ position: "absolute", right: d(14), top: d(8), flexDirection: "row", gap: d(8) }}>{actions}</View> : null}
        {date ? (
          <Txt style={{ position: "absolute", right: d(14), bottom: d(6), fontSize: d(11), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>{date}</Txt>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: d(compact ? 14 : 20) }}>
        {animate ? <Arrive style={rowStyle}>{row}</Arrive> : <View style={rowStyle}>{row}</View>}
      </View>
    </View>
  );
}
