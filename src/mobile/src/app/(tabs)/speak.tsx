import { View } from "react-native";
import { useTheme } from "../../components/ui";
import { useHomeBack } from "../../lib/navigation";

// Filled in by Task 6 of the v1 build plan.
export default function Tab() {
  useHomeBack();
  const c = useTheme();
  return <View style={{ flex: 1, backgroundColor: c.bg }} />;
}
