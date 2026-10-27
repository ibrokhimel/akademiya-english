// Dombi's touch play, ported from the playground (design/rive/play.html, locked 2026-10-11). No screens here.
// The app feeds finger events and frame ticks in; out come the rig effects (triggers, the `play` enum, mood, haptics)
// and his body (position, swing, squish) for the screen to draw.
//   touchStart(t) -> state     touchReducer(state, { type, t, x?, y?, dt?, rand?, cancel?, rule, env })
// types: 'down'|'move'|'up'|'tick' (finger and frames), 'look' (a finger anywhere on the screen), 'feed' (a word
// dropped on him), 'nudge' (the screen needs him awake), 'highfive' (a right answer), 'hand' (a tap on his raised hand), 'pinch' {d} / 'pinchEnd',
// 'phoneShake', 'tilt' {g: degrees}, 'mic' {level 0–100, dt} (only while held).
// rule: 'all' (tabs), 'nocarry' (no carrying) or 'perch' (a lesson: carried, dropped and thrown as on the tabs, but he
// stays where he lands; after 4 s untouched the effect `drop` hands him to the screen, which moves him to the nearest
// free spot; owner, 2026-10-27). env: { w, h, homeX, floorY, groundY?, eyeUp?, zones? } in screen points; groundY is
// where he lands (default floorY, his home); eyeUp is his eyes' height above his feet; zones: { peek?: { l, r, top }
// (the Learn card), warm?: { x, y } (the flame's left side and bottom) }.
// Effects: { fire } { play } { mood } { haptic } { drop } and { num: [name, value] } { looking } { hidden } { pop }.

const HOLD_MS = 300, TAP_MS = 300, TAP_PX = 12, HOLD_PX = 10, PET_PX = 12, DOUBLE_MS = 400, POKE_RESET_MS = 4000,
  BACK_MS = 3000, THROW = 900, SLEEP_MS = 22000, WAKE_MS = 950, SHAKE_SPEED = 380, SHAKE_HITS = 5, SHAKE_MS = 900,
  DIZZY_COOLDOWN = 2600, GRAVITY = 2600, BOUNCE_SPEED = 700, WALK = 95,
  RUB_MS = 1000, RUB_PATH = 40, RUB_SPOT = 24, AWAY_MS = 4000,
  EDGE_PX = 8, SWIPE_OFF = 2100, HIDE_MS = 700, PEEK_IN_MS = 500, PEEK_MS = 1900, PERCH_PLAY_MS = 420, WARM_DY = 20, WARM_SIT = 44,
  LOOK_MS = 2500, HF_DELAY = 1000, HF_MS = 2800, CLAP_MS = 520, SHOOK_MS = 450, BLOW_LOUD = 78, BLOW_QUIET = 45, BLOW_S = 0.25;
