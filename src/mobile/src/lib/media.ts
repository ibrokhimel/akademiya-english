// Pictures, GIFs and videos the learner puts on their profile (avatar, banner, later the profile background).
// Pictures go through the crop route and are saved as JPEG; GIF and video are checked against the limits and copied as they are
// (Ruling 7: never trimmed). Everything lives in the app's document folder under profile/.
import { Directory,File,Paths } from "expo-file-system";
import { ImageManipulator,SaveFormat,type ImageRef } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { createVideoPlayer } from "expo-video";
import { useEffect,useState } from "react";
import { Linking } from "react-native";
import { gifDurationMs,mediaProblem,mediaUrisOf,pickedMediaType,profileFileName,rememberMedia,thumbnailOf } from "../../../core/customize.js";
import { keysStartingWith,read,write } from "./storage";

export type MediaType = "image" | "gif" | "video";
export type PickedMedia = { uri: string; mediaType: MediaType };
/** which mask the crop route uses: a circle for the avatar, a wide strip for the banner, a tall phone-shaped box for the profile background (it fills the Profile tab) */
export type CropTarget = "avatar" | "banner" | "background";
export const cropMasks: Record<CropTarget, { w: number; h: number; out: { width: number; height: number }; hint: string; round: boolean }> = {
  avatar: { w: 300, h: 300, out: { width: 512, height: 512 }, hint: "Siljiting va kattalashtiring", round: true },
  banner: { w: 350, h: 178, out: { width: 1170, height: 596 }, hint: "Banner uchun joyni tanlang", round: false },
  background: { w: 230, h: 460, out: { width: 720, height: 1440 }, hint: "Siljiting va kattalashtiring", round: false },
};

/** What a pick came to: nothing (cancelled or no permission), refused by the limits, sent to the crop route, or ready to use. */
export type PickOutcome = { kind: "none" } | { kind: "refused" } | { kind: "crop" } | { kind: "media"; media: PickedMedia };

function folder() {
  const dir = new Directory(Paths.document, "profile");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}
/**
 * Where a stored profile media uri is on this phone now: found by its file name in the profile folder, because iOS changes the
 * app's folder path on every install and update. Old absolute uris and bare names both work; a uri from elsewhere is left as it is.
 * Every place that opens a stored profile file (ProfileMedia, the clean-up, the sync) goes through here.
 */
export function profileFileUri(uri: string): string;
export function profileFileUri(uri: string | null | undefined): string | null;
export function profileFileUri(uri: string | null | undefined) {
  if (!uri) return null;
  const name = profileFileName(uri);
  if (!name) return uri;
  try {
    return new File(new Directory(Paths.document, "profile"), name).uri;
  } catch {
    return uri;
  }
}
const newName = (ext: string) => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
const extensionOf = (name: string | null | undefined, fallback: string) => {
  const m = /\.([a-z0-9]{2,4})$/i.exec((name || "").split("?")[0]);
  return m ? m[1].toLowerCase() : fallback;
};

/**
 * Opens the library (pictures, GIF, video; `imagesOnly` leaves videos out) or the camera (photo). A picture goes on to the
 * crop route with `target`; when it is cropped, the screen that listens with onCropped(`key`) gets it. A GIF or video is
 * checked and copied, and a video gets its first-frame picture. A cancel is "none"; a real failure opens the error screen.
 */
export async function pickMedia(options: { source: "library" | "camera"; target: CropTarget; key: string; imagesOnly?: boolean }): Promise<PickOutcome> {
  try {
    return await pick(options);
  } catch {
    router.navigate("/problem?kind=error");
    return { kind: "none" };
  }
}

async function pick({ source, target, key, imagesOnly = false }: { source: "library" | "camera"; target: CropTarget; key: string; imagesOnly?: boolean }): Promise<PickOutcome> {
  let result: ImagePicker.ImagePickerResult;
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      // asked before and refused for good: the phone's settings are the only place left to allow it
      if (!permission.canAskAgain) void Linking.openSettings().catch(() => {});
      return { kind: "none" };
    }
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imagesOnly ? ["images"] : ["images", "videos"],
      quality: 1,
      // keep a GIF a GIF and a video as it is (the compatible mode turns GIFs into still JPEGs)
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });
  }
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return { kind: "none" };
  const mediaType = pickedMediaType(asset) as MediaType;
  if (mediaType === "image") {
    router.push({ pathname: "/customize/crop", params: { target, key, uri: asset.uri } });
    return { kind: "crop" };
  }
  const file = new File(asset.uri);
  const bytes = asset.fileSize ?? (file.exists ? file.size : null);
  if (mediaProblem({ mediaType, bytes, ms: null })) return { kind: "refused" };
  const ms = mediaType === "video" ? asset.duration ?? null : gifDurationMs(await file.bytes());
  if (mediaProblem({ mediaType, bytes, ms })) return { kind: "refused" };
  const copy = new File(folder(), newName(mediaType === "gif" ? "gif" : extensionOf(asset.fileName || asset.uri, "mp4")));
  await file.copy(copy);
  if (mediaType === "video") await saveFirstFrame(copy.uri);
  return { kind: "media", media: { uri: copy.uri, mediaType } };
}

