// Everything a learner can pick to dress their profile. Options, labels and order follow the approved Pencil screens
// (Avatar, Ramka, Banner, Ism va men haqimda, Dombi, Ranglar va fon, Ilova ko'rinishi, Avatar builder).
// No art exists yet, so entries use stand-ins: a colour, a picture from assets.ts, or a short symbol.
// Real art goes in `art` (a file name under design/profile-art/out/) without any code change.
//
// `color` is a name, not a hex: a useTheme() key (soft, coralSoft, blueSoft, cream...), one of the brand names
// violet / coral / gold / green (components/ui.tsx), or a shared.light token (danger). Only Dombi tints and skin tones are art values (hex).
// `earnedBy` is an id from earnedItems() in src/core/profile.js; an entry without it is free.
// `ready: false` keeps an entry out of the pickers until its art exists (Dombi outfits that Rive cannot draw yet).

export type Cosmetic = {
  id: string;
  /** Uzbek, exactly as on the screens */
  label: string;
  group?: string;
  color?: string;
  /** key in the pictures map of data/assets.ts */
  picture?: string;
  symbol?: string;
  earnedBy?: string;
  /** default true */
  ready?: boolean;
  art?: string;
};
export type CosmeticGroup = { id: string; label: string };

// Unit number to the name earned items use (frame.unit.cafe, title.unit.shop...).
export const unitSlugs: Record<number, string> = { 1: "salom", 2: "cafe", 3: "shop" };

const c = (id: string, label: string, rest: Partial<Cosmetic> = {}): Cosmetic => ({ id, label, ...rest });

// ---- Avatar (cIJCI) ----
export const avatarColors: Cosmetic[] = [
  c("violet", "Binafsha", { color: "violet" }),
  c("coral", "Marjon", { color: "coral" }),
  c("gold", "Oltin", { color: "gold" }),
  c("green", "Yashil", { color: "green" }),
];
export const avatarBackgrounds: Cosmetic[] = [
  c("plain", "Oddiy", { color: "violet" }),
  c("gradient", "Gradiyent", { color: "soft", symbol: "↗" }),
  c("ikat", "Ikat naqshi", { color: "blueSoft", symbol: "◆◆" }),
  c("atlas", "Atlas", { color: "tilePink", symbol: "≋" }),
];
export const expressions: Cosmetic[] = [
  c("calm", "Xotirjam"),
  c("smile", "Tabassum"),
  c("focus", "Diqqat"),
];
// Moving avatar: a Rive loop later; for now the locked tile shows a still face (Ruling 6).
export const movingAvatars: Cosmetic[] = [
  c("smile", "2-darajada ochiladi", { picture: "face-smile", earnedBy: "avatar.moving" }),
];

// ---- Frame (kReMk) ----
export const frameGroups: CosmeticGroup[] = [
  { id: "plain", label: "Oddiy" },
  { id: "streak", label: "Seriya" },
  { id: "unit", label: "Bo'limlar va daraja" },
  { id: "pattern", label: "Naqshlar" },
  { id: "special", label: "Bayramlar va maxsus" },
];
export const frames: Cosmetic[] = [
  c("none", "Yo'q", { group: "plain", symbol: "—" }),
  c("violet", "Binafsha", { group: "plain", color: "violet" }),
  c("gold", "Oltin", { group: "plain", color: "gold" }),
  c("coral", "Marjon", { group: "plain", color: "coral" }),
  c("streak7", "7 kun", { group: "streak", picture: "flame-streak", earnedBy: "frame.streak7" }),
  c("streak30", "30 kun", { group: "streak", picture: "flame-streak", earnedBy: "frame.streak30" }),
  c("streak100", "100 kun", { group: "streak", picture: "flame-streak", earnedBy: "frame.streak100" }),
  c("streak365", "365 kun", { group: "streak", picture: "flame-streak", earnedBy: "frame.streak365" }),
  c("unit.cafe", "Kafe", { group: "unit", picture: "coffee-kafeda", earnedBy: "frame.unit.cafe" }),
  c("unit.shop", "Do'kon", { group: "unit", picture: "cart-dokon", earnedBy: "frame.unit.shop" }),
  c("level.a1", "A1", { group: "unit", symbol: "A1", color: "violet", earnedBy: "frame.level.a1" }),
  c("level.a2", "A2", { group: "unit", symbol: "A2", color: "violet", earnedBy: "frame.level.a2" }),
  c("ikat", "Ikat", { group: "pattern", color: "blueSoft", symbol: "◆◆" }),
  c("suzani", "Suzani", { group: "pattern", color: "tilePink", symbol: "✿" }),
  c("rishton", "Rishton", { group: "pattern", color: "ice", symbol: "❃" }),
  c("samarqand", "Samarqand", { group: "pattern", color: "cream", symbol: "✦" }),
  c("navruz", "Navro'z", { group: "special", color: "good", symbol: "❀" }),
  c("newyear", "Yangi yil", { group: "special", color: "ice", symbol: "❄" }),
  // Seasonal frames open only in their date window (src/core/customize.js). These two have no screen yet, so they wait.
  c("independence", "Mustaqillik", { group: "special", color: "good", symbol: "★", ready: false }),
  c("ramadan", "Ramazon", { group: "special", color: "ice", symbol: "☾", ready: false }),
  c("perfect", "Mukammal · 10 dars", { group: "special", color: "gold", symbol: "●", earnedBy: "frame.perfect" }),
  c("speaker", "Notiq · 60 daqiqa", { group: "special", picture: "studio-mic", earnedBy: "frame.speaker" }),
];

