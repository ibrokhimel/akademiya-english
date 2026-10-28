import { Directory,File,Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import PocketBase,{ AsyncAuthStore } from "pocketbase";
import { uploadRefusal } from "../../../core/customize.js";
import { mediaToUpload,normalizeProfile,profileForSync } from "../../../core/profile.js";
import { backendURL,cloudEnabled,internalBuild } from "./config";
import { profileFileUri } from "./media";
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
      mode: settings.mode,
      sound: settings.sound,
      speaking: settings.speaking,
      saveVoice: settings.saveVoice,
      reminder: settings.reminder,
      cast: settings.cast,
      goal: settings.goal,
      // the shape without local file paths: the pictures go up as files below
      profile: profileForSync(settings.profile),
    },
  });
  await syncProfileExtras(user, normalizeProfile(settings.profile), ensureOwner);
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
/** True when the learner is signed in to the cloud, so the server can be asked things. */
export const signedIn = () => (cloudEnabled || internalBuild) && pb.authStore.isValid && !!pb.authStore.record;
/** Is this @username free on the server (server/pocketbase/pb_hooks/username.pb.js)? null when it cannot be asked: not signed in, offline, a failure. */
export async function usernameFree(name: string): Promise<boolean | null> {
  if (!signedIn()) return null;
  try {
    const answer = await pb.send<{ free?: unknown }>(`/api/akademiya/username/${encodeURIComponent(name)}`, { method: "GET" });
    return typeof answer?.free === "boolean" ? answer.free : null;
  } catch {
    return null;
  }
}
const FALLBACK_MIME = { image: "image/jpeg", gif: "image/gif", video: "video/mp4" } as const;
const FALLBACK_EXT = { image: "jpg", gif: "gif", video: "mp4" } as const;
/** What the last sync could not do for the profile, for the editors to show. Read it with profileSyncStatus(). */
export type ProfileSyncStatus = {
  /** the username last accepted by the server */
  username: string | null;
  /** set when the server refused the username (taken or not allowed); cleared when the learner changes it */
  usernameError: { value: string } | null;
  /** media the server cannot take, not sent again until the learner picks another file: "large" is over 8 MB, "rejected" got a 400
   *  answer (the type is worked out from the extension, or from the picked media type) */
  media: Record<string, { uri: string; error: "large" | "rejected" }>;
};
const STATUS_KEY = "profileSync";
export function profileSyncStatus(user = pb.authStore.record?.id || ""): ProfileSyncStatus {
  return { username: null, usernameError: null, media: {}, ...read<Record<string, Partial<ProfileSyncStatus>>>(STATUS_KEY, {})[user] };
}
function saveStatus(user: string, status: ProfileSyncStatus) {
  write(STATUS_KEY, { ...read<Record<string, ProfileSyncStatus>>(STATUS_KEY, {}), [user]: status });
}
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", mov: "video/quicktime" };
// The username and the learner's own picture, GIF or video. Neither may stop the rest of the sync: a taken username or a failed
// upload is tried again next time (except one the server refused with a 400, or one over 8 MB: those wait for a different file),
// and a picture is sent once (we remember which file went up for which account).
async function syncProfileExtras(user: string, profile: ReturnType<typeof normalizeProfile>, ensureOwner: () => void) {
  let status = profileSyncStatus(user);
  // The username goes up only when it changed. A refusal (400) is remembered and not retried until the learner changes it; other failures retry next sync.
  if (profile.username !== (status.username ?? "") && status.usernameError?.value !== profile.username) {
    try {
      await pb.collection("users").update(user, { username: profile.username });
      ensureOwner();
      status = { ...profileSyncStatus(user), username: profile.username, usernameError: null };
      saveStatus(user, status);
    } catch (e) {
      if ((e as { status?: number })?.status === 400) {
        ensureOwner();
        status = { ...profileSyncStatus(user), usernameError: { value: profile.username } };
        saveStatus(user, status);
      }
    }
  } else if (profile.username === (status.username ?? "") && status.usernameError) {
    status = { ...status, usernameError: null };
    saveStatus(user, status);
  }
  ensureOwner();
  for (const media of mediaToUpload(profile, read<Record<string, Record<string, string>>>("profileMedia", {})[user])) {
    const known = profileSyncStatus(user).media[media.field];
    if (known?.uri === media.uri) continue; // refused for good: wait for a different file
    const refuse = (error: "large" | "rejected") => {
      ensureOwner();
      const now = profileSyncStatus(user);
      saveStatus(user, { ...now, media: { ...now.media, [media.field]: { uri: media.uri, error } } });
    };
    try {
      // found by file name in the profile folder: the stored path is stale after an iOS install or update
      const uri = profileFileUri(media.uri);
      const file = new File(uri);
      if (!file.exists) continue;
      const ext = media.uri.split("?")[0].split(".").pop()?.toLowerCase() || "";
      const kind = (media.mediaType || "image") as keyof typeof FALLBACK_MIME;
      const type = MIME[ext] || FALLBACK_MIME[kind], name = MIME[ext] ? ext : FALLBACK_EXT[kind];
      const large = uploadRefusal({ bytes: file.size });
      if (large) { refuse(large); continue; }
      const form = new FormData();
      form.append(media.field, { uri, name: `${media.field}.${name}`, type } as unknown as Blob);
      await pb.collection("users").update(user, form);
    } catch (e) {
      const rejected = uploadRefusal({ error: e });
      if (rejected) refuse(rejected);
      continue;
    }
    ensureOwner();
    const now = profileSyncStatus(user);
    if (now.media[media.field]) { const rest = { ...now.media }; delete rest[media.field]; saveStatus(user, { ...now, media: rest }); }
    const all = read<Record<string, Record<string, string>>>("profileMedia", {});
    write("profileMedia", { ...all, [user]: { ...all[user], [media.field]: media.uri } });
  }
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
