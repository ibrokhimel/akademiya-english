import { File,Paths } from "expo-file-system";
import { AppState } from "react-native";
import { playUri } from "./audio";
import { amplifyVoiceWav } from "./wav";

let preview = 0;
class VoiceFileError extends Error {}
export function voicePlaybackError(error: unknown) {
  return error instanceof VoiceFileError ? error.message : "Ovoz ochilmadi. Yana urinib ko'ring.";
}
export async function playVoice(uri: string, isCurrent: () => boolean = () => true) {
  const current = () => isCurrent() && AppState.currentState === "active";
  if (!current()) return;
  const source = new File(uri);
  if (!source.exists || !source.size) throw new VoiceFileError("Yozuv topilmadi. Mikrofonni bosib, iborani qayta yozing.");
  let temporary: File | undefined;
  try {
    // Bound memory use; other codecs continue through the native audio player.
    if (source.size <= 5 * 1024 * 1024) {
      const adjusted = amplifyVoiceWav(await source.bytes());
      if (!current()) return;
      if (adjusted?.silent) throw new VoiceFileError("Bu yozuvda ovoz eshitilmadi. Iborani qayta yozing.");
      if (adjusted && adjusted.gain > 1) {
        temporary = new File(Paths.cache, `voice-playback-${Date.now()}-${++preview}.wav`);
        temporary.write(adjusted.bytes);
      }
    }
    if (current()) await playUri(temporary?.uri || source.uri);
  } finally {
    try { if (temporary?.exists) temporary.delete(); } catch {}
  }
}
