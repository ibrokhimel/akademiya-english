// Taps in the hand (haptics) for the lab: every tap rides on a sound's beat, so the hand and the ear get the same instant.
// Plan: docs/ideas/sound-plan.md §6 ("Tap in the hand" and "Taps for the big sounds"). Loaded after sound.js.
// Rules: none while the mic listens · a tap lands on its sound's loud moment · taps have their own switch (they still come with the sound off).
//   HAP.play(kind, name)        one tap now. kind: 'selection' | 'soft' | 'light' | 'medium' | 'success' | 'heavy'. name = what it is for (the log only)
//   HAP.at(kind, ms, name)      one tap ms from now, in motion time (Slow motion stretches it); dropped if the screen's sounds are cut first
//   HAP.TAP                     sound name -> kind: the tap that goes with each sound (a sound that is not listed has none)
//   HAP.KIND                    what each kind is in the app (the Expo call) and in a phone's browser
//   HAP.log                     [{ kind, name, t }] every tap that was given, for the checks (like SND.log)
//   HAP.on                      the "Taps" switch in the tool bar (remembered)
// On a PC nothing can be felt, so the Taps switch shows each tap: a dot that is bigger for a stronger tap, and the kind's name.
// In a phone's browser: Android vibrates (navigator.vibrate). An iPhone has no vibrate; flipping a hidden switch control gives one system
// tick on iOS 17.4 and later, always the same strength. NOT tried on a real iPhone: nobody here has one in the hand.
const HAP = (() => {
  // expo: the call the app makes · android: navigator.vibrate pattern in ms · ios: ticks in an iPhone browser · rank: which one wins when two fall together · dot: its size on the PC, in px
  const KIND = {
    selection: { expo: 'Haptics.selectionAsync()', android: 8, ios: 1, rank: 1, dot: 6 },
    soft: { expo: 'Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)', android: 10, ios: 1, rank: 2, dot: 8 },
    light: { expo: 'Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)', android: 12, ios: 1, rank: 3, dot: 10 },
    medium: { expo: 'Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)', android: 20, ios: 1, rank: 4, dot: 13 },
    success: { expo: 'Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)', android: [12, 70, 22], ios: 2, rank: 5, dot: 13 },   // two taps, the second stronger
    heavy: { expo: 'Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)', android: 35, ios: 1, rank: 6, dot: 17 },
  };
  // The tap of each sound, by the name SND.play is called with. A mistake is one soft tap: never the "error" pattern, it is not a punishment.
  const TAP = {
    // small moments
    button: 'light', pick: 'selection', tile: 'light', count: 'selection', tick: 'selection', tab: 'selection', seg: 'selection',
    'switch-on': 'light', 'switch-off': 'light', star: 'light', sent: 'light', friend: 'success', unlock: 'medium', turn: 'light', nothing: 'soft',
    // big sounds. Perfect lesson also has a heavy tap on the badge's slam, given by the page (screens.js): no sound starts there
    right: 'success', 'not-right': 'soft', combo: 'medium', 'mic-on': 'light', 'mic-off': 'light', 'new-phrase': 'success', 'lesson-done': 'success', perfect: 'success',
    trophy: 'heavy', 'level-up': 'heavy', award: 'medium', streak: 'medium', freeze: 'soft',
    // no tap, by the plan: appear, roll, whoosh (sheet up), close, pop, next, back, unfold (calendar), step, mistakes. Not in the plan: reminder
  };
  const GAP = 25, log = [], pending = new Set();                                              // two taps closer than GAP ms are one tap to the hand: the stronger one counts
  let on = true, lastAt = -1e9, lastRank = 0, mark = null;
  try { on = localStorage.getItem('lab-taps') !== 'off'; } catch (e) {}

  // ---- the phone's browser ----
  const touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const iphone = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const active = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;   // a browser only vibrates after the first tap on the page
  const tick = () => { const l = document.createElement('label'), i = document.createElement('input'); l.setAttribute('aria-hidden', 'true'); l.style.display = 'none';
    i.type = 'checkbox'; i.setAttribute('switch', ''); l.appendChild(i); document.head.appendChild(l); l.click(); l.remove(); };   // the hidden switch flips, iOS ticks
  function feel(k) {
    try {
      if (touch && navigator.vibrate) { if (active()) navigator.vibrate(k.android); }
      else if (iphone) { tick(); for (let n = 1; n < k.ios; n++) setTimeout(tick, 90 * n); }
    } catch (e) {}
  }
  // ---- the PC: a dot in the Taps switch ----
  function show(kind) {
    if (!mark) return; const k = KIND[kind], [dot, txt] = mark; txt.textContent = kind; dot.style.width = dot.style.height = k.dot + 'px';
    const pulse = () => dot.animate([{ opacity: 1, scale: '1.4' }, { opacity: 1, scale: '1', offset: 0.35 }, { opacity: 0.18, scale: '1' }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
    pulse(); if (k.ios > 1) setTimeout(pulse, 90);                                            // success: two beats
    txt.getAnimations().forEach((a) => a.cancel()); txt.animate([{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0.3 }], { duration: 1100, fill: 'forwards' });
  }

  function play(kind, name = '') {
    const k = KIND[kind]; if (!k || !on || (window.SND && SND.listening)) return;             // nothing while the mic listens: a tap would shake the recording
    const now = performance.now();
    if (now - lastAt < GAP) { if (k.rank <= lastRank) return; Object.assign(log[log.length - 1], { kind, name }); }   // they fall together: the stronger one takes the other's place
    else { log.push({ kind, name, t: Math.round(now) }); lastAt = now; }
    lastRank = k.rank; feel(k); show(kind);
  }
  const later = (kind, ms, name) => { if (ms <= 0) return play(kind, name); const t = setTimeout(() => { pending.delete(t); play(kind, name); }, ms); pending.add(t); };   // ms of real time
  const at = (kind, ms, name) => later(kind, ms * M.slow, name);

  // ---- the sounds' beats: sound.js says when a sound's moment comes and how long until it is at its loudest ----
  SND.taps = { start(name, lead) { if (TAP[name]) later(TAP[name], lead, name); },
    cut() { pending.forEach(clearTimeout); pending.clear(); } };                              // the screen was left: the taps still waiting go with its sounds

  // ---- the switch in the tool bar, next to Sound ----
  addEventListener('DOMContentLoaded', () => { const tools = document.querySelector('.tools'); if (!tools) return;
    const b = Object.assign(document.createElement('button'), { className: 'tool', id: 'tTaps' }); b.setAttribute('aria-pressed', on); b.style.cssText = 'display:flex;align-items:center;gap:8px';
    b.innerHTML = 'Taps <span id="tapMark" style="display:inline-flex;align-items:center;gap:6px;width:104px;height:17px;pointer-events:none">' +
      '<span style="width:26px;display:inline-flex;justify-content:center;flex:none"><i style="display:block;width:6px;height:6px;border-radius:50%;background:var(--violet);opacity:.18"></i></span><b style="font-weight:800;opacity:.3"></b></span>';
    const m = b.querySelector('#tapMark'); mark = [m.querySelector('i'), m.querySelector('b')];
    b.onclick = () => { on = !on; b.setAttribute('aria-pressed', on); try { localStorage.setItem('lab-taps', on ? 'on' : 'off'); } catch (e) {} if (on) play('light', 'switch'); };
    const s = document.querySelector('#tSound'); if (s) s.after(b); else tools.append(b); });

  return { play, at, TAP, KIND, log, get on() { return on; } };
})();
window.HAP = HAP;
