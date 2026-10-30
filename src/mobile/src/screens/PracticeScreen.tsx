import { useBack } from "../lib/navigation";
import { Player } from "./LessonScreen";
export default function PracticeScreen({ id }: { id: string }) {
  const back = useBack("/phrases");
  return <Player lesson={{ id: "practice", title: "", unit: 0, items: [{ ex: "meet", p: id }] }} onExit={back} quiet />;
}
