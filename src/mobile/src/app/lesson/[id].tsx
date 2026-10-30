import { useLocalSearchParams } from "expo-router";
import { goHome } from "../../lib/navigation";
import LessonScreen from "../../screens/LessonScreen";
export default function LessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <LessonScreen key={id} id={id} onExit={goHome} />
  );
}
