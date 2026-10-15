// The lesson files, the sound clips' times and the pictures: read once when the app opens.
const BASE = '/src/content/', get = (f) => fetch(BASE + f).then((r) => { if (!r.ok) throw new Error(f); return r.json(); });

export const C = { P: {}, traps: {}, units: [], lessons: [], cast: 'uk', casts: {}, clips: {} };
export async function loadContent() {
  const [ph, tr, casts, ...units] = await Promise.all([get('phrases.json'), get('traps.json'), get('audio/cast.json'), get('unit-1.json'), get('unit-2.json'), get('unit-3.json')]);
  C.P = Object.fromEntries(ph.phrases.map((p) => [p.id, p])); C.traps = Object.fromEntries(tr.traps.map((t) => [t.id, t])); C.units = units;
  C.lessons = units.flatMap((u) => [...u.lessons.map((l) => ({ ...l, unit: u })), { ...u.checkpoint, unit: u, checkpoint: true }]);
  let cast = casts.use; try { const c = localStorage.getItem('akademiya.voices'); if (casts.casts[c]) cast = c; } catch (e) {}
  C.cast = cast; C.casts = casts.casts; C.clips = (await get(`audio/${cast}/index.json`)).clips;
  return C;
}
export const clipUrl = (file, slow) => `${BASE}audio/${C.cast}/${file}${slow ? '.slow' : ''}.wav`;
// a picture name from the lesson files as HTML: a lesson picture, an icon, or plain text shown large (numbers, prices, sizes)
export const picHTML = (pic) => pic.startsWith('text:') ? `<span class="pictext">${pic.slice(5)}</span>`
  : `<img src="/pendev/icons-r2/${pic.startsWith('icon:') ? pic.slice(5) : 'lesson-' + pic}.png" alt="">`;
export const NAME = { aziz: 'Aziz', malika: 'Malika', waiter: 'Ofitsiant', seller: 'Sotuvchi' };
export const AFTER = { aziz: 'Azizdan keyin qaytaring', malika: 'Malikadan keyin qaytaring', waiter: 'Ofitsiantdan keyin qaytaring', seller: 'Sotuvchidan keyin qaytaring' };
