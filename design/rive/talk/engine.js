// Dombi talking engine: text -> phonemes (EN / UZ / RU) -> visemes 0-9 (+11) -> timed track.
// Rules and numbers: research/5-visemes.md (§2.4 phoneme→viseme, §3 G2P, §4 timing + smoothing). Pure ES module,
// runs in the browser and in Node. English needs the CMUdict object passed in (cmu-pronouncing-dictionary, ISC).
export const V = { REST: 0, MBP: 1, FV: 2, TEETH: 3, EE: 4, EH: 5, AA: 6, OH: 7, OO: 8, SH_R: 9, TH: 10, UH: 11 };
export const VNAME = { 0: 'REST', 1: 'MBP', 2: 'FV', 3: 'TEETH', 4: 'EE', 5: 'EH', 6: 'AA', 7: 'OH', 8: 'OO', 9: 'SH_R', 10: 'TH', 11: 'UH' };

// ---------- phoneme classes + visemes (IPA-ish symbols used internally) ----------
const VOWELS = new Set(['i', 'ɪ', 'ɨ', 'e', 'ɛ', 'æ', 'ə', 'ɐ', 'ʌ', 'ɑ', 'a', 'ɔ', 'ɒ', 'o', 'ʊ', 'u', 'ɝ', 'oʻ']);
const CLASS = {
  p: 'plosive', b: 'plosive', t: 'plosive', d: 'plosive', k: 'plosive', ɡ: 'plosive', q: 'plosive', ʔ: 'stop',
  f: 'fricative', v: 'fricative', ɸ: 'fricative', θ: 'fricative', ð: 'fricative', s: 'fricative', z: 'fricative',
  ʃ: 'fricative', ʒ: 'fricative', ʂ: 'fricative', ʐ: 'fricative', ɕ: 'fricative', x: 'fricative', χ: 'fricative', ʁ: 'fricative', h: 'fricative',
  tʃ: 'affricate', dʒ: 'affricate', ts: 'affricate', tɕ: 'affricate',
  m: 'nasal', n: 'nasal', ŋ: 'nasal', l: 'liquid', r: 'liquid', ɹ: 'liquid', j: 'glide', w: 'glide',
};
const PH2V = {
  p: 1, b: 1, m: 1, f: 2, v: 2, ɸ: 2, w: 8,
  θ: 10, ð: 10, t: 3, d: 3, n: 3, s: 3, z: 3, ts: 3, k: 3, ɡ: 3, ŋ: 3, q: 3, x: 3, χ: 3, ʁ: 3, r: 3, ɪ: 4, ɨ: 3,   // ɪ -> EE (as TEETH it froze the mouth between consonants)
  l: 5, ɹ: 9, ʃ: 9, ʒ: 9, tʃ: 9, dʒ: 9, ʂ: 9, ʐ: 9, tɕ: 9, ɕ: 9, ɝ: 9,
  j: 4, i: 4, e: 5, ɛ: 5, æ: 5, ʌ: 5, ɐ: 5, ə: 11, ɑ: 6, a: 6, ɔ: 7, ɒ: 7, o: 7, 'oʻ': 8, ʊ: 8, u: 8,
};
const BASE = { vowelStressed: 170, vowelUnstressed: 95, vowelReduced: 60, plosive: 70, fricative: 90, affricate: 90,
               nasal: 65, liquid: 65, glide: 55, stop: 50, comma: 220, sentence: 420 };
export const LANG_MULT = { en: 1.0, uz: 1.0, ru: 0.95 };

// ---------- Uzbek (Latin) ----------
const UZ = [["o'", 'oʻ'], ["g'", 'ʁ'], ['sh', 'ʃ'], ['ch', 'tʃ'], ['ng', 'ŋ'], ['ts', 'ts'],
  ['a', 'a'], ['b', 'b'], ['d', 'd'], ['e', 'e'], ['f', 'ɸ'], ['g', 'ɡ'], ['h', 'h'], ['i', 'i'], ['j', 'dʒ'], ['k', 'k'],
  ['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'ɒ'], ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'], ['u', 'u'],
  ['v', 'v'], ['x', 'χ'], ['y', 'j'], ['z', 'z'], ['c', 'ts'], ['w', 'w']];