/** Saves the video's first frame as `thumbnailOf(uri)`, so tiles and still phones show a picture instead of a player. */
async function saveFirstFrame(uri: string) {
  const player = createVideoPlayer(uri);
  try {
    const [frame] = await player.generateThumbnailsAsync(0, { maxWidth: 1170, maxHeight: 1170 });
    if (!frame) return;
    const ref = await ImageManipulator.manipulate(frame).renderAsync();
    frame.release();
    const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    ref.release();
    const tmp = new File(saved.uri);
    await tmp.copy(new File(thumbnailOf(uri)));
    if (tmp.exists) tmp.delete();
  } catch {
    // no picture: the still places fall back to a paused player
  } finally {
    player.release();
  }
}

/** Crops `ref` to `rect` (picture pixels), shrinks it to the target's size and saves it as JPEG in the profile folder. */
export async function saveCrop(ref: ImageRef, rect: { originX: number; originY: number; width: number; height: number }, target: CropTarget): Promise<PickedMedia> {
  const done = await ImageManipulator.manipulate(ref).crop(rect).resize(cropMasks[target].out).renderAsync();
  const saved = await done.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  done.release();
  const tmp = new File(saved.uri), copy = new File(folder(), newName("jpg"));
  await tmp.copy(copy);
  if (tmp.exists) tmp.delete();
  return { uri: copy.uri, mediaType: "image" };
}

// ---- the crop route hands its picture back to the editor that opened it ----
const cropListeners = new Map<string, (media: PickedMedia) => void>();
export function onCropped(key: string, listener: (media: PickedMedia) => void) {
  cropListeners.set(key, listener);
  return () => { if (cropListeners.get(key) === listener) cropListeners.delete(key); };
}
export function cropped(key: string, media: PickedMedia) {
  cropListeners.get(key)?.(media);
}

// ---- OLDINGI RASMLARIM: the last 4 avatar media, kept next to the profile in the local store ----
const recentListeners = new Set<(list: PickedMedia[]) => void>();
/** Puts `media` first in the recent list. Files that fall off and are not in `inUse` (uris the saved profile uses) are deleted. */
export function remember(media: PickedMedia, inUse: (string | null)[]) {
  const { list, dropped } = rememberMedia(read<PickedMedia[]>("recentMedia", []), media);
  write("recentMedia", list);
  const others = new Set(otherAccountsMedia().map(profileFileName));
  for (const m of dropped as PickedMedia[]) if (!inUse.includes(m.uri) && !others.has(profileFileName(m.uri))) removeFile(m.uri);
  recentListeners.forEach((l) => l(list as PickedMedia[]));
}
export function useRecentMedia() {
  const [list, setList] = useState<PickedMedia[]>(() => read<PickedMedia[]>("recentMedia", []));
  useEffect(() => {
    recentListeners.add(setList);
    return () => { recentListeners.delete(setList); };
  }, []);
  return list;
}

/** Accounts that logged out on this phone come back with their cached settings (`profile.<id>`), so their pictures must stay. */
function otherAccountsMedia(): string[] {
  try {
    return keysStartingWith("profile.").flatMap((key) => mediaUrisOf(read<{ settings?: unknown } | null>(key, null)?.settings) as string[]);
  } catch {
    return [];
  }
}
function removeFile(stored: string) {
  try {
    const uri = profileFileUri(stored);
    const f = new File(uri);
    // only our own copies: never a file the picker handed us from elsewhere
    const ours = (u: string) => u.startsWith(folder().uri.replace(/\/$/, ""));
    if (f.exists && ours(f.uri)) f.delete();
    const still = new File(thumbnailOf(uri));
    if (still.exists && ours(still.uri)) still.delete();
  } catch {}
}
/**
 * After a save: deletes profile files (and video first frames) that neither the saved profile (`keep`), the saved lesson
 * background, the recent list nor another account on this phone (its settings cached as `profile.<id>` at logout) uses any more.
 */
export function removeUnusedProfileFiles(keep: (string | null | undefined)[]) {
  // the lesson background's own picture (Ilova ko'rinishi) lives in the same folder
  const lesson = read<{ appLook?: { lessonBackground?: { uri?: string | null } } } | null>("settings", {})?.appLook?.lessonBackground?.uri;
  const names = new Set([...keep, lesson, ...otherAccountsMedia(), ...read<PickedMedia[]>("recentMedia", []).map((m) => m.uri)].filter((u): u is string => !!u).flatMap((u) => [u, thumbnailOf(u)]).map(profileFileName));
  try {
    for (const item of folder().list()) if (item instanceof File && !names.has(item.name)) item.delete();
  } catch {}
}