// ---- Banner (YaZK1) ----
export const bannerGroups: CosmeticGroup[] = [
  { id: "color", label: "Rang va gradiyent" },
  { id: "city", label: "Shaharlar" },
  { id: "scene", label: "Sahnalar" },
  { id: "dombi", label: "Dombi va harakatli" },
];
export const banners: Cosmetic[] = [
  c("violet", "Binafsha", { group: "color", color: "soft" }),
  c("coral", "Marjon", { group: "color", color: "coralSoft" }),
  c("sky", "Ko'k", { group: "color", color: "blueSoft" }),
  c("gradient", "Gradiyent", { group: "color", color: "soft", symbol: "↗" }),
  c("registon", "Registon", { group: "city", color: "cream", symbol: "Registon" }),
  c("xiva", "Xiva devorlari", { group: "city", color: "orangeWash", symbol: "Xiva" }),
  c("toshkent", "Teleminora", { group: "city", color: "blueSoft", symbol: "Toshkent" }),
  c("chorsu", "Chorsu", { group: "city", color: "tilePink", symbol: "Chorsu" }),
  c("scene.cafe", "Kafe", { group: "scene", color: "orangeWash", picture: "coffee-kafeda", earnedBy: "frame.unit.cafe" }),
  c("scene.shop", "Do'kon · Do'kon bo'limida", { group: "scene", color: "tileGrey", picture: "cart-dokon", earnedBy: "frame.unit.shop" }),
  c("dombi.book", "Dombi kitob o'qiydi", { group: "dombi", color: "soft", picture: "pet-black-happy" }),
  c("moving.clouds", "Bulutlar · harakatli", { group: "dombi", color: "blueSoft", symbol: "☁ ☁" }),
];

// ---- Name and about me (jEs9F) ----
export const whyTags: Cosmetic[] = [
  c("work", "Ish"),
  c("travel", "Sayohat"),
  c("study", "O'qish"),
  c("ielts", "IELTS"),
  c("movies", "Kino"),
  c("family", "Oila"),
];
export const destinations: Cosmetic[] = [
  c("london", "London"),
  c("newyork", "Nyu-York"),
  c("dubai", "Dubay"),
  c("seoul", "Seul"),
];
export const nativeLanguages: Cosmetic[] = [
  c("uz", "O'zbekcha"),
  c("ru", "Русский"),
  c("kk", "Qoraqalpoqcha"),
  c("tg", "Тоҷикӣ"),
];
// Name colours: the name itself is drawn in the colour. The gradient is earned (30-day streak).
export const nameColors: Cosmetic[] = [
  c("default", "Oddiy", { color: "text" }),
  c("violet", "Binafsha", { color: "violet" }),
  c("coral", "Marjon", { color: "coral" }),
  c("gradient", "30 kun", { color: "violet", symbol: "▲", earnedBy: "nameColor.gradient" }),
];
// Titles under the name, all earned. Voice of the week has no way to be earned yet, so it waits (ready: false).
export const titles: Cosmetic[] = [
  c("none", "Yo'q"),
  c("unit.cafe", "Kafe muxlisi", { earnedBy: "title.unit.cafe" }),
  c("earlyBird", "Erta turuvchi", { earnedBy: "title.earlyBird" }),
  c("unit.shop", "Do'kon ustasi", { earnedBy: "title.unit.shop" }),
  c("voiceOfWeek", "Haftaning ovozi", { ready: false }),
  c("streak100", "100 kunlik seriya", { earnedBy: "frame.streak100" }),
];