export function g2pUz(word) {
  let w = word.toLowerCase().replace(/[ʻ‘’`ʼ]/g, "'");
  const out = [];
  for (let i = 0; i < w.length;) {
    if (w[i] === "'") { if (!(i > 0 && (w[i - 1] === 'o' || w[i - 1] === 'g'))) out.push({ ph: 'ʔ' }); i++; continue; }
    const hit = UZ.find(([g]) => w.startsWith(g, i));
    if (hit) { out.push({ ph: hit[1] }); i += hit[0].length; } else i++;
  }
  const uvular = (p) => p && ['q', 'χ', 'ʁ'].includes(p.ph);
  out.forEach((p, i) => {
    if (p.ph === 'a') p.ph = uvular(out[i - 1]) || uvular(out[i + 1]) ? 'ɑ' : 'æ';
    if (p.ph === 'i' && (uvular(out[i - 1]) || uvular(out[i + 1]))) p.ph = 'ɨ';
    if (p.ph === 'n' && out[i + 1] && ['b', 'p'].includes(out[i + 1].ph)) p.ph = 'm';
    if (p.ph === 'v' && i > 0 && VOWELS.has(out[i - 1].ph) && (!out[i + 1] || !VOWELS.has(out[i + 1].ph))) p.ph = 'w';
  });
  const vi = out.map((p, i) => VOWELS.has(p.ph) ? i : -1).filter(i => i >= 0);
  if (vi.length) out[vi[vi.length - 1]].stress = 1;                  // Uzbek stress: last syllable
  out.forEach(p => { if (!p.stress && (p.ph === 'i' || p.ph === 'u')) p.short = true; });
  return out;
}

// ---------- Russian (Cyrillic) ----------
const RU_EXC = [[/^что(бы)?$/, 'што$1'], [/^конечно$/, 'конешно'], [/^скучно$/, 'скушно'], [/тся$|ться$/, 'ца'],
  [/стн/g, 'сн'], [/здн/g, 'зн'], [/вств/g, 'ств'], [/лнц/g, 'нц'], [/[сз]ч/g, 'щ'], [/[сз]щ/g, 'щ'], [/жч/g, 'щ']];
const RU_GO_KEEP = new Set(['много', 'дорого', 'строго', 'немного', 'убого', 'отлого']);
const RU_CONS = { б: 'b', в: 'v', г: 'ɡ', д: 'd', ж: 'ʐ', з: 'z', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', п: 'p', р: 'r',
  с: 's', т: 't', ф: 'f', х: 'x', ц: 'ts', ч: 'tɕ', ш: 'ʂ', щ: 'ɕ' };
const RU_IOT = { я: 'a', е: 'e', ё: 'o', ю: 'u' }, RU_V = { а: 'a', о: 'o', у: 'u', э: 'ɛ', ы: 'ɨ', и: 'i' };
// stressed vowel (1-based, counting vowel letters) for common words; ё and a typed acute (U+0301) also mark stress
const RU_STRESS = { привет: 2, спасибо: 2, пожалуйста: 2, хорошо: 3, здравствуйте: 1, меня: 2, зовут: 2, дела: 2,
  молоко: 3, вода: 2, кофе: 1, говорить: 3, давай: 2, вместе: 1, английски: 2, по: 1, русский: 1, язык: 2, сегодня: 2,
  завтра: 1, очень: 1, нормально: 2, можно: 1, сколько: 1, стоит: 1, извините: 3, город: 1, работа: 2, школа: 1,
  учитель: 2, домби: 1, понимаю: 3, говорю: 3, слово: 1, правильно: 1, отлично: 2, молодец: 3, ещё: 2, тебя: 2 };
export function g2pRu(word) {
  let w = word.toLowerCase();
  const accent = w.indexOf('́');
  let stressVowel = -1;
  if (accent > 0) { stressVowel = [...w.slice(0, accent)].filter(c => 'аеёиоуыэюя'.includes(c)).length; w = w.replace(/́/g, ''); }
  else if (w.includes('ё')) stressVowel = [...w.slice(0, w.indexOf('ё') + 1)].filter(c => 'аеёиоуыэюя'.includes(c)).length;
  else if (RU_STRESS[w]) stressVowel = RU_STRESS[w];
  for (const [re, rep] of RU_EXC) w = w.replace(re, rep);
  if (/(о|е)го$/.test(w) && !RU_GO_KEEP.has(w)) w = w.replace(/(о|е)го$/, '$1во');
  const vowelCount = [...w].filter(c => 'аеёиоуыэюя'.includes(c)).length;
  if (stressVowel < 0 && vowelCount === 1) stressVowel = 1;
  const out = []; let soft = true, vowelNo = 0, prev = '';
  for (const c of w) {
    if (c === 'ъ' || c === 'ь') { soft = true; prev = c; continue; }
    if (RU_IOT[c] || RU_V[c]) {
      vowelNo++;
      const stressed = vowelNo === stressVowel, known = stressVowel > 0;
      let ph;
      if (RU_IOT[c]) { if (soft) out.push({ ph: 'j' }); ph = RU_IOT[c]; if (!soft && !stressed && (ph === 'a' || ph === 'e')) ph = 'ɪ'; }
      else if (c === 'и') { if (prev === 'ь') out.push({ ph: 'j' }); ph = 'жшц'.includes(prev) ? 'ɨ' : 'i'; }
      else ph = RU_V[c];
      if (!stressed && ph === 'o') ph = vowelNo === vowelCount ? 'ə' : 'ɐ';      // akanye
      out.push({ ph, stress: stressed ? 1 : 0, reduced: known && !stressed });
      soft = true;
    } else if (RU_CONS[c]) { out.push({ ph: RU_CONS[c] }); soft = false; }
    prev = c;
  }
  return out;
}

// ---------- English (CMUdict + small fallback) ----------
const ARPA = { AA: ['ɑ'], AE: ['æ'], AH: ['ʌ'], AO: ['ɔ'], AW: ['a', 'ʊ'], AY: ['a', 'i'], EH: ['ɛ'], ER: ['ɝ'], EY: ['e', 'i'],
  IH: ['ɪ'], IY: ['i'], OW: ['o', 'ʊ'], OY: ['ɔ', 'i'], UH: ['ʊ'], UW: ['u'],
  B: ['b'], P: ['p'], M: ['m'], F: ['f'], V: ['v'], W: ['w'], TH: ['θ'], DH: ['ð'], T: ['t'], D: ['d'], N: ['n'], S: ['s'],
  Z: ['z'], K: ['k'], G: ['ɡ'], NG: ['ŋ'], L: ['l'], R: ['ɹ'], SH: ['ʃ'], ZH: ['ʒ'], CH: ['tʃ'], JH: ['dʒ'], Y: ['j'], HH: ['h'] };
const EN_FALLBACK = [['tion', ['ʃ', 'ə', 'n']], ['th', ['θ']], ['sh', ['ʃ']], ['ch', ['tʃ']], ['ph', ['f']], ['wh', ['w']], ['ck', ['k']],
  ['ng', ['ŋ']], ['qu', ['k', 'w']], ['oo', ['u']], ['ee', ['i']], ['ea', ['i']], ['ou', ['a', 'ʊ']], ['ow', ['o', 'ʊ']], ['ai', ['e', 'i']],
  ['ay', ['e', 'i']], ['oi', ['ɔ', 'i']], ['oy', ['ɔ', 'i']], ['a', ['æ']], ['e', ['ɛ']], ['i', ['ɪ']], ['o', ['ɒ']], ['u', ['ʌ']],
  ['y', ['i']], ['b', ['b']], ['c', ['k']], ['d', ['d']], ['f', ['f']], ['g', ['ɡ']], ['h', ['h']], ['j', ['dʒ']], ['k', ['k']],
  ['l', ['l']], ['m', ['m']], ['n', ['n']], ['p', ['p']], ['r', ['ɹ']], ['s', ['s']], ['t', ['t']], ['v', ['v']], ['w', ['w']],
  ['x', ['k', 's']], ['z', ['z']]];
export function g2pEn(word, dict) {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  let arpa = dict && (dict[w] || dict[w.replace(/'s$/, '')] || dict[w.replace(/s$/, '')]);
  if (arpa) {
    const out = [];
    for (const tok of arpa.split(' ')) {
      const base = tok.replace(/\d/, ''), st = tok.match(/\d/)?.[0];
      const phs = ARPA[base] || [];
      phs.forEach((ph, k) => out.push({ ph: base === 'AH' && st === '0' ? 'ə' : ph, stress: st === '1' ? 1 : 0, diph: phs.length > 1 ? k : undefined }));
    }
    return out;
  }
  const out = []; let s = w.replace(/e$/, '').replace(/'/g, '');           // silent final e
  for (let i = 0; i < s.length;) {
    const hit = EN_FALLBACK.find(([g]) => s.startsWith(g, i));
    if (hit) { hit[1].forEach((ph, k) => out.push({ ph, diph: hit[1].length > 1 && VOWELS.has(hit[1][1]) ? k : undefined })); i += hit[0].length; } else i++;
  }
  const v = out.find(p => VOWELS.has(p.ph)); if (v) v.stress = 1;
  return out;
}

// ---------- text -> timed viseme track ----------
export function tokenize(text) {
  const words = []; const re = /[\p{L}\p{M}'ʻ‘’`ʼ́-]+|[.,!?;:…]+/gu; let m;
  while ((m = re.exec(text))) {
    if (/^[.,!?;:…]+$/.test(m[0])) { if (words.length) words[words.length - 1].punct += m[0]; continue; }
    words.push({ text: m[0], char: m.index, punct: '' });
  }
  return words;
}
function durOf(p) {
  if (VOWELS.has(p.ph)) {
    let d = p.reduced ? BASE.vowelReduced : p.stress ? BASE.vowelStressed : BASE.vowelUnstressed;
    if (p.short) d *= 0.6; if (p.ph === 'ə') d = Math.min(d, 80);
    if (p.diph !== undefined) d = 220 * (p.diph === 0 ? 0.6 : 0.4);
    return d;
  }
  return BASE[CLASS[p.ph]] ?? 70;
}
const OPEN_ORDER = [6, 5, 7, 11, 10, 4, 9, 8, 3, 2, 1, 0];                         // most open first
const KEEP = new Set([1, 2, 8]);                                               // never dropped (lip-readable)
export const MIN_SEG = 70;                                                     // ms, visual floor per mouth shape
const CLUSTER_PRIORITY = [1, 2, 8, 9, 10, 3, 4, 5];                            // th keeps its shape in clusters                                // most visible consonant wins

export function buildTrack(text, lang, { rate = 1, dict } = {}) {
  const g2p = { uz: g2pUz, ru: g2pRu, en: (w) => g2pEn(w, dict) }[lang];
  const words = tokenize(text), segs = [], mult = (LANG_MULT[lang] || 1) / rate;
  let t = 0;
  words.forEach((w, wi) => {
    w.start = t; w.phones = g2p(w.text.replace(/-/g, ''));
    w.phones.forEach((p, i) => {
      if (p.ph === 'ʔ') { segs.push({ v: 0, start: t, dur: BASE.stop * mult, ph: 'ʔ', wi }); t += BASE.stop * mult; return; }
      let v = PH2V[p.ph];
      if (p.ph === 'h') {                                                       // h takes the next vowel's shape
        const nv = w.phones.slice(i + 1).find(q => VOWELS.has(q.ph)); v = nv ? PH2V[nv.ph] : 3;
      }
      if (lang === 'uz' && p.ph === 'oʻ') v = 8;
      if (v === undefined) return;
      const d = durOf(p) * mult;
      segs.push({ v, start: t, dur: d, ph: p.ph, wi, vowel: VOWELS.has(p.ph), stress: p.stress });
      t += d;
    });
    w.end = t;
    if (/[,;:]/.test(w.punct)) { segs.push({ v: 0, start: t, dur: BASE.comma * mult, ph: ',', wi }); t += BASE.comma * mult; }
    else if (/[.!?…]/.test(w.punct)) { segs.push({ v: 0, start: t, dur: BASE.sentence * mult, ph: '.', wi }); t += BASE.sentence * mult; }
  });
  return { words, segs: smooth(segs), total: t };
}

function smooth(segs) {
  let s = segs.map(x => ({ ...x }));
  // 1. consonant clusters: keep the most visible member, span the whole cluster
  const out = [];
  for (let i = 0; i < s.length;) {
    if (!s[i].vowel && s[i].v !== 0) {
      let j = i; while (j < s.length && !s[j].vowel && s[j].v !== 0 && s[j].wi === s[i].wi) j++;
      const run = s.slice(i, j);
      const best = CLUSTER_PRIORITY.find(v => run.some(r => r.v === v)) ?? run[0].v;
      // rounding spreads backwards: a plain consonant before a round vowel becomes SH_R-ish
      const next = s[j]; let v = best;
      if (v === 3 && next && next.vowel && (next.v === 8 || next.v === 7)) v = 9;
      out.push({ ...run[0], v, dur: run.reduce((a, r) => a + r.dur, 0), ph: run.map(r => r.ph).join('') });
      i = j;
    } else out.push(s[i++]);
  }
  s = out;
  // 2. collapse repeats
  s = s.reduce((a, x) => { const p = a[a.length - 1]; if (p && p.v === x.v) { p.dur += x.dur; p.ph += x.ph; } else a.push({ ...x }); return a; }, []);
  // 3. MBP at least 70 ms (borrow from the next segment)
  s.forEach((x, i) => { if (x.v === 1 && x.dur < 70 && s[i + 1]) { const need = Math.min(70 - x.dur, s[i + 1].dur * 0.5); x.dur += need; s[i + 1].dur -= need; } });
  // 4. merge anything shorter than MIN_SEG into the more open neighbour (lip shapes 1,2,8 are kept):
  //    below ~70 ms a shape never settles and the mouth looks like it flickers (2 frames at 30 fps is the animator floor)
  for (let pass = 0; pass < 3; pass++) {
    const r = [];
    s.forEach((x, i) => {
      if (x.dur >= MIN_SEG || KEEP.has(x.v) || x.v === 0) { r.push(x); return; }
      const p = r[r.length - 1], n = s[i + 1];
      const into = !p ? n : !n ? p : OPEN_ORDER.indexOf(p.v) <= OPEN_ORDER.indexOf(n.v) ? p : n;
      if (into) into.dur += x.dur; else r.push(x);
    });
    s = r;
  }
  // re-time sequentially
  let t = 0; for (const x of s) { x.start = t; t += x.dur; }
  return s;
}

export function visemeAt(track, ms) {   // binary search
  const s = track.segs; let lo = 0, hi = s.length - 1;
  if (!s.length || ms < 0) return 0;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (s[mid].start <= ms) lo = mid; else hi = mid - 1; }
  return ms > s[s.length - 1].start + s[s.length - 1].dur ? 0 : s[lo].v;
}
