import { Directory,File,Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import PocketBase,{ AsyncAuthStore } from "pocketbase";
import { backendURL,cloudEnabled,internalBuild } from "./config";
import { read,write } from "./storage";
import type { Event,Recording,Settings } from "./store";
import { getVisualAudit } from "./visualAudit";

const auth = new AsyncAuthStore({
  save: (value) => SecureStore.setItemAsync("akademiya.auth", value),
  clear: () => SecureStore.deleteItemAsync("akademiya.auth"),
  initial: SecureStore.getItemAsync("akademiya.auth"),
});
export const pb = new PocketBase(
  (internalBuild ? read<Partial<Settings>>("settings", {}).server : backendURL) || "https://offline.invalid",
  auth,
);
pb.autoCancellation(false);
pb.beforeSend = (url, options) => {
  if (getVisualAudit() || (!cloudEnabled && !internalBuild)) throw new Error("Cloud services are not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  return {
    url,
    options: {
      ...options,
      signal: controller.signal,
      requestKey: null,
      fetch: async (
        input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        try {
          return await fetch(input, init);
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  };
};
let running: Promise<{ events: Event[]; recordings: Recording[] }> | null =
  null;
export function sync() {
  if ((!cloudEnabled && !internalBuild) || !pb.authStore.isValid || !pb.authStore.record)
    return Promise.resolve({
      events: read<Event[]>("events", []),
      recordings: read<Recording[]>("recordings", []),
    });
  if (running) return running;
  running = synchronize().finally(() => {
    running = null;
  });
  return running;
}
async function synchronize() {
  const user = pb.authStore.record!.id,
    settings = read<Settings>("settings", {} as Settings);
  const ensureOwner = () => {
    if (pb.authStore.record?.id !== user)
      throw new Error("Account changed during sync");
  };
  pb.baseURL = settings.server;
  const events = read<Event[]>("events", []);
  for (const event of events.filter((e) => !e.synced)) {
    const existing = await pb.collection("events").getList(1, 1, {
      filter: pb.filter("client_id = {:id}", { id: event.client_id }),
    });
    if (!existing.items.length)
      await pb.collection("events").create({
        user,
        client_id: event.client_id,
        type: event.type,
        at: event.at,
        data: {
          ...event,
          client_id: undefined,
          at: undefined,
          type: undefined,
          synced: undefined,
        },
      });
    // Save each acknowledgement so an interrupted sync can resume safely.
    ensureOwner();
    const latest = read<Event[]>("events", []);
    write(
      "events",
      latest.map((e) =>
        e.client_id === event.client_id ? { ...e, synced: true } : e,
      ),
    );
  }
  const remote = await pb.collection("events").getFullList({ sort: "at" });
  ensureOwner();
  const merged = new Map<string, Event>();
  for (const row of remote)
    merged.set(row.client_id, {
      ...row.data,
      client_id: row.client_id,
      at: row.at,
      type: row.type,
      synced: true,
    });
  for (const event of read<Event[]>("events", []))
    merged.set(event.client_id, event);
  const next = [...merged.values()].sort((a, b) => a.at.localeCompare(b.at));
  write("events", next);
  await pb.collection("users").update(user, {
    name: settings.name,
    settings: {
      dark: settings.dark,
      sound: settings.sound,
      speaking: settings.speaking,
      saveVoice: settings.saveVoice,
      reminder: settings.reminder,
      cast: settings.cast,
      goal: settings.goal,
    },
  });
  const deleted = read<string[]>("deletedRecordings", []);
  for (const phrase of deleted) {
    const rows = await pb
      .collection("recordings")
      .getFullList({ filter: pb.filter("phrase = {:phrase}", { phrase }) });
    for (const row of rows) await pb.collection("recordings").delete(row.id);
    ensureOwner();
    write(
      "deletedRecordings",
      read<string[]>("deletedRecordings", []).filter((id) => id !== phrase),
    );
  }
  for (const recording of read<Recording[]>("recordings", []).filter(
    (r) => !r.synced,
  )) {
    if (!new File(recording.uri).exists) continue;
    const rows = await pb.collection("recordings").getList(1, 1, {
      filter: pb.filter("phrase = {:phrase}", { phrase: recording.phraseId }),
    });
    const form = new FormData();
    form.append("user", user);
    form.append("phrase", recording.phraseId);
    form.append("ms", String(recording.ms));
    form.append("at", recording.at);
    form.append("audio", {
      uri: recording.uri,
      name: recording.uri.split("/").pop(),
      type: recording.uri.endsWith(".wav") ? "audio/wav" : "audio/mp4",
    } as unknown as Blob);
    if (rows.items.length)
      await pb.collection("recordings").update(rows.items[0].id, form);
    else await pb.collection("recordings").create(form);
    ensureOwner();
    write(
      "recordings",
      read<Recording[]>("recordings", []).map((r) =>
        r.uri === recording.uri ? { ...r, synced: true } : r,
      ),
    );
  }
  const records = await pb.collection("recordings").getFullList(),
    local = read<Recording[]>("recordings", []);
  ensureOwner();
  if (records.some((row) => !local.some((r) => r.phraseId === row.phrase))) {
    const token = await pb.files.getToken(),
      directory = new Directory(Paths.document, "voice");
    if (!directory.exists) directory.create();
    for (const row of records) {
      if (local.some((r) => r.phraseId === row.phrase)) continue;
      const destination = new File(directory, `${row.id}-${row.audio}`);
      if (!destination.exists)
        await File.downloadFileAsync(
          pb.files.getURL(row, row.audio, { token }),
          destination,
        );
      local.push({
        phraseId: row.phrase,
        uri: destination.uri,
        at: row.at,
        ms: row.ms,
        synced: true,
      });
    }
    ensureOwner();
    write("recordings", local);
  }
  return { events: next, recordings: read<Recording[]>("recordings", []) };
}
export function queueRecordingDeletion(phrase: string) {
  write("deletedRecordings", [
    ...new Set([...read<string[]>("deletedRecordings", []), phrase]),
  ]);
}
export function deleteVoiceFiles(recordings: Recording[]) {
  for (const row of recordings) {
    try {
      const file = new File(row.uri);
      if (file.exists) file.delete();
    } catch {}
    queueRecordingDeletion(row.phraseId);
  }
}
export async function feedback(text: string, screen: string, screenshot?: string) {
  if (!pb.authStore.isValid || !pb.authStore.record)
    throw new Error("Sign in first");
  if (screenshot) {
    const form = new FormData(); form.append("user", pb.authStore.record.id); form.append("text", text); form.append("screen", screen);
    form.append("screenshot", { uri: screenshot, name: "feedback.png", type: "image/png" } as unknown as Blob);
    return pb.collection("feedback").create(form);
  }
  return pb
    .collection("feedback")
    .create({ user: pb.authStore.record.id, text, screen });
}
