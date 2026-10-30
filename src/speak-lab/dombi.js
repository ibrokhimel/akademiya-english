// Dombi on the stage: the Rive rig from the lab (view model `Dombi`).
// mountDombi(box, size) -> { mood(name), listening(bool), talking(bool), amp(n), viseme(n), dark(bool), gesture(g),
//                            fire(rig, ms), hold(rig, holdable) -> handle, release(handle), talkingOff(ms), beat(), trigger(name), play(value),
//                            directed(bool), reset() }
const MOODS = new Set(['smirk', 'happy', 'laugh', 'talk', 'listen', 'think', 'surprised', 'sleepy', 'wink', 'proud', 'focus', 'confused', 'oops',
  'sideEye', 'deadpan', 'grin', 'suspicious', 'cringe', 'disgusted', 'shocked', 'awkward', 'cryLaugh', 'bored',
  'hmph', 'squint', 'innocent', 'excited', 'speechless', 'nervousGrin', 'content', 'thinkingHard',
  'angry', 'smugFace', 'worried', 'woozy', 'tired', 'delighted', 'judging', 'flirty', 'cocky', 'scared', 'puzzled', 'hungry', 'dreamy', 'serious', 'evilLaugh']);   // batch 5 + 6 faces   // round 2 faces (2026-10-30)

export async function mountDombi(box, size) {
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(size * 1.32 * 2), height: Math.round(size * 1.32 * 2) });
  dombiInto(canvas, box, size);                                                  // from the lab (design/motion/lab.js)
  const vm = await M.rive(canvas, 'Dombi', 'Dombi');
  const set = (kind, name, v) => { try { vm[kind](name).value = v; } catch (e) { console.warn('dombi', name, e.message); } };
  let current = 'smirk', faceHeld = 0;                                           // faceHeld: an acted face is showing until then
  let holdToken = 0, moveHold = 0, faceHold = 0, talkingOn = false; const playHold = {};
  const timers = new Set(), later = (ms, fn) => { const h = setTimeout(() => { timers.delete(h); fn(); }, ms); timers.add(h); };
  const api = {
    // the face his words ask for; while an acted face is held it is remembered and shown after
    mood(name) { const m = MOODS.has(name) ? name : 'smirk'; if (m === current) return; current = m; if (Date.now() >= faceHeld) set('enum', 'mood', m); },
    current: () => current,
    listening(on) { set('boolean', 'listening', !!on); },
    talking(on) { talkingOn = !!on; set('boolean', 'talking', !!on); },
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
    // a held beat (spec 2026-10-30 in-sync §4.5): a holdable move fires with the view model's `hold` on, so Rive loops its
    // middle until release() turns it off and it plays its end; a move that cannot hold just plays once; a face, play or
    // gesture stays until release(). A handle released after a newer hold took its place does nothing.
    hold(rig, holdable = false) {
      const h = { rig, token: ++holdToken };
      if (rig.trigger) { if (holdable) { set('boolean', 'hold', true); moveHold = h.token; } api.trigger(rig.trigger); return h; }
      if (rig.enum === 'mood') { faceHeld = Infinity; faceHold = h.token; set('enum', 'mood', rig.value); return h; }
      set('enum', rig.enum, rig.value); playHold[rig.enum] = h.token; return h;
    },
    release(h) {
      if (!h) return; const { rig, token } = h;
      if (rig.trigger) { if (moveHold === token) { moveHold = 0; set('boolean', 'hold', false); } return; }
      if (rig.enum === 'mood') { if (faceHold === token) { faceHold = 0; faceHeld = 0; set('enum', 'mood', current); } return; }
      if (playHold[rig.enum] === token) { playHold[rig.enum] = 0; set('enum', rig.enum, 'none'); }
    },
    // small talking motion: Rive picks a nod, a tilt or a bob
    beat() { api.trigger('beat'); },
    // a mouth action plays while his voice is quiet: the lip-sync layer lets go of the mouth for that long
    talkingOff(ms) { set('boolean', 'talking', false); later(ms, () => { if (talkingOn) set('boolean', 'talking', true); }); },
    // the talk is over: nothing held comes back later
    reset() { for (const h of timers) clearTimeout(h); timers.clear(); faceHeld = 0; faceHold = moveHold = 0; set('boolean', 'hold', false); set('enum', 'play', 'none'); set('enum', 'gesture', 'none'); },
  };
  return api;
}
