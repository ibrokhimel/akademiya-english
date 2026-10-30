import { useState } from "react";
import { View } from "react-native";
import { seasonOpen } from "../../../../core/customize.js";
import { Avatar } from "../../components/Avatar";
import { AvatarFrame } from "../../components/AvatarFrame";
import { ChoiceTiles,CosmeticFace,choicesFrom } from "../../components/customize/ChoiceTiles";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { useDesignScale } from "../../components/useDesignScale";
import { frameGroups,frames } from "../../data/cosmetics";
import { useApp,useProfile } from "../../lib/store";

/**
 * Ramka (screen kReMk): one section per group. Earned frames open from real progress (locked ones show their goal),
 * seasonal frames open only in their date window.
 */
export default function FrameEditor() {
  const d = useDesignScale(), { settings, now } = useApp(), { profile, setProfile, earned } = useProfile();
  const [frame, setFrame] = useState(profile.frame);
  const today = now();
  const name = settings.name.trim() || "Siz";
  return (
    <EditorScreen title="Ramka" onSave={() => setProfile({ frame })}>
      <View style={{ alignItems: "center", paddingVertical: d(6) }}>
        <AvatarFrame id={frame} size={d(130)}>
          <Avatar avatar={profile.avatar} name={name} size={d(130)} dombiOutfit={profile.dombi.outfit} />
        </AvatarFrame>
      </View>
      {frameGroups.map((g, i) => (
        <View key={g.id} style={{ gap: d(12) }}>
          <SectionLabel first={i === 0}>{g.label.toUpperCase()}</SectionLabel>
          <ChoiceTiles
            items={choicesFrom(frames.filter((f) => f.group === g.id), earned).map((ch) => {
              if (ch.locked || seasonOpen(ch.id, today)) return ch;
              const item = frames.find((f) => f.id === ch.id)!;
              return { ...ch, locked: true, caption: ch.label, content: <CosmeticFace item={item} locked /> };
            })}
            value={frame}
            onSelect={setFrame}
          />
        </View>
      ))}
    </EditorScreen>
  );
}
