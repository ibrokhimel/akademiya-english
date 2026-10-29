// Dombi on the stage: the Rive rig from the lab (view model `Dombi`).
// mountDombi(box, size) -> { mood(name), listening(bool), talking(bool), amp(n), viseme(n), dark(bool), gesture(g),
//                            fire(rig, ms), trigger(name), play(value), directed(bool), reset() }
const MOODS = new Set(['smirk', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'wink', 'proud', 'focus', 'confused', 'oops',
  'sideEye', 'deadpan', 'grin', 'suspicious', 'cringe', 'disgusted', 'shocked', 'awkward', 'cryLaugh', 'bored',
  'hmph', 'squint', 'innocent', 'excited', 'speechless', 'nervousGrin', 'content', 'thinkingHard']);   // batch 5 faces   // round 2 faces (2026-10-30)

export async function mountDombi(box, size) {
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(size * 1.32 * 2), height: Math.round(size * 1.32 * 2) });
  dombiInto(canvas, box, size);                                                  // from the lab (design/motion/lab.js)
  const vm = await M.rive(canvas, 'Dombi', 'Dombi');
  const set = (kind, name, v) => { try { vm[kind](name).value = v; } catch (e) { console.warn('dombi', name, e.message); } };
  let current = 'smirk', faceHeld = 0;                                           // faceHeld: an acted face is showing until then
  const timers = new Set(), later = (ms, fn) => { const h = setTimeout(() => { timers.delete(h); fn(); }, ms); timers.add(h); };
  const api = {
    // the face his words ask for; while an acted face is held it is remembered and shown after
    mood(name) { const m = MOODS.has(name) ? name : 'smirk'; if (m === current) return; current = m; if (Date.now() >= faceHeld) set('enum', 'mood', m); },
    current: () => current,
    listening(on) { set('boolean', 'listening', !!on); },
    talking(on) { set('boolean', 'talking', !!on); },
    amp(n) { set('number', 'amp', Math.max(0, Math.min(100, n | 0))); },
    viseme(n) { set('number', 'viseme', n | 0); },                                // 0 = closed; the talking engine's mouth shapes 1–11
    dark(on) { set('boolean', 'dark', !!on); },
    gesture(g) { set('enum', 'gesture', g); },
    trigger(name) { try { vm.trigger(name).trigger(); } catch (e) { console.warn('dombi', name, e.message); } },
    play(value) { set('enum', 'play', value); },
    directed(on) { set('boolean', 'directed', !!on); },                           // the page owns his idle breaks while true
    // one catalog action: a trigger fires; play / gesture are held for ms then back to none; a mood is held for ms then his words' mood again
    fire(rig, ms) {
      if (rig.trigger) return api.trigger(rig.trigger);
      if (rig.enum === 'mood') { faceHeld = Date.now() + ms; set('enum', 'mood', rig.value); later(ms, () => { if (Date.now() >= faceHeld) set('enum', 'mood', current); }); return; }
      set('enum', rig.enum, rig.value); later(ms, () => set('enum', rig.enum, 'none'));
    },
    // the talk is over: nothing held comes back later
    reset() { for (const h of timers) clearTimeout(h); timers.clear(); faceHeld = 0; set('enum', 'play', 'none'); set('enum', 'gesture', 'none'); },
  };
  return api;
}
