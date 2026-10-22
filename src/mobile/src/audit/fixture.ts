import type { Event,Recording } from "../lib/store";
import type { VisualAuditConfig } from "../lib/visualAudit";

export function auditFixture(config: VisualAuditConfig) {
  const today = new Date();
  const at = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, 12).toISOString();
  const events: Event[] = [{ client_id: "audit-onboarding", type: "onboarding", at: at(-10), confidence: 2 }];
  if (config.populated) for (let i = 0; i < 6; i++) events.push({ client_id: `audit-lesson-${i + 1}`, type: "lesson", id: `l${i + 1}`, at: at(i - 5), accuracy: i === 3 ? 83 : 100, mistakes: i === 3 ? 2 : 0, spokenMs: 83000, skipped: 0 });
  if (config.id === "calendar-previous") events.unshift({ client_id: "audit-previous-month", type: "lesson", id: "l1", at: new Date(today.getFullYear(), today.getMonth(), 0, 12).toISOString(), accuracy: 100, mistakes: 0 });
  if (config.phase === "level") events.push({ client_id: "audit-level", type: "lesson", id: "c3", at: at(0), accuracy: 100, mistakes: 0 });
  const recordings: Recording[] = config.populated ? ["hello", "hi", "good-morning"].map((phraseId, index) => ({ phraseId, uri: `file:///visual-audit/${phraseId}.m4a`, at: at(-index), ms: 1800 + index * 200, synced: false })) : [];
  return {
    settings: { dark: config.dark, sound: false, speaking: config.speaking ?? true, saveVoice: config.saveVoice ?? true, reminder: "19:00", cast: "uk", name: config.populated ? "Ibrokhim" : "", goal: "ielts", openAll: true, server: "http://127.0.0.1:8090", speechServer: "http://127.0.0.1:8795", onboarded: true, needAccount: false, confidence: 2, joined: at(-10) },
    events,
    recordings,
    resume: null,
  };
}
