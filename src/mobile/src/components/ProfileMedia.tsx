import { Image } from "expo-image";
import { useVideoPlayer,VideoView,type VideoPlayer } from "expo-video";
import { useEffect } from "react";
import { StyleSheet,View,type StyleProp,type ViewStyle } from "react-native";
import { useDombiLevel } from "../lib/dombiLevel";
import type { Profile } from "../lib/store";

type MediaType = NonNullable<Profile["avatar"]["mediaType"]>;

/**
 * The learner's own picture, GIF or video, filling its box (cover). GIF and video loop without sound.
 * On a still-picture phone or with Reduce Motion (the same rule as Dombi's still pictures) only the first frame shows.
 */
export function ProfileMedia({ uri, mediaType, still, style }: {
  uri: string;
  mediaType: MediaType | null;
  /** force the first frame (small tiles) */
  still?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const stillPhone = useDombiLevel() === "still";
  const frozen = still || stillPhone;
  if (mediaType === "video") return <LoopVideo uri={uri} frozen={frozen} style={style} />;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Image source={{ uri }} contentFit="cover" autoplay={!frozen} style={StyleSheet.absoluteFill} accessible={false} />
    </View>
  );
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
