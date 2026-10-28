// Dombi on the stage: the Rive rig from the lab (view model `Dombi`), moods only in this version (no mouth sync).
// mountDombi(box, size) -> { mood(name), listening(bool), talking(bool), amp(n), dark(bool) }
const MOODS = new Set(['smirk', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'wink', 'proud', 'focus', 'confused', 'oops']);

export async function mountDombi(box, size) {
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(size * 1.32 * 2), height: Math.round(size * 1.32 * 2) });
  dombiInto(canvas, box, size);                                                  // from the lab (design/motion/lab.js)
  const vm = await M.rive(canvas, 'Dombi', 'Dombi');
  const set = (kind, name, v) => { try { vm[kind](name).value = v; } catch (e) { console.warn('dombi', name, e.message); } };
  let current = 'smirk';
  return {
    mood(name) { const m = MOODS.has(name) ? name : 'smirk'; if (m === current) return; current = m; set('enum', 'mood', m); },
    current: () => current,
    listening(on) { set('boolean', 'listening', !!on); },
    talking(on) { set('boolean', 'talking', !!on); },
    amp(n) { set('number', 'amp', Math.max(0, Math.min(100, n | 0))); },
    viseme(n) { set('number', 'viseme', n | 0); },                                // 0 = closed; the talking engine's mouth shapes 1–11
    dark(on) { set('boolean', 'dark', !!on); },
    gesture(g) { set('enum', 'gesture', g); },
  };
}
