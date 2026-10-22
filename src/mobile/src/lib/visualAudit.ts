// Enabled only in the explicitly requested screenshot build. Normal builds do
// not expose the fixture route or redirect any storage.
export const visualAuditEnabled = process.env.EXPO_PUBLIC_VISUAL_AUDIT === "1";
export type VisualAuditConfig = {
  id: string;
  dark: boolean;
  populated: boolean;
  speaking?: boolean;
  saveVoice?: boolean;
  step?: number;
  selected?: number;
  panel?: "goal" | "reminder" | "lesson" | "checkpoint";
  phase?: "mistakes" | "canSay" | "result" | "streak" | "level";
  exercise?: string;
  feedback?: "right" | "wrong";
  quit?: boolean;
  combo?: number;
  listening?: boolean;
  speechError?: string;
  email?: boolean;
  result?: boolean;
  scroll?: "middle" | "bottom";
};
let active: { config: VisualAuditConfig; values: Map<string, string> } | null = null;
export function beginVisualAudit(config: VisualAuditConfig, seed: Record<string, unknown>) {
  if (!visualAuditEnabled) throw new Error("Visual audit is disabled in this build");
  const session = { config, values: new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)])) };
  active = session;
  return session;
}
export function endVisualAudit(session: unknown) { if (active === session) active = null; }
export const getVisualAudit = () => active?.config;
export const visualAuditStorage = () => active?.values;

// Normal release package: capture fixtures are disabled by the build environment.
