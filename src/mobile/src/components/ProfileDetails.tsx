import { router } from "expo-router";
import { Pressable,ScrollView,View } from "react-native";
import { rarestBadge,shows } from "../../../core/showcase.js";
import { testToolsEnabled } from "../lib/config";
import { longDate } from "../lib/progressExtras";
import { useApp } from "../lib/store";
import { AwardsSection,TrophyShelf,useBadges } from "./Badges";
import { Count } from "./Motion";
import { FavouritePhraseRow,StatsBlock } from "./ProfileStats";
import { Icon,Txt,useTheme } from "./ui";
import { useDesignScale } from "./useDesignScale";

export function ProfileDetails() {
  const d = useDesignScale(), c = useTheme(), { facts: f, progress: p, settings } = useApp();
  const later = () => router.navigate("/problem?kind=not-ready");
  const section = (title: string) => <Txt style={{ fontSize: d(13), letterSpacing: d(.8), color: c.muted, fontFamily: "Nunito_900Black" }}>{title}</Txt>;
  const records = [
    { bg: c.tileOrange, icon: "flame-streak", value: f.best, title: "Eng uzun seriya", date: f.bestEnd ? longDate(f.bestEnd + "T12:00") : "—" },
    { bg: c.tileGold, icon: "sparkles", value: f.perfect.length, title: "Mukammal darslar", date: f.perfect.length ? longDate(f.perfect.at(-1)!.at) : "—" },
    { bg: c.tileGrey, icon: "bubble-phrases", value: p.phrases, title: "Iboralar", date: f.last ? longDate(f.last) : "—" },
  ];
  const profile = settings.profile, { awards, badges } = useBadges();
  const spotlight = profile.badges.spotlightRarest ? rarestBadge(badges) : null;
  // private mode: no number anywhere on the profile
  const hidden = profile.stats.private;
  return <>
    <StatsBlock label={section("UMUMIY KO'RINISH")} extra={testToolsEnabled && !hidden ? [["medal-silver", null, "Liga yo'q"], ["apple-currency", 0, " olma"]].map(([icon, value, suffix]) => <Pressable key={String(icon)} onPress={value === null ? later : undefined} style={{ width: d(170), flexDirection: "row", alignItems: "center", gap: d(10) }}><Icon name={String(icon)} size={d(30)} />{value === null ? <Txt style={{ fontSize: d(18), color: c.muted, fontFamily: "Nunito_900Black" }}>{suffix}</Txt> : <Count value={Number(value)} suffix={String(suffix)} style={{ fontSize: d(18) }} />}</Pressable>) : null} />
    {profile.stats.favouritePhrase && shows(profile, "favouritePhrase") ? <>
    {section("SEVIMLI IBORA")}
    <FavouritePhraseRow phraseId={profile.stats.favouritePhrase} />
    </> : null}
    {profile.stats.wordOfWeek ? <>
    {section("HAFTA SO'ZI")}
    <Txt style={{ paddingHorizontal: d(16), paddingVertical: d(12), borderRadius: d(16), borderWidth: d(2), borderColor: c.line, fontSize: d(17), fontFamily: "Nunito_800ExtraBold" }}>{profile.stats.wordOfWeek}</Txt>
    </> : null}
    {testToolsEnabled ? <>
    {section("DO'STLAR BILAN SERIYA")}
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{[0, 1, 2, 3, 4].map(i => <Pressable key={i} onPress={later} accessibilityLabel="DO'ST QO'SHISH" style={{ width: d(58), height: d(58), borderRadius: d(29), borderWidth: d(2), borderColor: c.edge, justifyContent: "center", alignItems: "center" }}><Txt style={{ fontSize: d(28), color: c.edge }}>+</Txt></Pressable>)}</View>
    </> : null}
    {hidden ? null : section("SHAXSIY REKORDLAR")}
    {hidden ? null :     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: d(-20) }} contentContainerStyle={{ paddingHorizontal: d(20), gap: d(12) }}>{records.map(r => <View key={r.title} style={{ width: d(150), paddingVertical: d(14), paddingHorizontal: d(10), borderWidth: d(2), borderColor: c.line, borderRadius: d(20), alignItems: "center", gap: d(4) }}><View style={{ width: d(96), height: d(96) }}><View style={{ position: "absolute", left: d(-3), top: d(-7), width: d(102), height: d(102), borderRadius: d(26), backgroundColor: r.bg }} /><Icon name={r.icon} size={d(52)} style={{ position: "absolute", left: d(22), top: d(2) }} /><Txt style={{ position: "absolute", left: 0, right: 0, top: d(58), textAlign: "center", fontSize: d(24), fontFamily: "Nunito_900Black" }}>{r.value}</Txt></View><Txt style={{ textAlign: "center", fontSize: d(14), fontFamily: "Nunito_900Black" }}>{r.title}</Txt><Txt style={{ fontSize: d(12), color: c.muted, fontFamily: "Nunito_800ExtraBold" }}>{r.date}</Txt></View>)}</ScrollView>}
    {section("MUKOFOTLAR")}
    <AwardsSection awards={awards} style={profile.badges.style} spotlightId={spotlight} hideNumbers={hidden} />
    {shows(profile, "trophyShelf") ? <>
    {section("KUBOKLAR JAVONI")}
    <TrophyShelf trophies={badges.filter(b => b.trophy)} order={profile.badges.shelfOrder} />
    </> : null}
    <Txt style={{ paddingTop: d(10), textAlign: "center", fontSize: d(10), color: c.faint }}>Akademiya English · 1.0</Txt>
  </>;
}
