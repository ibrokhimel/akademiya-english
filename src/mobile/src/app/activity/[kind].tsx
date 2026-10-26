import { useLocalSearchParams } from "expo-router";
import ActivityScreen, { type ActivityKind } from "../../screens/ActivityScreen";
export default function ActivityRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return <ActivityScreen kind={kind as ActivityKind} />;
}
