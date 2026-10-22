import Storage from "expo-sqlite/kv-store";
import { visualAuditStorage } from "./visualAudit";

export function read<T>(key: string, fallback: T): T {
  const audit = visualAuditStorage();
  const value = audit ? audit.get(key) ?? null : Storage.getItemSync("akademiya." + key);
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
export function write(key: string, value: unknown) {
  const audit = visualAuditStorage();
  if (audit) { audit.set(key, JSON.stringify(value)); return; }
  Storage.setItemSync("akademiya." + key, JSON.stringify(value));
}
export function remove(key: string) {
  const audit = visualAuditStorage();
  if (audit) { audit.delete(key); return; }
  Storage.removeItemSync("akademiya." + key);
}
export const clientId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

// Called only after the learner confirms deleting their local data.
export function clearLocalData() {
  const audit = visualAuditStorage();
  if (audit) { audit.clear(); return; }
  for (const key of Storage.getAllKeysSync())
    if (key.startsWith("akademiya.")) Storage.removeItemSync(key);
}
