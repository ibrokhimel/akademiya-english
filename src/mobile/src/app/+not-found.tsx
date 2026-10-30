import { router } from "expo-router";
import { ProblemContent } from "../components/ProblemContent";
import { goHome } from "../lib/navigation";
export default function NotFound() { return <ProblemContent kind="not-found" onChoice={goHome} onHome={goHome} onReport={() => router.replace("/feedback")} />; }
