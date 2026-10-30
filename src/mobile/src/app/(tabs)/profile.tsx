import { router,useScrollToTop } from "expo-router";
import { Fragment,useRef,useState } from "react";
import {
Pressable,
ScrollView,
View,
useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuditScroll } from "../../audit/layout";
import { GoalSheet } from "../../components/GoalSheet";
import { DombiOverlay } from "../../components/TabChrome";
import { Avatar } from "../../components/Avatar";
import { AvatarFrame } from "../../components/AvatarFrame";
import { Arrive } from "../../components/Motion";
import { ProfilePinned } from "../../components/Badges";
import { ProfileAbout } from "../../components/ProfileAbout";
import { ProfileBackground } from "../../components/ProfileBackground";
import { ProfileBanner } from "../../components/ProfileBanner";
import { ProfileDetail,ProfileFooter,detailParts,type DetailPart } from "../../components/ProfileDetails";
import { ProfileHeader } from "../../components/ProfileHeader";
import { useLookColors } from "../../components/customize/colors";
import { RaisedPressable } from "../../components/RaisedPressable";
import {
Icon,
Txt,
useTheme
} from "../../components/ui";
import { titles } from "../../data/cosmetics";
import { goals } from "../../data/content";
import { testToolsEnabled } from "../../lib/config";
import { useHomeBack } from "../../lib/navigation";
import { useApp } from "../../lib/store";
import { poseMoment,profileLayout } from "../../../../core/showcase.js";
import type { DombiMoment } from "../../components/Dombi";
export default function Profile() {
  useHomeBack();
  const scroll = useRef<ScrollView>(null);
  useScrollToTop(scroll);
  const { settings, progress: p } = useApp(),
    c = useTheme(),
    { width } = useWindowDimensions(),
    scale = Math.min(width / 390, 1.2),
    d = (n: number) => n * scale;
  useAuditScroll(scroll, scale);
  const goal = goals.find((g) => g[0] === settings.goal) || goals[4],
    name = settings.name.trim() || "Siz",
    later = () =>
      router.navigate("/problem?kind=not-ready");
  const [goalOpen, setGoalOpen] = useState(false);
  // "Nimalar ko'rinsin": the header parts by their switch, the rest in the learner's order (the name always shows)
  const profile = settings.profile,
    look = useLookColors(profile.look),
    layout = profileLayout(profile),
    title = layout.title ? titles.find((t) => t.id === profile.title)?.label : undefined;
  const joined = settings.joined ? new Date(settings.joined) : new Date();
  const date = `${["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"][joined.getMonth()]} ${joined.getFullYear()}`;
  const goalCard = (
          <Arrive index={1}><Pressable
            onPress={() => setGoalOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: d(12),
              padding: d(14),
              borderRadius: d(16),
              backgroundColor: c.blueSoft,
            }}
          >
            <Icon name={goal[1]} size={d(36)} />
            <View style={{ flex: 1, gap: 3 }}>
              <Txt style={{ fontSize: d(15), fontFamily: "Nunito_900Black" }}>
                {goal[2]}
              </Txt>
              <Txt style={{ fontSize: d(12), color: c.muted }}>
                {(
                  {
                    school: "Darslar va imtihonlar",
                    ielts: "Imtihonga tayyorlanish",
                    travel: "Kafe, do'kon, ...",
                    work: "Hamkasblar bilan gaplashish",
                    self: "Kundalik suhbatlar",
                  } as Record<string, string>
                )[settings.goal] || "Kundalik suhbatlar"}
              </Txt>
            </View>
            <Txt
              style={{
                fontSize: d(12),
                letterSpacing: d(.3),
                color: c.accentText,
                fontFamily: "Nunito_900Black",
              }}
            >
              O&apos;ZGARTIRISH
            </Txt>
          </Pressable></Arrive>
  );
  const testCards = (
          testToolsEnabled ? <>
          <Arrive index={2}
            style={{ flexDirection: "row", alignItems: "center", gap: d(12) }}
          >
            <View style={{ paddingLeft: d(2), paddingRight: d(6) }}>
              <Txt style={{ fontSize: d(20), lineHeight: d(22), fontFamily: "Nunito_900Black" }}>
                0
              </Txt>
              <Txt
                style={{
                  fontSize: d(13),
                  color: c.muted,
                  fontFamily: "Nunito_800ExtraBold",
                }}
              >
                Do&apos;stlar
              </Txt>
            </View>
            <RaisedPressable
              onPress={later}
              accessibilityLabel="DO'ST QO'SHISH"
              style={{ flex: 1 }}
              radius={d(16)}
              depth={d(4)}
              backgroundColor={c.bg}
              edgeColor={c.line}
              faceStyle={{
                minHeight: d(50),
                borderWidth: d(2),
                borderColor: c.line,
                flexDirection: "row",
                gap: d(8),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon name="glyph-user-violet" size={d(24)} />
              <Txt
                style={{
                  fontSize: d(14),
                  color: c.accentText,
                  letterSpacing: 0.6,
                  fontFamily: "Nunito_900Black",
                }}
              >
                DO&apos;ST QO&apos;SHISH
              </Txt>
            </RaisedPressable>
            <RaisedPressable
              accessibilityLabel="Kontaktlar"
              onPress={later}
              radius={d(16)}
              depth={d(4)}
              backgroundColor={c.bg}
              edgeColor={c.line}
              faceStyle={{
                width: d(50),
                height: d(50),
                borderWidth: d(2),
                borderColor: c.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="glyph-phone-violet" size={d(26)} />
            </RaisedPressable>
          </Arrive>
          <Arrive index={3}
            style={{
              backgroundColor: c.promo,
              borderRadius: d(20),
              borderBottomWidth: 4,
              borderColor: c.promoEdge,
              padding: d(18),
              gap: d(8),
            }}
          >
            <View
              style={{ flexDirection: "row", gap: d(10), alignItems: "center" }}
            >
              <View style={{ flex: 1 }}>
                <Txt
                  style={{
                    fontSize: d(18),
                    lineHeight: d(23),
                    color: c.onFill,
                    fontFamily: "Nunito_900Black",
                  }}
                >
                  Darslar bilan hayvoningizga yangi kiyim oling!
                </Txt>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <Icon name="glyph-timer-white" size={d(18)} />
                  <Txt
                    style={{
                      fontSize: d(13),
                      color: c.promoTag,
                      fontFamily: "Nunito_900Black",
                    }}
                  >
                    10 KUNDA
                  </Txt>
                </View>
              </View>
              <View style={{ width: d(96), height: d(84) }}>
                <View
                  style={{
                    position: "absolute",
                    left: d(50),
                    top: d(-11),
                    transform: [{ rotate: "-17deg" }],
                  }}
                >
                  <Icon name="top-hat" size={d(52)} />
                </View>
                <View
                  style={{
                    position: "absolute",
                    left: d(-14),
                    top: d(51),
                    transform: [{ rotate: "12deg" }],
                  }}
                >
                  <Icon name="scarf" size={d(56)} />
                </View>
              </View>
            </View>
            <RaisedPressable
              onPress={later}
              accessibilityLabel="KO'RISH"
              radius={d(14)}
              depth={d(4)}
              backgroundColor={c.promoButton}
              edgeColor={c.promoButtonEdge}
              faceStyle={{
                minHeight: d(48),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt
                style={{
                  fontSize: d(14),
                  color: c.promoText,
                  fontFamily: "Nunito_900Black",
                }}
              >
                KO&apos;RISH
              </Txt>
            </RaisedPressable>
          </Arrive>
          </> : null
  );
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <ProfileBackground background={profile.look.background} dim={profile.look.dim} />
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={name}
          nameColor={profile.nameColor}
          accent={look.name}
          caption={title}
          level={profile.stats.private || !layout.level ? undefined : p.level}
          date={layout.joined ? date : undefined}
          dateOnImage={layout.banner && settings.profile.banner.kind === "media"}
          animate
          banner={layout.banner ? <ProfileBanner banner={settings.profile.banner} height={d(199)} /> : undefined}
          avatar={(size) => <Avatar avatar={settings.profile.avatar} name={name} size={size} dombiOutfit={settings.profile.dombi.outfit} />}
          frame={(size, avatar) => <AvatarFrame id={settings.profile.frame} size={size}>{avatar}</AvatarFrame>}
          actions={[
            [
              "glyph-more-violet",
              "Profil menyusi",
              () => router.navigate("/customize"),
            ],
            [
              "glyph-gear-violet",
              "Sozlamalar",
              () => router.navigate("/settings"),
            ],
          ].map(([icon, label, press]) => (
            <RaisedPressable
              key={String(icon)}
              accessibilityLabel={String(label)}
              onPress={press as () => void}
              radius={d(19)}
              depth={d(3)}
              backgroundColor={c.card}
              edgeColor={c.menuEdge}
              faceStyle={{
                width: d(38),
                height: d(38),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={String(icon)} size={d(28)} />
            </RaisedPressable>
          ))}
        />
        <View
          style={{ paddingHorizontal: d(20), paddingTop: d(18), paddingBottom: d(28), gap: d(18) }}
        >
          {layout.body.map((id, i) => {
            // a part with nothing in it takes no room: records in private mode, no favourite phrase picked
            if ((id === "records" && profile.stats.private) || (id === "favouritePhrase" && !profile.stats.favouritePhrase)) return null;
            if (id === "bio" || id === "tags") return <ProfileAbout key={id} profile={profile} part={id} />;
            if (id === "pinnedBadges") return <ProfilePinned key={id} />;
            if (id === "goal") return <Fragment key={id}>{goalCard}{testCards}</Fragment>;
            if (detailParts.includes(id)) return <Arrive key={id} index={Math.min(i + 1, 4)} style={{ gap: d(14) }}><ProfileDetail part={id as DetailPart} /></Arrive>;
            return null;
          })}
          <ProfileFooter />
        </View>
      </ScrollView>
      {/* his corner: the pose the learner picked (the first-lesson hint first); hidden in "Nimalar ko'rinsin" */}
      {layout.dombi ? <DombiOverlay phone moment={Object.keys(p.done).length ? poseMoment(profile.dombi.pose) as DombiMoment : "guide"} line={Object.keys(p.done).length ? undefined : "Birinchi darsdan keyin bu yer to'la boshlaydi."} /> : null}
      <GoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
    </SafeAreaView>
  );
}
