import { useEffect,useState,type ReactNode } from "react";
import { Pressable,TextInput,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { birthdayLabel,cleanUsername,isUsername,MONTHS } from "../../../../core/showcase.js";
import { BottomSheet,SheetHandle } from "../../components/BottomSheet";
import { Chips,type ChipOption } from "../../components/customize/Chips";
import { useCosmeticColor } from "../../components/customize/colors";
import { EditorScreen } from "../../components/customize/EditorScreen";
import { RowGroup } from "../../components/customize/RowGroup";
import { SectionLabel } from "../../components/customize/SectionLabel";
import { TextField } from "../../components/customize/TextField";
import { NameText } from "../../components/NameText";
import { SettingToggle } from "../../components/SettingsControls";
import { Icon,Txt,useTheme } from "../../components/ui";
import { useDesignScale } from "../../components/useDesignScale";
import { destinations,isOpen,nameColors,nativeLanguages,shown,titles,whyTags,type Cosmetic } from "../../data/cosmetics";
import { profileSyncStatus,signedIn,usernameFree } from "../../lib/backend";
import { useApp,useProfile } from "../../lib/store";

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const chips = (list: Cosmetic[]): ChipOption[] => shown(list).map((x) => ({ id: x.id, label: x.label }));

/** A row of the city / birthday group: icon, a line that may hold an input, a small grey line, and a switch. */
function InfoRow({ icon, children, detail, label, value, onChange }: { icon: string; children: ReactNode; detail: string; label: string; value: boolean; onChange: (on: boolean) => void }) {
  const d = useDesignScale(), c = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: d(12), paddingHorizontal: d(14), paddingVertical: d(10), minHeight: d(60) }}>
      <Icon name={icon} size={d(24)} />
      <View style={{ flex: 1, gap: d(2) }}>
        {children}
        <Txt style={{ fontSize: d(12), lineHeight: d(15.6), color: c.muted }}>{detail}</Txt>
      </View>
      <SettingToggle label={label} value={value} onChange={onChange} />
    </View>
  );
}

/** Month and day as chips in a sheet: the month first, then the day closes it. */
function BirthdaySheet({ visible, value, onPick, onClose }: { visible: boolean; value: string | null; onPick: (b: string) => void; onClose: () => void }) {
  const d = useDesignScale(), c = useTheme();
  const [month, setMonth] = useState(value ? Number(value.slice(0, 2)) : 1);
  const day = value && Number(value.slice(0, 2)) === month ? String(Number(value.slice(3))) : null;
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.card, borderTopLeftRadius: d(28), borderTopRightRadius: d(28), borderWidth: d(2), borderBottomWidth: 0, borderColor: c.line }}>
        <View style={{ paddingHorizontal: d(20), paddingTop: d(10), paddingBottom: d(24), gap: d(12) }}>
          <SheetHandle />
          <Txt style={{ fontSize: d(22), fontFamily: "Nunito_900Black" }}>Tug&apos;ilgan kun</Txt>
          <Chips options={MONTHS.map((m, i) => ({ id: String(i + 1), label: m }))} value={String(month)} onChange={(id) => setMonth(Number(id))} />
          <Chips
            options={Array.from({ length: MONTH_DAYS[month - 1] }, (_, i) => ({ id: String(i + 1), label: String(i + 1) }))}
            value={day}
            onChange={(id) => { onPick(`${String(month).padStart(2, "0")}-${id.padStart(2, "0")}`); onClose(); }}
          />
        </View>
      </SafeAreaView>
    </BottomSheet>
  );
}

/**
 * Ism va men haqimda (screen jEs9F). The display name stays in settings.name; the rest is the profile.
 * The @username is checked on the server while signed in (a short pause after typing); otherwise it is only kept on the phone,
 * and the next sync tells if the server refused it (profileSyncStatus().usernameError).
 */
