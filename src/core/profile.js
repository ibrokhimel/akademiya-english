// The profile a learner builds, and the items real progress earns. Pure logic, no app code.
export const SECTION_IDS = ['banner', 'title', 'bio', 'tags', 'level', 'joined', 'pinnedBadges', 'goal', 'stats', 'records', 'awards', 'trophyShelf', 'favouritePhrase', 'dombi'];
export const STAT_IDS = ['phrases', 'streak', 'minutesSpoken', 'lessons', 'level', 'prediction'];

const HIDDEN_BY_DEFAULT = ['joined', 'trophyShelf'];
const STATS_SHOWN = ['phrases', 'streak', 'lessons', 'level'];
const AVATAR_KINDS = ['letter', 'photo', 'media', 'dombi', 'built', 'moving'];
const MEDIA_TYPES = ['image', 'gif', 'video'];
const BANNER_KINDS = ['color', 'item', 'media'];
const BADGE_STYLES = ['grid', 'row', 'shelf'];
/** The username rule (the server's users.username field has the same pattern). */
export const USERNAME = /^[a-z0-9_]{3,20}$/;

export function defaultProfile() {
  return {
    v: 1,
    avatar: {
      kind: 'letter', color: 'violet', bg: 'plain', expression: 'smile', uri: null, mediaType: null,
      built: { skin: 2, hair: null, eyes: 'round', brows: null, beard: null, glasses: null, hijab: null, doppi: null, clothes: null },
    },
    frame: 'none',
    banner: { kind: 'color', id: 'violet', uri: null, mediaType: null },
    username: '', bio: '', why: null, destination: null, nativeLanguage: 'uz', city: '', showCity: false,
    birthday: null, birthdayGreet: true, title: null, nameColor: 'default',
    badges: { pinned: [], style: 'grid', shelfOrder: [], spotlightRarest: true },
    stats: { layout: 'grid', shown: [...STATS_SHOWN], favouritePhrase: null, wordOfWeek: '', private: false },
    dombi: { outfit: 'none', pose: 'sit', tint: 'black', name: 'Dombi', visitorReaction: 'wave' },
    look: {
      color: 'violet', cardColor: 'white', background: { kind: 'color', id: 'plain', uri: null, mediaType: null }, dim: 0.3,
      sections: SECTION_IDS.map((id) => ({ id, shown: !HIDDEN_BY_DEFAULT.includes(id) })),
    },
  };
}

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x, d) => (typeof x === 'string' && x !== '' ? x : d);
const text = (x, d) => (typeof x === 'string' ? x : d);
const oneOf = (x, list, d) => (list.includes(x) ? x : d);
const strList = (x) => (Array.isArray(x) ? [...new Set(x.filter((s) => typeof s === 'string' && s !== ''))] : []);

function media(raw, d) {
  const r = isObj(raw) ? raw : {};
  return { uri: typeof r.uri === 'string' && r.uri ? r.uri : d.uri, mediaType: oneOf(r.mediaType, MEDIA_TYPES, d.mediaType) };
}

function sectionsOf(raw) {
  const out = [];
  for (const s of Array.isArray(raw) ? raw : []) {
    if (isObj(s) && SECTION_IDS.includes(s.id) && !out.some((o) => o.id === s.id) && typeof s.shown === 'boolean') out.push({ id: s.id, shown: s.shown });
  }
  SECTION_IDS.forEach((id, i) => {
    if (!out.some((o) => o.id === id)) out.splice(Math.min(i, out.length), 0, { id, shown: !HIDDEN_BY_DEFAULT.includes(id) });
  });
  return out;
}

