import { Stack,router,useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ProblemContent } from "../components/ProblemContent";
import { goHome,useBack } from "../lib/navigation";
import { resolveProblem,type ProblemChoice,type ProblemKind } from "../lib/problem";
export default function ProblemRoute() {
  const { kind = "error", request } = useLocalSearchParams<{ kind?: ProblemKind; request?: string }>();
  const back = useBack("/(tabs)");
  useEffect(() => () => resolveProblem(request, "cancel"), [request]);
  const finish = (choice: ProblemChoice) => { resolveProblem(request, choice); back(); };
  return <><Stack.Screen options={{ headerShown: false }} /><ProblemContent kind={kind} onChoice={finish} onHome={() => { resolveProblem(request, "cancel"); goHome(); }} onReport={() => { resolveProblem(request, "cancel"); router.replace("/feedback"); }} /></>;
}
