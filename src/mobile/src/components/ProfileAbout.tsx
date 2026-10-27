import { View } from "react-native";
import { destinations,nativeLanguages,whyTags } from "../data/cosmetics";
import type { Profile } from "../lib/store";
import { Icon,Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";

/**
 * Under the name on the Profile tab (screen RnkvP): the bio line (`part` "bio") or the tags (why, dream destination,
 * native language, the city when shown). "Nimalar ko'rinsin" decides whether and where each shows.
 */
export function ProfileAbout({ profile: p, part }: { profile: Profile; part: "bio" | "tags" }) {
  const d = useDesignScale(), c = useTheme();
  const label = (list: { id: string; label: string }[], id: string | null) => list.find((x) => x.id === id)?.label;
  const tags = part === "tags" ? [
    { icon: whyTags.find((x) => x.id === p.why)?.picture ?? "target", text: label(whyTags, p.why) },
    { icon: "plane", text: label(destinations, p.destination) },
    { icon: "bubble-phrases", text: label(nativeLanguages, p.nativeLanguage) },
    { icon: "glyph-user-grey", text: p.showCity && p.city ? p.city : undefined },
  ].filter((t): t is { icon: string; text: string } => !!t.text) : [];
  const bio = part === "bio" ? p.bio : "";
  if (!bio && !tags.length) return null;
  return (
    <View style={{ gap: d(12) }}>
      {bio ? <Txt style={{ fontSize: d(14), lineHeight: d(19), color: c.muted, fontFamily: "Nunito_700Bold" }}>{bio}</Txt> : null}
      {tags.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: d(8) }}>
          {tags.map((t) => (
            <View key={t.icon + t.text} style={{ flexDirection: "row", alignItems: "center", gap: d(6), paddingHorizontal: d(10), paddingVertical: d(6), borderRadius: d(99), backgroundColor: c.surface }}>
              <Icon name={t.icon} size={d(18)} />
              <Txt style={{ fontSize: d(12), fontFamily: "Nunito_900Black" }}>{t.text}</Txt>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