export function normalizeProfile(raw) {
  const d = defaultProfile();
  const r = isObj(raw) ? raw : {};
  const av = isObj(r.avatar) ? r.avatar : {}, bt = isObj(av.built) ? av.built : {}, bn = isObj(r.banner) ? r.banner : {};
  const bg = isObj(r.look) && isObj(r.look.background) ? r.look.background : {};
  const bd = isObj(r.badges) ? r.badges : {}, st = isObj(r.stats) ? r.stats : {}, dm = isObj(r.dombi) ? r.dombi : {}, lk = isObj(r.look) ? r.look : {};
  const nullableStr = (x) => (typeof x === 'string' && x !== '' ? x : null);
  const username = typeof r.username === 'string' ? r.username.toLowerCase() : '';
  const shown = Array.isArray(st.shown) ? [...new Set(st.shown.filter((s) => STAT_IDS.includes(s)))] : d.stats.shown;
  const dim = typeof lk.dim === 'number' && Number.isFinite(lk.dim) ? Math.min(0.8, Math.max(0, lk.dim)) : d.look.dim;
  return {
    v: 1,
    avatar: {
      kind: oneOf(av.kind, AVATAR_KINDS, d.avatar.kind), color: str(av.color, d.avatar.color), bg: str(av.bg, d.avatar.bg), expression: str(av.expression, d.avatar.expression),
      ...media(av, d.avatar),
      built: {
        skin: Number.isInteger(bt.skin) && bt.skin >= 0 ? bt.skin : d.avatar.built.skin, hair: nullableStr(bt.hair), eyes: str(bt.eyes, d.avatar.built.eyes), brows: nullableStr(bt.brows),
        beard: nullableStr(bt.beard), glasses: nullableStr(bt.glasses), hijab: nullableStr(bt.hijab), doppi: nullableStr(bt.doppi), clothes: nullableStr(bt.clothes),
      },
    },
    frame: str(r.frame, d.frame),
    banner: { kind: oneOf(bn.kind, BANNER_KINDS, d.banner.kind), id: str(bn.id, d.banner.id), ...media(bn, d.banner) },
    username: USERNAME.test(username) ? username : '',
    bio: text(r.bio, '').slice(0, 60),
    why: nullableStr(r.why), destination: nullableStr(r.destination), nativeLanguage: str(r.nativeLanguage, d.nativeLanguage),
    city: text(r.city, ''), showCity: r.showCity === true,
    birthday: typeof r.birthday === 'string' && /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(r.birthday) ? r.birthday : null,
    birthdayGreet: typeof r.birthdayGreet === 'boolean' ? r.birthdayGreet : d.birthdayGreet,
    title: nullableStr(r.title), nameColor: str(r.nameColor, d.nameColor),
    badges: { pinned: strList(bd.pinned).slice(0, 3), style: oneOf(bd.style, BADGE_STYLES, d.badges.style), shelfOrder: strList(bd.shelfOrder), spotlightRarest: typeof bd.spotlightRarest === 'boolean' ? bd.spotlightRarest : d.badges.spotlightRarest },
    stats: { layout: str(st.layout, d.stats.layout), shown, favouritePhrase: nullableStr(st.favouritePhrase), wordOfWeek: text(st.wordOfWeek, ''), private: st.private === true },
    dombi: { outfit: str(dm.outfit, d.dombi.outfit), pose: str(dm.pose, d.dombi.pose), tint: str(dm.tint, d.dombi.tint), name: str(dm.name, d.dombi.name), visitorReaction: str(dm.visitorReaction, d.dombi.visitorReaction) },
    look: {
      color: str(lk.color, d.look.color), cardColor: str(lk.cardColor, d.look.cardColor),
      background: { kind: oneOf(bg.kind, BANNER_KINDS, d.look.background.kind), id: str(bg.id, d.look.background.id), ...media(bg, d.look.background) },
      dim, sections: sectionsOf(lk.sections),
    },
  };
}

// facts = { bestStreak, perfectLessons, minutesSpoken, level, unitsDone: [unitId], earlyLessons }. "Earned" means ever reached.
export function earnedItems(facts = {}) {
  const { bestStreak = 0, perfectLessons = 0, minutesSpoken = 0, level = 0, unitsDone = [], earlyLessons = 0 } = facts || {};
  const out = new Set();
  for (const n of [7, 30, 100, 365]) if (bestStreak >= n) out.add(`frame.streak${n}`);
  if (bestStreak >= 30) out.add('nameColor.gradient');
  if (perfectLessons >= 10) out.add('frame.perfect');
  if (minutesSpoken >= 60) out.add('frame.speaker');
  ['a1', 'a2', 'b1', 'b2', 'c1'].forEach((c, i) => { if (level >= i + 1) out.add(`frame.level.${c}`); });
  if (level >= 2) out.add('avatar.moving');
  if (earlyLessons >= 5) out.add('title.earlyBird');
  for (const id of Array.isArray(unitsDone) ? unitsDone.filter((u) => typeof u === 'string' && u !== '') : []) { out.add(`frame.unit.${id}`); out.add(`title.unit.${id}`); }
  return out;
}

// What leaves the phone: the profile without any local file path (the picture itself goes up as a file).
export function profileForSync(profile) {
  const p = normalizeProfile(profile);
  p.avatar.uri = null; p.banner.uri = null; p.look.background.uri = null;
  return p;
}

// The pictures, GIFs and videos the profile uses right now: which users field each goes to, and where it is on the phone.
function mediaInUse(profile) {
  const p = normalizeProfile(profile), out = [];
  const ownPicture = p.avatar.kind === 'photo' || p.avatar.kind === 'media' || (p.avatar.kind === 'letter' && p.avatar.bg === 'own');
  if (ownPicture && p.avatar.uri) out.push({ field: 'avatar', uri: p.avatar.uri, mediaType: p.avatar.mediaType });
  if (p.banner.kind === 'media' && p.banner.uri) out.push({ field: 'banner', uri: p.banner.uri, mediaType: p.banner.mediaType });
  if (p.look.background.kind === 'media' && p.look.background.uri) out.push({ field: 'background', uri: p.look.background.uri, mediaType: p.look.background.mediaType });
  return out;
}

// done = { avatar: uri, banner: uri, background: uri } of what was uploaded last. Returns the media still to upload.
export function mediaToUpload(profile, done) {
  const sent = isObj(done) ? done : {};
  return mediaInUse(profile).filter((m) => sent[m.field] !== m.uri);
}
