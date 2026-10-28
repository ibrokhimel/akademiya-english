import { File } from "expo-file-system";
import { Image } from "expo-image";
import { useIsFocused } from "expo-router";
import { useVideoPlayer,VideoView,type VideoPlayer } from "expo-video";
import { useEffect,useMemo,useState } from "react";
import { thumbnailOf } from "../../../core/customize.js";
import { AppState,StyleSheet,View,type StyleProp,type ViewStyle } from "react-native";
import { useDombiLevel } from "../lib/dombiLevel";
import { profileFileUri } from "../lib/media";
import type { Profile } from "../lib/store";

type MediaType = NonNullable<Profile["avatar"]["mediaType"]>;

/**
 * The learner's own picture, GIF or video, filling its box (cover). GIF and video loop without sound.
 * On a still-picture phone or with Reduce Motion (the same rule as Dombi's still pictures) only the first frame shows:
 * a GIF through expo-image with autoplay off, a video through the first-frame picture saved at pick time, so only a
 * live video mounts a player. Off screen (another screen on top, another tab) or with the app in the background it is
 * frozen too, so a video never plays where no one sees it and its player is mounted again when it comes back.
 */
export function ProfileMedia({ uri: stored, mediaType, still, style }: {
  /** as stored in the settings: found again by file name in the profile folder (profileFileUri) */
  uri: string;
  mediaType: MediaType | null;
  /** force the first frame (small tiles) */
  still?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const uri = useMemo(() => profileFileUri(stored), [stored]);
  const stillPhone = useDombiLevel() === "still";
  const focused = useIsFocused();
  const active = useAppActive();
  const frozen = still || stillPhone || !focused || !active;
  const firstFrame = useMemo(() => {
    if (mediaType !== "video" || !frozen) return null;
    const still = thumbnailOf(uri);
    try { return new File(still).exists ? still : null; } catch { return null; }
  }, [uri, mediaType, frozen]);
  if (mediaType === "video" && !firstFrame) return <LoopVideo uri={uri} frozen={frozen} style={style} />;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Image source={{ uri: firstFrame ?? uri }} contentFit="cover" autoplay={!frozen} style={StyleSheet.absoluteFill} accessible={false} />
    </View>
  );
}

// "unknown" (before the first report) counts as active; "inactive" (iOS app switcher, Control Centre) and "background" do not
const isActive = (state: string | null) => state !== "background" && state !== "inactive";
function useAppActive() {
  const [active, setActive] = useState(() => isActive(AppState.currentState));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => setActive(isActive(state)));
    return () => sub.remove();
  }, []);
  return active;
}

function LoopVideo({ uri, frozen, style }: { uri: string; frozen: boolean; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    // a silent loop must not stop the learner's music or the app's own sounds
    p.audioMixingMode = "mixWithOthers";
  });
  useEffect(() => {
    if (frozen) stopAtFirstFrame(player);
    else player.play();
  }, [player, frozen]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <VideoView player={player} nativeControls={false} contentFit="cover" style={StyleSheet.absoluteFill} />
    </View>
  );
}

function stopAtFirstFrame(player: VideoPlayer) {
  player.pause();
  player.currentTime = 0;
}