// ---- Avatar builder (ZpeR2): one array per part, in the order of the tabs ----
export const builtPartTabs: CosmeticGroup[] = [
  { id: "skin", label: "Teri" },
  { id: "hair", label: "Soch" },
  { id: "eyes", label: "Ko'z" },
  { id: "brows", label: "Qosh" },
  { id: "beard", label: "Soqol" },
  { id: "glasses", label: "Ko'zoynak" },
  { id: "hijab", label: "Ro'mol" },
  { id: "doppi", label: "Do'ppi" },
  { id: "clothes", label: "Kiyim" },
];
// The skin tones are art values. `skin` in the profile is the index into this list (id "0".."5"). Other parts are stand-ins until the part art lands.
export const skinTones: Cosmetic[] = ["#F6D7B8", "#EBC09A", "#D9A27A", "#B97F57", "#8E5B3B", "#5E3A26"].map((hex, i) =>
  c(String(i), `Teri ${i + 1}`, { group: "skin", color: hex }),
);
export const builtParts: Cosmetic[] = [
  ...skinTones,
  c("short", "Qisqa", { group: "hair", symbol: "▬" }),
  c("long", "Uzun", { group: "hair", symbol: "≀" }),
  c("curly", "Jingalak", { group: "hair", symbol: "∿" }),
  c("round", "Dumaloq", { group: "eyes", symbol: "••" }),
  c("happy", "Quvnoq", { group: "eyes", symbol: "^^" }),
  c("straight", "Tekis", { group: "brows", symbol: "‾‾" }),
  c("arched", "Egri", { group: "brows", symbol: "⌒⌒" }),
  c("stubble", "Siyrak", { group: "beard", symbol: "∴" }),
  c("full", "To'liq", { group: "beard", symbol: "▼" }),
  c("round", "Dumaloq", { group: "glasses", symbol: "◯◯" }),
  c("sun", "Quyosh", { group: "glasses", symbol: "▬▬" }),
  c("plain", "Oddiy", { group: "hijab", symbol: "◖" }),
  c("doppi", "Do'ppi", { group: "doppi", picture: "top-hat" }),
  c("tee", "Futbolka", { group: "clothes", symbol: "▥" }),
  c("chapan", "Chopon", { group: "clothes", symbol: "▤" }),
];