export default function AboutEditor() {
  const d = useDesignScale(), c = useTheme(), colour = useCosmeticColor(), { settings, set } = useApp(), { profile: p, setProfile, earned } = useProfile();
  const [name, setName] = useState(settings.name);
  const [username, setUsername] = useState(p.username);
  const [bio, setBio] = useState(p.bio);
  const [why, setWhy] = useState(p.why), [destination, setDestination] = useState(p.destination), [nativeLanguage, setNativeLanguage] = useState(p.nativeLanguage);
  const [city, setCity] = useState(p.city), [showCity, setShowCity] = useState(p.showCity);
  const [birthday, setBirthday] = useState(p.birthday), [birthdayGreet, setBirthdayGreet] = useState(p.birthdayGreet && !!p.birthday);
  const [title, setTitle] = useState(p.title ?? "none"), [nameColor, setNameColor] = useState(p.nameColor);
  const [sheet, setSheet] = useState(false);
  const [checked, setChecked] = useState<{ name: string; free: boolean } | null>(null);

  const status = profileSyncStatus();
  const refused = !!username && status.usernameError?.value === username;
  const ownAccepted = !!username && status.username === username;
  useEffect(() => {
    if (!isUsername(username) || refused || ownAccepted || !signedIn()) return;
    let live = true;
    const timer = setTimeout(() => { void usernameFree(username).then((free) => { if (live && free !== null) setChecked({ name: username, free }); }); }, 500);
    return () => { live = false; clearTimeout(timer); };
  }, [username, refused, ownAccepted]);
  const known = checked?.name === username ? checked.free : null;
  const taken = refused || known === false;
  const free = !taken && (ownAccepted || known === true);
  const shownName = name.trim() || "Siz";

  const titleOptions = shown(titles).filter((t) => t.id === "none" || isOpen(t, earned));
  const comingTitles = titles.filter((t) => t.id !== "none" && (t.ready === false || !isOpen(t, earned)));
  const colourOptions: ChipOption[] = shown(nameColors).map((x) => {
    const locked = !isOpen(x, earned);
    return x.id === "gradient"
      ? { id: x.id, label: locked ? x.label : shownName, locked, content: <NameText name={shownName} color="gradient" style={{ fontSize: d(14), lineHeight: d(18), fontFamily: "Nunito_900Black" }} /> }
      : { id: x.id, label: shownName, textColor: colour(x.color) };
  });

  const save = () => {
    set({ name: name.trim() });
    setProfile({
      username: isUsername(username) ? username : "", bio: bio.trim(), why, destination, nativeLanguage, city: city.trim(), showCity,
      birthday, birthdayGreet, title: title === "none" ? null : title, nameColor,
    });
  };
  return (
    <EditorScreen title="Ism va men haqimda" onSave={save} canSave={!!name.trim() && !taken && (username === "" || isUsername(username))}>
      <TextField label="Ism" note={`${name.length}/24`} value={name} onChangeText={setName} maxLength={24} placeholder="Ismingiz" />
      <TextField
        label="Foydalanuvchi nomi"
        note={taken ? "Band" : free ? "Band emas ✓" : undefined}
        noteColor={taken ? colour("danger") : undefined}
        value={username ? `@${username}` : ""}
        onChangeText={(t) => setUsername(cleanUsername(t))}
        placeholder="@username"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={21}
      />
      <TextField label="Men haqimda" note={`${bio.length}/60`} value={bio} onChangeText={setBio} maxLength={60} />
      <SectionLabel>NIMA UCHUN O&apos;RGANYAPMAN</SectionLabel>
      <Chips options={chips(whyTags)} value={why} onChange={(id) => setWhy(why === id ? null : id)} />
      <SectionLabel>ORZU MANZILI</SectionLabel>
      <Chips options={chips(destinations)} value={destination} onChange={(id) => setDestination(destination === id ? null : id)} />
      <SectionLabel>ONA TILI</SectionLabel>
      <Chips options={chips(nativeLanguages)} value={nativeLanguage} onChange={setNativeLanguage} />
      <RowGroup>
        <InfoRow icon="glyph-user-grey" label="Shahar" value={showCity} onChange={setShowCity} detail={showCity ? "Profilda ko'rinadi" : "Profilda ko'rinmaydi"}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Txt style={{ fontSize: d(15), fontFamily: "Nunito_800ExtraBold" }}>Shahar: </Txt>
            <TextInput
              accessibilityLabel="Shahar"
              value={city}
              onChangeText={setCity}
              maxLength={30}
              placeholder="Toshkent"
              placeholderTextColor={c.muted}
              style={{ flex: 1, padding: 0, color: c.text, fontSize: d(15), fontFamily: "Nunito_800ExtraBold" }}
            />
          </View>
        </InfoRow>
        <InfoRow icon="calendar" label="Tug'ilgan kun" value={birthdayGreet} onChange={(on) => { if (on && !birthday) setSheet(true); else setBirthdayGreet(on); }} detail="O'sha kuni Dombi tabriklaydi">
          <Pressable accessibilityRole="button" accessibilityLabel={birthday ? `Tug'ilgan kun: ${birthdayLabel(birthday)}` : "Tug'ilgan kun"} onPress={() => setSheet(true)}>
            <Txt style={{ fontSize: d(15), fontFamily: "Nunito_800ExtraBold" }}>{birthday ? `Tug'ilgan kun: ${birthdayLabel(birthday)}` : "Tug'ilgan kun"}</Txt>
          </Pressable>
        </InfoRow>
      </RowGroup>
      <SectionLabel>UNVON</SectionLabel>
      <Chips options={titleOptions.map((t) => ({ id: t.id, label: t.label }))} value={title} onChange={setTitle} />
      {comingTitles.length ? <Txt style={{ fontSize: d(13), lineHeight: d(18), color: c.muted }}>Yangi unvonlar darslar bilan ochiladi: {comingTitles.map((t) => t.label).join(", ")}.</Txt> : null}
      <SectionLabel>ISM RANGI</SectionLabel>
      <Chips options={colourOptions} value={nameColor} onChange={setNameColor} />
      <BirthdaySheet visible={sheet} value={birthday} onPick={(b) => { setBirthday(b); setBirthdayGreet(true); }} onClose={() => setSheet(false)} />
    </EditorScreen>
  );
}
