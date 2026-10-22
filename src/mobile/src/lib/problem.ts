import { router } from "expo-router";
export type ProblemKind = "offline" | "mic-blocked" | "speech-unavailable" | "not-ready" | "not-found" | "error";
export type ProblemChoice = "retry" | "tiles" | "cancel";
const pending = new Map<string, (choice: ProblemChoice) => void>();
let sequence = 0;
export function showProblem(kind: ProblemKind) {
  const request = String(++sequence);
  return new Promise<ProblemChoice>(resolve => { pending.set(request, resolve); router.navigate({ pathname: "/problem", params: { kind, request } }); });
}
export function resolveProblem(request: string | undefined, choice: ProblemChoice) { if (!request) return; pending.get(request)?.(choice); pending.delete(request); }