// ---- Dombi (tZKk4) ----
export const dombiGroups: CosmeticGroup[] = [
  { id: "head", label: "Bosh kiyim" },
  { id: "neck", label: "Bo'yin" },
  { id: "hand", label: "Qo'lda" },
  { id: "glasses", label: "Ko'zoynak" },
  { id: "corner", label: "Burchak" },
];
// Only `none` and `doppi` exist in Rive. The rest wait for their art (Ruling 3), so no picker shows them yet.
const soon = (id: string, label: string, group: string, rest: Partial<Cosmetic> = {}) => c(id, label, { group, ready: false, ...rest });
export const dombiItems: Cosmetic[] = [
  c("none", "Yo'q", { group: "head", symbol: "—" }),
  c("doppi", "Do'ppi", { group: "head", picture: "top-hat" }),
  soon("tophat", "Shlyapa", "head", { picture: "top-hat" }),
  soon("graduation", "Bitiruv", "head", { picture: "grad-cap" }),
  soon("crown", "Toj", "head", { picture: "crown" }),
  soon("beanie", "Qalpoq", "head", { picture: "top-hat" }),
  soon("earflap", "Quloqchin", "head", { picture: "top-hat" }),
  soon("chef", "Oshpaz", "head", { picture: "top-hat" }),
  soon("cap", "Kepka", "head", { picture: "top-hat" }),
  soon("kalpak", "Kalpak", "head", { picture: "top-hat" }),
  soon("scarf", "Sharf", "neck", { picture: "scarf" }),
  soon("bowtie", "Kapalak", "neck"),
  soon("atlas", "Atlas lenta", "neck"),
  soon("headphones", "Naushnik", "neck", { picture: "glyph-headphones" }),
  soon("apple", "Olma", "hand", { picture: "apple-currency" }),
  soon("book", "Kitob", "hand", { picture: "book-phrase-list" }),
  soon("piyola", "Piyola", "hand"),
  soon("mic", "Mikrofon", "hand", { picture: "studio-mic" }),
  soon("flag", "Bayroqcha", "hand"),
  soon("round", "Dumaloq", "glasses"),
  soon("sun", "Quyosh", "glasses"),
  soon("reading", "O'qish uchun", "glasses"),
  soon("tulip", "Lola", "corner", { picture: "plant" }),
  soon("rug", "Gilam", "corner"),
  soon("cushion", "Yostiq", "corner"),
  soon("lamp", "Chiroq", "corner"),
  soon("shelf", "Kitob javoni", "corner"),
  soon("nonBasket", "Non savati", "corner"),
];
export const dombiPoses: Cosmetic[] = [
  c("sit", "O'tiradi", { picture: "pet-black-happy" }),
  c("wave", "Qo'l silkitadi", { picture: "hand-wave", ready: false }),
  c("read", "Kitob o'qiydi", { picture: "book-phrase-list", ready: false }),
  c("sleep", "Uxlaydi", { picture: "pet-black-sleepy", ready: false }),
];
// Dombi's tints stay black at heart: these are art values (hex).
export const dombiTints: Cosmetic[] = [
  c("black", "Qora", { color: "#2B2B3C" }),
  c("navy", "To'q ko'k", { color: "#1B2340" }),
  c("charcoal", "Ko'mir", { color: "#2E2E33" }),
  c("plum", "Olxo'ri", { color: "#2B1A2E" }),
];

// ---- Colours and background (OPgwZ) ----
export const profileColors: Cosmetic[] = [
  c("violet", "Binafsha", { color: "violet" }),
  c("coral", "Marjon", { color: "coral" }),
  c("gold", "Oltin", { color: "gold" }),
  c("green", "Yashil", { color: "green" }),
];
export const cardColors: Cosmetic[] = [
  c("white", "Oq", { color: "card" }),
  c("coral", "Marjon", { color: "coralSoft" }),
  c("sky", "Ko'k", { color: "blueSoft" }),
  c("gold", "Oltin", { color: "cream" }),
];
export const backgrounds: Cosmetic[] = [
  c("plain", "Oddiy", { color: "card" }),
  c("sky", "Ko'k", { color: "blueSoft" }),
  c("ikat", "Ikat naqshi", { color: "soft", symbol: "◆◆" }),
  c("registon", "Registon", { color: "cream", symbol: "Registon" }),
];

// ---- App look (lAk24). The theme ids are final; their palettes come with the theme work. ----
export const themes: Cosmetic[] = [
  c("violet", "Binafsha", { color: "violet" }),
  c("pomegranate", "Anor", { color: "danger" }),
  c("lagoon", "Ko'l", { color: "iceText" }),
  c("apricot", "O'rik", { color: "notYet" }),
  c("cotton", "Paxta", { color: "cream" }),
  c("night", "Tun", { color: "text" }),
];
export const appIcons: Cosmetic[] = [
  c("main", "Asosiy", { color: "violet", picture: "pet-black-happy" }),
  c("doppi", "Do'ppili Dombi", { color: "violet", picture: "top-hat" }),
  c("gold", "Oltin", { color: "gold", picture: "pet-black-happy" }),
  c("night", "Tun", { color: "text", picture: "pet-black-happy" }),
];
export const lessonBackgrounds: Cosmetic[] = [
  c("plain", "Oddiy", { color: "card" }),
  c("pattern", "Naqsh", { color: "soft", symbol: "◆◆" }),
  c("city", "Shahar", { color: "cream", symbol: "Registon" }),
];
export const pathSkins: Cosmetic[] = [
  c("road", "Yo'l"),
  c("bazaar", "Bozor"),
  c("caravan", "Karvon"),
  c("metro", "Metro"),
];

/** Entries a picker may show: art ready. */
export const shown = (list: Cosmetic[]) => list.filter((x) => x.ready !== false);
/** True when the entry is free or its earned id is in `earned` (from useProfile()). */
export const isOpen = (x: Cosmetic, earned: ReadonlySet<string>) => !x.earnedBy || earned.has(x.earnedBy);
