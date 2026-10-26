import { useLocalSearchParams } from "expo-router";
import ActivityScreen, { type ActivityKind } from "../../screens/ActivityScreen";
import MatchRush from "../../screens/MatchRush";
export default function ActivityRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return kind === "match" ? <MatchRush /> : <ActivityScreen kind={kind as ActivityKind} />;
}
