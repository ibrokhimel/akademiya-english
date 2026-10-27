import { useState } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { dombiName,poseMoment } from "../../../../core/showcase.js";
import { Chips } from "../../components/customize/Chips";
import { ChoiceTiles,choicesFrom } from "../../components/customize/ChoiceTiles";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { TextField } from "../../components/customize/TextField";
import { Dombi,type DombiMoment } from "../../components/Dombi";
import { Icon,useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { dombiGroups,dombiItems,dombiPoses,dombiTints,shown } from "../../data/cosmetics";
import { useProfile } from "../../lib/store";

/**
 * Dombi (screen tZKk4): the stage with Dombi in his outfit, the item groups that have Rive art, his pose, his tint and his
 * name. Items, poses and tints the rig cannot draw yet stay out (Ruling 3); a group or a section with nothing to choose
 * is left out too. Corner props have no art, so the stage shows none.
 */
export default function DombiEditor() {
  const d = useDesignScale(), c = useTheme(), reduce = useReducedMotion(), { profile, setProfile, earned } = useProfile();
  const [draft, setDraft] = useState(profile.dombi);
  const set = (patch: Partial<typeof draft>) => setDraft((x) => ({ ...x, ...patch }));
  const groups = dombiGroups.filter((g) => shown(dombiItems).some((x) => x.group === g.id));
  const [group, setGroup] = useState(groups.find((g) => dombiItems.some((x) => x.group === g.id && x.id === draft.outfit))?.id ?? groups[0]?.id);
  const poses = shown(dombiPoses), tints = shown(dombiTints);
  const moment = poseMoment(draft.pose) as DombiMoment;
  return (
    <EditorScreen title="Dombi" onSave={() => setProfile({ dombi: { ...draft, name: dombiName(draft.name) } })}>
      <View style={{ height: d(186), borderRadius: d(20), backgroundColor: c.soft, alignItems: "center", justifyContent: "center" }}>
        <View>
          <Dombi moment={moment} size={d(130)} awake outfit={draft.outfit} />
          {reduce && draft.outfit === "doppi" ? <Icon name="top-hat" size={d(130) * 0.34} style={{ position: "absolute", alignSelf: "center", top: d(130) * 0.02 }} /> : null}
        </View>
      </View>
      {groups.length ? <Chips options={groups} value={group ?? null} onChange={setGroup} /> : null}
      <ChoiceTiles items={choicesFrom(dombiItems.filter((x) => x.group === group), earned)} value={draft.outfit} onSelect={(outfit) => set({ outfit })} />
      {poses.length > 1 ? <>
        <SectionLabel>HOLATI</SectionLabel>
        <Chips options={poses} value={draft.pose} onChange={(pose) => set({ pose })} />
      </> : null}
      {tints.length > 1 ? <>
        <SectionLabel>RANGI</SectionLabel>
        <ChoiceTiles items={choicesFrom(tints, earned)} value={draft.tint} onSelect={(tint) => set({ tint })} />
      </> : null}
      <TextField label="Ismi" value={draft.name} onChangeText={(name) => set({ name })} maxLength={16} autoCorrect={false} />
    </EditorScreen>
  );
}
