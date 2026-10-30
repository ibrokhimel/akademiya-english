// Words and answers: the rules for what counts as the right thing said, built or picked.
// No screen in here: the browser version and the phone app both use this file as it is. Tests: node --test src/core/core.test.js

// ---- the lesson files' own rules (the same ones src/content/check.js checks) ----
export const slug = (text) => text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const answerOf = (item, P) => item.p ? P[item.p].en : item.en || item.line || item.right;
export const voiceOf = (item, P) => item.voice || (item.p && P[item.p].voice) || (Object.values(P).find((p) => p.en === answerOf(item, P)) || {}).voice || 'malika';
export const clipOf = (voice, text) => `${voice}/${slug(text)}`;

// A sentence as tiles: no punctuation, and no capital on the first word unless it always has one ("I", "I'm", a name).
const KEEP = /^(I|I'm|I'd|I'll|Aziz|Malika|Tashkent|Uzbekistan|T-shirt)$/;
export const tilesOf = (text) => text.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean).map((w, i) => (i === 0 && !KEEP.test(w) ? w.toLowerCase() : w));
export const sameTiles = (built, text) => { const want = tilesOf(text); return built.length === want.length && built.every((w, i) => w.toLowerCase() === want[i].toLowerCase()); };

// ---- what was said ----
const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
// 45000 -> "forty five thousand" (a phone often writes a spoken number in digits)
export function numberWords(n) {
  if (n < 20) return SMALL[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + SMALL[n % 10] : '');
  if (n < 1000) return SMALL[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberWords(n % 100) : '');
  return numberWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numberWords(n % 1000) : '');
}
const SAME = { "i'm": 'i am', "it's": 'it is', "what's": 'what is', "that's": 'that is', "i'd": 'i would', "i'll": 'i will', "don't": 'do not', okay: 'ok', tshirt: 't shirt', tee: 't' };
// Text as plain words: small letters, no marks, short forms opened up, digits as words. Both sides of a comparison go through this.
export function plain(text) {
  let t = text.toLowerCase().replace(/[’`]/g, "'")
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    // A recognizer can group a price with spaces. Unrelated spoken numbers
    // ("90 100") must stay separate rather than becoming "90,100".
    .replace(/\b\d{1,3}(?:[ \u00a0]\d{3})+(?=\s+(?:som|sum|soum|soom)\b)/g, value => value.replace(/[ \u00a0]/g, ''))
    .replace(/\d+/g, (d) => (d.length < 7 ? ' ' + numberWords(+d) + ' ' : d));
  t = t.replace(/-/g, ' ').replace(/[^a-z' ]/g, ' ');
  return t.split(/\s+/).filter(Boolean).flatMap((w) => (SAME[w] || w).split(' ')).map((w) => w.replace(/'/g, ''));
}
const NEAR = { a: ['uh', 'one'], som: ['sum', 'some', 'soum', 'soom', 'psalm'], one: ['won'], two: ['to', 'too'], four: ['for'], hi: ['hey', 'hai'] };   // what a recogniser writes for a word said right
const sameWord = (want, got) => want === got || (NEAR[want] || []).includes(got);

// Transcript matching, not a pronunciation score. Loose names/Uzbek words may
// occupy up to three recognizer tokens ("Aziz" -> "as is"). The rest of the
// utterance must match in full; finding the answer inside unrelated speech fails.
// words describes the EXPECTED sentence, never the learner's actual transcript.
export function judge(want, heard, loose = []) {
  const shown = want.split(/\s+/).filter(Boolean), free = new Set(loose.flatMap((w) => plain(w)));
  const parts = shown.map((w) => plain(w)), W = parts.flat(), H = plain(heard || '');
  // the longest run of the wanted words that was heard in order; a loose word matches anything, or nothing
  const n = W.length, m = H.length, best = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m; j >= 0; j--) {
    const isFree = free.has(W[i]); let v = best[i + 1][j] + (isFree ? 1 : 0);
    if (j < m) { v = Math.max(v, best[i][j + 1]); if (isFree || sameWord(W[i], H[j])) v = Math.max(v, best[i + 1][j + 1] + 1); }
    best[i][j] = v;
  }
  const ok = new Array(n).fill(false); let i = 0, j = 0;
  while (i < n) {
    const isFree = free.has(W[i]);
    if (j < m && (isFree || sameWord(W[i], H[j])) && best[i][j] === best[i + 1][j + 1] + 1) { ok[i] = true; i++; j++; }
    else if (isFree && best[i][j] === best[i + 1][j] + 1) { ok[i] = true; i++; }
    else if (j < m && best[i][j] === best[i][j + 1]) j++;
    else i++;
  }
  let k = 0; const words = shown.map((text, s) => { const part = ok.slice(k, k + parts[s].length); k += parts[s].length; return { text, ok: part.every(Boolean) }; });
  const full = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
  full[n][m] = true;
  for (let a = n - 1; a >= 0; a--) for (let b = m; b >= 0; b--) {
    if (free.has(W[a])) {
      // Preserve the curriculum's name tolerance, only at this word's position.
      for (let size = 0; size <= 3 && b + size <= m; size++)
        full[a][b] ||= full[a + 1][b + size];
    } else if (b < m && sameWord(W[a], H[b])) full[a][b] = full[a + 1][b + 1];
  }
  return { right: n > 0 && m > 0 && full[0][0], words };
}
// The engine ranks hypotheses best first. Alternate accepted ANSWERS are valid;
// a lower-ranked transcription must not silently replace an unrelated top one.
export function judgeAny(wants, heards, loose = []) {
  let first = null;
  for (const want of wants) { const r = judge(want, heards[0] || '', loose); if (r.right) return { ...r, want }; if (!first) first = { ...r, want }; }
  return first || { right: false, want: wants[0], words: wants[0].split(/\s+/).map((text) => ({ text, ok: false })) };
}
