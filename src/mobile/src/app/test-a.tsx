import { useLocalSearchParams } from "expo-router";
import { useBack } from "../lib/navigation";
import { MotionPreview } from "../screens/MotionPreview";
import TestA from "../screens/TestA";
export default function MotionTest() {
  useBack("/settings");
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  return preview ? <MotionPreview preview={preview} /> : <TestA />;
}