const TRICKS = ['trickSpin', 'trickFlick', 'trickShades'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function touchStart(t = 0) {
  return {
    mode: 'idle', press: null, pokes: 0, lastPoke: -1e9, lastTap: -1e9, lastTrick: -1, lastAct: t,
    shake: { hits: [], sign: 0, dizzyAt: -1e9 }, trail: [], at: {},
    perch: /** @type {string | null} */ (null), hf: 0, pinch: /** @type {{ d0: number } | null} */ (null), tilt: 0, tiltMoving: false, slid: false, shook: false,
    peek: { to: 0, t0: 0 }, mic: { level: 0, loud: 0, wind: false },
    body: { x: /** @type {number | null} */ (null), y: /** @type {number | null} */ (null), vx: 0, vy: 0, rot: 0, spin: 0, tx: 0, ty: 0, swing: 0, swingV: 0, squish: 0 },
  };
}

export function touchReducer(state, ev) {
  const s = { ...state, body: { ...state.body }, shake: { ...state.shake, hits: [...state.shake.hits] }, trail: [...state.trail], at: { ...state.at }, press: state.press && { ...state.press }, peek: { ...state.peek }, mic: { ...state.mic } };
  const fx = [], env = ev.env, t = ev.t, ground = env.groundY ?? env.floorY, zones = env.zones ?? {};
  if (s.body.x === null) { s.body.x = env.homeX; s.body.y = env.floorY; }
  const fire = (name) => fx.push({ fire: name }), play = (v) => fx.push({ play: v }), mood = (m) => fx.push({ mood: m }), buzz = (h) => fx.push({ haptic: h });
  const num = (name, v) => fx.push({ num: [name, v] }), rand = () => ev.rand ?? Math.random();
  // At rest he is either at home (idle) or sitting on a perch; `rest` plays the matching pose.
  const resting = () => s.mode === 'idle' || s.mode === 'perched';
  const rest = () => { s.mode = s.perch ? 'perched' : 'idle'; play(s.perch || 'none'); };

  const startCarry = () => {
    s.press.mode = 'carry'; s.mode = 'held'; s.perch = null; s.hf = 0; s.trail = []; s.body.tx = s.press.last.x; s.body.ty = s.press.last.y - 4; s.body.rot = 0; s.body.spin = 0;
    s.mic = { level: 0, loud: 0, wind: false };
    fire('hop'); play('held'); mood('smirk'); buzz(15);
  };
  const hide = () => { s.mode = 'hidden'; s.at.peek = t + HIDE_MS; fx.push({ hidden: true }); play('none'); };
  const release = () => {
    const b = s.body; b.swing = 0; b.squish = 0;
    if (s.mic.level > 0) num('amp', 0);
    s.mic = { level: 0, loud: 0, wind: false };
    let tr = s.trail.filter((q) => t - q.t < 130); if (tr.length < 2) tr = s.trail.slice(-3).filter((q) => t - q.t < 260);
    if (tr.length >= 2 && tr[tr.length - 1].t > tr[0].t) { const dts = (tr[tr.length - 1].t - tr[0].t) / 1000; b.vx = (tr[tr.length - 1].x - tr[0].x) / dts; b.vy = (tr[tr.length - 1].y - tr[0].y) / dts; }
    else { b.vx *= 0.4; b.vy *= 0.4; }
    b.vx = clamp(b.vx, -2600, 2600); b.vy = clamp(b.vy, -2600, 2600);
    play('none');
    // Let go at the screen's side edge: he is gone, and peeks back in a moment later (a finger never leaves the screen).
    if (ev.x !== undefined && (ev.x <= EDGE_PX || ev.x >= env.w - EDGE_PX)) return hide();
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > SWIPE_OFF && Math.abs(b.vx) > Math.abs(b.vy) * 1.6) { s.mode = 'exit'; return; }
    if (sp > THROW) { s.mode = 'flying'; b.spin = clamp(b.vx * 0.9, -900, 900); }
    else { s.mode = 'falling'; b.vx *= 0.3; }
  };
  const clap = () => { s.hf = 0; fire('clap'); fx.push({ pop: true }); buzz([15, 20, 25]); mood('happy'); s.at.clapped = t + CLAP_MS; s.lastAct = t; };
  const tap = () => {
    if (s.hf) return clap();   // his hand is up: a tap on him is the high-five
    if (s.mode === 'asleep') { fire('wake'); buzz(10); s.mode = 'waking'; s.at.wake = t + WAKE_MS; return; }
    if (['back', 'waking', 'hidden', 'peeking', 'exit'].includes(s.mode)) return;
    if (t - s.lastTap < DOUBLE_MS) {
      s.lastTap = -1e9; s.pokes = Math.max(0, s.pokes - 1);
      const options = [0, 1, 2].filter((i) => i !== s.lastTrick), i = options[Math.floor(rand() * options.length)];
      s.lastTrick = i; if (TRICKS[i] === 'trickFlick') { mood('wink'); s.at.unwink = t + 800; }
      fire(TRICKS[i]); buzz(12); return;
    }
    s.lastTap = t;
    if (t - s.lastPoke > POKE_RESET_MS) s.pokes = 0;
    s.lastPoke = t; s.pokes++; buzz(8);
    if (s.pokes <= 3) { fire('poke' + s.pokes); if (s.pokes === 3) buzz([10, 40, 10]); }
    else { s.pokes = 0; s.mode = 'back'; s.at.back = t + BACK_MS; play('back'); }
  };
  const walkHome = () => {
    if (Math.abs(s.body.x - env.homeX) < 6) { s.mode = 'idle'; s.body.x = env.homeX; play('none'); s.lastAct = t; }
    else { s.mode = 'walking'; play('walk'); }
  };
  // Where a drop lands: beside the flame (warm), on top of the Learn card (peek), else the floor.
  const zoneAt = () => {
    const b = s.body, w = zones.warm, c = zones.peek;
    // The flame sits just above the Learn card on the phone, so its band is narrow (Redmi test: ±60 took the card's middle).
    if (w && b.x > w.x - 80 && b.x < w.x + 12 && Math.abs(b.y - w.y) <= WARM_DY) return { kind: 'warm', y: w.y, x: w.x - WARM_SIT };
    if (c && b.x > c.l + 20 && b.x < c.r - 20 && b.y <= c.top + 30) return { kind: 'peek', y: c.top + 4 };
    return { kind: 'floor', y: ground };
  };
  const landed = (zone, hard) => {
    const b = s.body; b.vy = 0; b.vx = 0; b.rot = 0; b.spin = 0; b.y = zone.y;
    fire('land'); buzz(hard ? [20, 30, 10] : 18);
    if (s.shook) { s.shook = false; s.at.shook = t + SHOOK_MS; }
    if (zone.kind !== 'floor') {
      s.mode = 'perched'; s.perch = zone.kind; s.lastAct = t; s.at.perchPlay = t + PERCH_PLAY_MS;
      if (zone.kind === 'warm') { b.x = zone.x; mood('happy'); }
      return;
    }
    s.mode = 'recover'; s.at.recover = t + (hard ? 1500 : 700); if (hard) s.at.smug = t + 520;
  };

  if (ev.type === 'down') {
    s.lastAct = t;
    s.press = { t, start: { x: ev.x, y: ev.y }, last: { x: ev.x, y: ev.y }, moved: 0, mode: 'press', holdChecked: false };
  } else if (ev.type === 'move' && s.press) {
    const p = { x: ev.x, y: ev.y };
    s.press.moved += Math.hypot(p.x - s.press.last.x, p.y - s.press.last.y); s.press.last = p; s.lastAct = t;
    if (s.press.mode === 'press' && s.press.moved > PET_PX && t - s.press.t < HOLD_MS && s.mode !== 'asleep') { s.press.mode = 'pet'; play('pet'); buzz(5); }
    // A rub that started too slowly to count as petting picked him up; rubbing on the spot turns it back into petting
    // (Redmi test, 2026-10-27: a real finger often moves less than 12 px in the first 300 ms).
    if (s.press.mode === 'carry' && t - s.press.t < RUB_MS && s.press.moved > RUB_PATH && Math.hypot(p.x - s.press.start.x, p.y - s.press.start.y) < RUB_SPOT) {
      s.press.mode = 'pet'; s.mode = 'idle'; s.trail = [];
      Object.assign(s.body, { x: env.homeX, y: env.floorY, vx: 0, vy: 0, swing: 0, swingV: 0, squish: 0 });
      play('pet'); buzz(5);
    }
    if (s.press.mode === 'carry') {
      const prev = s.trail[s.trail.length - 1];
      s.body.tx = p.x; s.body.ty = p.y - 4; s.trail.push({ x: p.x, y: p.y, t }); if (s.trail.length > 16) s.trail.shift();
      if (prev && t > prev.t) {
        const fvx = (p.x - prev.x) / ((t - prev.t) / 1000), sign = Math.abs(fvx) > SHAKE_SPEED ? Math.sign(fvx) : 0;
        if (sign && sign !== s.shake.sign) {
          s.shake.sign = sign; s.shake.hits = [...s.shake.hits.filter((h) => t - h < SHAKE_MS), t];
          if (s.shake.hits.length >= SHAKE_HITS && t - s.shake.dizzyAt > DIZZY_COOLDOWN) { s.shake.dizzyAt = t; s.shake.hits = []; fire('dizzy'); buzz([10, 30, 10, 30, 10]); }
        }
      }
    }
  } else if (ev.type === 'up' && s.press) {
    const pr = s.press; s.press = null; s.lastAct = t;
    if (pr.mode === 'carry') release();
    else if (pr.mode === 'pet') { play(s.perch || 'none'); fire('ahem'); }
    else if (!ev.cancel && t - pr.t < TAP_MS && pr.moved < TAP_PX) tap();
  } else if (ev.type === 'up' && s.mode === 'held') {
    s.lastAct = t; release();   // held with no press left: never leave him hanging
  } else if (ev.type === 'look') {
    // His eyes follow a finger anywhere on the screen while he is at rest; they let go 2.5 s after it stops.
    if (resting()) {
      const b = s.body, eye = b.y - (env.eyeUp ?? 50);
      fx.push({ looking: true }); num('lookX', Math.round(clamp((ev.x - b.x) / 2.2, -100, 100))); num('lookY', Math.round(clamp((ev.y - eye) / 2.2, -100, 100)));
      s.at.unlook = t + LOOK_MS;
    }
  } else if (ev.type === 'nudge') {
    // The screen needs him (your turn, a new phrase, help offered): asleep, he wakes as if tapped.
    if (s.mode === 'asleep') { fire('wake'); s.mode = 'waking'; s.at.wake = t + WAKE_MS; s.lastAct = t; }
  } else if (ev.type === 'feed') {
    if (resting()) { fire('eat'); buzz([8, 60, 8, 60, 14]); s.lastAct = t; }
  } else if (ev.type === 'highfive') {
    s.at.hf = t + HF_DELAY; s.lastAct = t;
  } else if (ev.type === 'hand') {
    if (s.hf) clap();
  } else if (ev.type === 'pinch') {
    if (ev.rule === 'all' && !['hidden', 'peeking', 'exit', 'asleep'].includes(s.mode)) {
      // The second finger turns the press into a pinch: no carry, no poke. Already carried, he is let go; mid-rub, the
      // petting pose ends (review 2026-10-27: a pinch after the hold left him held, with the mic on).
      if (!s.pinch) {
        const pr = s.press; s.pinch = { d0: ev.d }; s.press = null;
        if (pr?.mode === 'carry' || s.mode === 'held') release();
        else if (pr?.mode === 'pet') play(s.perch || 'none');
      }
      num('stretch', clamp((ev.d - s.pinch.d0) * 0.6, 0, 100)); s.lastAct = t;
    }
  } else if (ev.type === 'pinchEnd') {
    if (s.pinch) { s.pinch = null; num('stretch', 0); fire('snap'); buzz(12); s.lastAct = t; }
  } else if (ev.type === 'phoneShake') {
    if (!['held', 'hidden', 'peeking', 'exit'].includes(s.mode)) {
      const b = s.body, r = rand();
      s.perch = null; s.mode = 'flying'; s.shook = true; s.lastAct = t;
      b.vx = (r < 0.5 ? -1 : 1) * (700 + r * 500); b.vy = -900 - r * 300; b.spin = b.vx * 0.7;
      play('none');
    }
  } else if (ev.type === 'tilt') {
    s.tilt = Math.abs(ev.g) > 3 ? clamp(ev.g, -45, 45) : 0;
  } else if (ev.type === 'mic') {
    // While he is held: his body pulses with your voice; loud and steady for 0.25 s is blowing, and he leans into the wind.
    if (s.mode === 'held') {
      const m = s.mic, level = clamp(ev.level, 0, 100), dt = ev.dt ?? 0.016;
      m.level += (level - m.level) * (level > m.level ? 0.5 : 0.12);
      m.loud = m.level > BLOW_LOUD ? m.loud + dt : 0;
      num('amp', m.level);
      if (!m.wind && m.loud > BLOW_S) { m.wind = true; play('wind'); }
      else if (m.wind && m.level < BLOW_QUIET) { m.wind = false; play('held'); }
    }
  } else if (ev.type === 'tick') {
    const dt = ev.dt ?? 0.016, b = s.body;
    s.tiltMoving = false;
    // The hold is checked once, at 300 ms, as the playground's timer does: a press made mid-flight never turns into a carry later.
    if (s.press && s.press.mode === 'press' && !s.press.holdChecked && t - s.press.t >= HOLD_MS) {
      s.press.holdChecked = true;
      if (ev.rule !== 'nocarry' && s.press.moved < HOLD_PX && !['asleep', 'waking', 'back', 'flying', 'falling', 'hidden', 'peeking', 'exit'].includes(s.mode)) startCarry();
    }
    if (s.at.back && t >= s.at.back) { delete s.at.back; if (s.mode === 'back') { rest(); s.lastAct = t; } }
    if (s.at.wake && t >= s.at.wake) { delete s.at.wake; mood('smirk'); rest(); s.lastAct = t; }
    if (s.at.unwink && t >= s.at.unwink) { delete s.at.unwink; mood('smirk'); }
    if (s.at.smug && t >= s.at.smug) { delete s.at.smug; fire('smug'); }
    if (s.at.shook && t >= s.at.shook) { delete s.at.shook; fire('shook'); }
    if (s.at.perchPlay && t >= s.at.perchPlay) { delete s.at.perchPlay; if (s.mode === 'perched' && s.perch) play(s.perch); }
    if (s.at.unlook && t >= s.at.unlook) { delete s.at.unlook; if (s.mode !== 'held') { fx.push({ looking: false }); num('lookX', 0); num('lookY', 0); } }
    if (s.at.hf && t >= s.at.hf) { delete s.at.hf; if (resting()) { s.hf = t + HF_MS; s.lastAct = t; play('highfive'); } }
    if (s.hf && t >= s.hf) { s.hf = 0; fire('playoff'); play(s.perch || 'none'); }
    if (s.at.clapped && t >= s.at.clapped) { delete s.at.clapped; play(s.perch || 'none'); mood('smirk'); }
    if (s.at.recover && t >= s.at.recover) {
      delete s.at.recover;
      if (s.mode === 'recover') { if (ev.rule === 'perch') { s.mode = 'idle'; play('none'); s.lastAct = t; } else walkHome(); }
    }
    if (s.at.peek && t >= s.at.peek) {
      // Back from off the screen: he leans in from a side, eyes on the room, then hops home.
      delete s.at.peek;
      const left = rand() < 0.5;
      s.mode = 'peeking'; s.peek = { to: left ? 8 : env.w - 8, t0: t };
      Object.assign(b, { x: left ? -70 : env.w + 70, y: env.h * 0.5, rot: left ? 24 : -24, vx: 0, vy: 0, spin: 0 });
      fx.push({ hidden: false }); fx.push({ looking: true }); num('lookX', left ? 80 : -80); num('lookY', 0);
    }
    // In a lesson he waits where he landed; 4 s untouched, the screen takes him to his spot.
    if (ev.rule === 'perch' && s.mode === 'idle' && !s.press && t - s.lastAct >= AWAY_MS && Math.hypot(b.x - env.homeX, b.y - env.floorY) > 6) {
      fx.push({ drop: true }); Object.assign(b, { x: env.homeX, y: env.floorY, vx: 0, vy: 0, rot: 0, spin: 0 }); s.lastAct = t;
    }
    if (s.mode === 'held') {
      const ox = b.vx, oy = b.vy;
      b.vx += ((b.tx - b.x) * 130 - b.vx * 15) * dt; b.vy += ((b.ty - b.y) * 130 - b.vy * 15) * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      const ax = (b.vx - ox) / dt, ay = (b.vy - oy) / dt;
      b.swingV += (-ax * 0.012 - b.swing * 70 - b.swingV * 7) * dt; b.swing = clamp(b.swing + b.swingV * dt, -38, 38);
      b.squish += (clamp(-ay * 0.012, -70, 70) - b.squish) * 0.25;
    } else if (s.mode === 'falling' || s.mode === 'flying' || s.mode === 'exit') {
      b.vy += GRAVITY * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt;
      if (s.mode === 'exit') { if (b.x < -140 || b.x > env.w + 140 || b.y > env.h + 200) hide(); }
      else {
        if (b.x < 50) { b.x = 50; b.vx = Math.abs(b.vx) * 0.55; b.spin *= -0.6; buzz(8); }
        if (b.x > env.w - 50) { b.x = env.w - 50; b.vx = -Math.abs(b.vx) * 0.55; b.spin *= -0.6; buzz(8); }
        if (b.y < 110 && b.vy < 0) { b.y = 110; b.vy = Math.abs(b.vy) * 0.5; }
        const zone = s.mode === 'falling' ? zoneAt() : { kind: 'floor', y: ground };
        if (b.y >= zone.y && b.vy > 0) {
          if (s.mode === 'flying' && b.vy > BOUNCE_SPEED) { b.y = zone.y; b.vy = -b.vy * 0.42; b.vx *= 0.7; b.spin *= 0.5; buzz(10); }
          else landed(zone, s.mode === 'flying');
        }
      }
    } else if (s.mode === 'peeking') {
      const since = t - s.peek.t0;
      if (since < PEEK_IN_MS) b.x += (s.peek.to - b.x) * (1 - Math.pow(0.84, dt * 60));
      if (since > PEEK_MS) {
        s.mode = 'flying'; b.vy = -500; b.vx = (env.homeX - b.x) * 1.5; b.spin = 0; b.rot = 0;
        fx.push({ looking: false }); num('lookX', 0);
      }
    } else if (s.mode === 'walking') {
      b.x += Math.sign(env.homeX - b.x) * WALK * dt;
      if (Math.abs(b.x - env.homeX) < 4) { b.x = env.homeX; s.mode = 'idle'; play('none'); s.lastAct = t; }
    } else if (s.mode === 'idle' && Math.abs(s.tilt) > 2) {
      // Tilting the phone slides him and leans him to keep his balance; level again, he walks home.
      b.vx += s.tilt * 26 * dt; b.vx *= 0.96; b.x = clamp(b.x + b.vx * dt, 60, env.w - 60); if (b.x === 60 || b.x === env.w - 60) b.vx = 0;
      const lean = -s.tilt * 0.45;
      s.tiltMoving = Math.abs(b.vx) > 1 || Math.abs(lean - b.swing) > 0.5;   // pinned at the edge and settled, he needs no frames
      b.swing += (lean - b.swing) * 0.12; s.slid = true;
    } else if (s.mode === 'idle' && s.slid) {
      b.swing += (0 - b.swing) * 0.12; b.vx = 0;
      if (Math.abs(b.swing) < 0.5) { b.swing = 0; s.slid = false; walkHome(); }
    }
    if (resting() && !s.tiltMoving && !(s.slid && s.tilt === 0) && t - s.lastAct > SLEEP_MS) {
      s.mode = 'asleep'; mood('sleepy'); play('sleep');
    }
  }
  return { state: s, effects: fx };
}
