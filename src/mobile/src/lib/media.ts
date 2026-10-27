// Pictures, GIFs and videos the learner puts on their profile (avatar, banner, later the profile background).
// Pictures go through the crop route and are saved as JPEG; GIF and video are checked against the limits and copied as they are
// (Ruling 7: never trimmed). Everything lives in the app's document folder under profile/.
import { Directory,File,Paths } from "expo-file-system";
import { ImageManipulator,SaveFormat,type ImageRef } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect,useState } from "react";
import { Linking } from "react-native";
import { gifDurationMs,mediaProblem,pickedMediaType,rememberMedia } from "../../../core/customize.js";
import { read,write } from "./storage";

export type MediaType = "image" | "gif" | "video";
export type PickedMedia = { uri: string; mediaType: MediaType };
/** which mask the crop route uses: a circle for the avatar, a wide strip for the banner and the profile background */
export type CropTarget = "avatar" | "banner" | "background";
export const cropMasks: Record<CropTarget, { w: number; h: number; out: { width: number; height: number }; hint: string; round: boolean }> = {
  avatar: { w: 300, h: 300, out: { width: 512, height: 512 }, hint: "Siljiting va kattalashtiring", round: true },
  banner: { w: 350, h: 178, out: { width: 1170, height: 596 }, hint: "Banner uchun joyni tanlang", round: false },
  background: { w: 350, h: 178, out: { width: 1170, height: 596 }, hint: "Banner uchun joyni tanlang", round: false },
};

/** What a pick came to: nothing (cancelled or no permission), refused by the limits, sent to the crop route, or ready to use. */
export type PickOutcome = { kind: "none" } | { kind: "refused" } | { kind: "crop" } | { kind: "media"; media: PickedMedia };

function folder() {
  const dir = new Directory(Paths.document, "profile");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}
const newName = (ext: string) => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
const extensionOf = (name: string | null | undefined, fallback: string) => {
  const m = /\.([a-z0-9]{2,4})$/i.exec((name || "").split("?")[0]);
  return m ? m[1].toLowerCase() : fallback;
};

/**
 * Opens the library (pictures, GIF, video) or the camera (photo). A picture goes on to the crop route with `target`;
 * when it is cropped, the screen that listens with onCropped(`key`) gets it. A GIF or video is checked and copied.
 */
export async function pickMedia({ source, target, key }: { source: "library" | "camera"; target: CropTarget; key: string }): Promise<PickOutcome> {
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
      mediaTypes: ["images", "videos"],
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
  return { kind: "media", media: { uri: copy.uri, mediaType } };
}

/** Crops `ref` to `rect` (picture pixels), shrinks it to the target's size and saves it as JPEG in the profile folder. */
export async function saveCrop(ref: ImageRef, rect: { originX: number; originY: number; width: number; height: number }, target: CropTarget): Promise<PickedMedia> {
  const done = await ImageManipulator.manipulate(ref).crop(rect).resize(cropMasks[target].out).renderAsync();
  const saved = await done.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
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
  for (const m of dropped as PickedMedia[]) if (!inUse.includes(m.uri)) removeFile(m.uri);
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

function removeFile(uri: string) {
  try {
    const f = new File(uri);
    // only our own copies: never a file the picker handed us from elsewhere
    if (f.exists && f.uri.startsWith(folder().uri.replace(/\/$/, ""))) f.delete();
  } catch {}
}
/** After a save: deletes profile files that neither the saved profile (`keep`) nor the recent list uses any more. */
export function removeUnusedProfileFiles(keep: (string | null | undefined)[]) {
  const names = new Set([...keep, ...read<PickedMedia[]>("recentMedia", []).map((m) => m.uri)].filter((u): u is string => !!u).map((u) => u.split("/").pop()));
  try {
    for (const item of folder().list()) if (item instanceof File && !names.has(item.name)) item.delete();
  } catch {}
}
