import { router,useScrollToTop } from "expo-router";
import { useRef,useState } from "react";
import {
Pressable,
ScrollView,
View,
useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuditScroll } from "../../audit/layout";
import { GoalSheet } from "../../components/GoalSheet";
import { ProfileDetails } from "../../components/ProfileDetails";
import { RaisedPressable } from "../../components/RaisedPressable";
import {
Icon,
Txt,
useTheme,
violet
} from "../../components/ui";
import { goals } from "../../data/content";
import { testToolsEnabled } from "../../lib/config";
import { useHomeBack } from "../../lib/navigation";
import { useApp } from "../../lib/store";
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
  const joined = settings.joined ? new Date(settings.joined) : new Date();
  const date = `${["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"][joined.getMonth()]} ${joined.getFullYear()}`;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false}>
        <View
          style={{
            height: d(199),
            backgroundColor: c.soft,
            position: "relative",
          }}
        >
          <View
            style={{
              position: "absolute",
              right: d(14),
              top: d(8),
              flexDirection: "row",
              gap: d(8),
            }}
          >
            {[
              [
                "glyph-more-violet",
                "Profil menyusi",
                () => router.navigate("/account"),
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
                edgeColor={settings.dark ? "#16132E" : "#D9CFFF"}
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
          </View>
          <Txt
            style={{
              position: "absolute",
              right: d(14),
              bottom: d(6),
              fontSize: d(11),
              color: c.muted,
              fontFamily: "Nunito_800ExtraBold",
            }}
          >
            {date}
          </Txt>
        </View>
        <View
          style={{ paddingHorizontal: d(20), paddingBottom: d(28), gap: d(18), backgroundColor: c.bg }}
        >
          <View style={{ height: d(68) }}>
            <View
              style={{
                position: "absolute",
                left: 0,
                top: d(-26),
                width: d(96),
                height: d(96),
                borderRadius: d(48),
                backgroundColor: violet,
                borderWidth: d(4),
                borderColor: c.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt
                style={{
                  fontSize: d(43),
                  color: "#FFFFFF",
                  fontFamily: "Nunito_900Black",
                }}
              >
                {name[0].toUpperCase()}
              </Txt>
            </View>
            <Txt
              numberOfLines={1}
              style={{
                position: "absolute",
                left: d(110),
                right: d(104),
                top: d(24),
                fontSize: d(26),
                lineHeight: d(29),
                fontFamily: "Nunito_900Black",
              }}
            >
              {name}
            </Txt>
            <View
              style={{
                position: "absolute",
                right: 0,
                top: d(29),
                flexDirection: "row",
                gap: d(6),
                alignItems: "center",
                paddingVertical: d(6),
                paddingHorizontal: d(8),
                borderRadius: 99,
                backgroundColor: c.soft,
              }}
            >
              <Icon name="level-badge" size={d(18)} />
              <Txt
                style={{
                  fontSize: d(12),
                  color: violet,
                  fontFamily: "Nunito_900Black",
                }}
              >
                {p.level}-daraja
              </Txt>
            </View>
          </View>
          <Pressable
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
                color: violet,
                fontFamily: "Nunito_900Black",
              }}
            >
              O&apos;ZGARTIRISH
            </Txt>
          </Pressable>
          {testToolsEnabled ? <>
          <View
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
                  color: violet,
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
          </View>
          <View
            style={{
              backgroundColor: settings.dark ? "#2E8FC8" : "#4FB6F0",
              borderRadius: d(20),
              borderBottomWidth: 4,
              borderColor: "#2E95D0",
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
                    color: "#FFFFFF",
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
                      color: "#FFE27A",
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
              backgroundColor={settings.dark ? "#E8F6FD" : "#FFFFFF"}
              edgeColor={settings.dark ? "#9CCBE6" : "#D7ECF8"}
              faceStyle={{
                minHeight: d(48),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt
                style={{
                  fontSize: d(14),
                  color: "#2E95D0",
                  fontFamily: "Nunito_900Black",
                }}
              >
                KO&apos;RISH
              </Txt>
            </RaisedPressable>
          </View>
          </> : null}
          <ProfileDetails />
        </View>
      </ScrollView>
      <GoalSheet visible={goalOpen} onClose={() => setGoalOpen(false)} />
    </SafeAreaView>
  );
}
