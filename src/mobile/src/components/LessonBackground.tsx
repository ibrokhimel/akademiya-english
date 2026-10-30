import { lessonBackgrounds } from "../data/cosmetics";
import { useApp } from "../lib/store";
import { ProfileBackground } from "./ProfileBackground";

/**
 * DARS FONI (screen lAk24) behind a lesson's exercises: nothing for "Oddiy", the pattern or city stand-in (Ruling 2), or
 * the learner's own picture under a page-coloured veil so the exercise text keeps reading on it. Fills its parent.
 */
export function LessonBackground() {
  const { lessonBackground: bg } = useApp().settings.appLook;
  const media = bg.kind === "media" && !!bg.uri;
  return (
    <ProfileBackground
      items={lessonBackgrounds}
      dim={media ? 0.75 : 0}
      background={{ kind: media ? "media" : "item", id: bg.id, uri: media ? bg.uri : null, mediaType: media ? "image" : null }}
    />
  );
}
