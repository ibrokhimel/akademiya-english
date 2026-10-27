// Dombi's touch play, ported from the playground (design/rive/play.html, locked 2026-10-11). No screens here.
// The app feeds finger events and frame ticks in; out come the rig effects (triggers, the `play` enum, mood, haptics)
// and his body (position, swing, squish) for the screen to draw.
//   touchStart(t) -> state     touchReducer(state, { type: 'down'|'move'|'up'|'tick', t, x?, y?, dt?, rand?, cancel?, rule, env })
// rule: 'all' (tabs), 'nocarry' (no carrying) or 'perch' (a lesson: carried, dropped and thrown as on the tabs, but he
// stays where he lands; after 4 s untouched the effect `drop` hands him to the screen, which moves him to the nearest
// free spot; owner, 2026-10-27). env: { w, h, homeX, floorY, groundY? } in screen points; groundY is where he lands
// (default floorY, his home).

const HOLD_MS = 300, TAP_MS = 300, TAP_PX = 12, HOLD_PX = 10, PET_PX = 12, DOUBLE_MS = 400, POKE_RESET_MS = 4000,
  BACK_MS = 3000, THROW = 900, SLEEP_MS = 22000, WAKE_MS = 950, SHAKE_SPEED = 380, SHAKE_HITS = 5, SHAKE_MS = 900,
  DIZZY_COOLDOWN = 2600, GRAVITY = 2600, BOUNCE_SPEED = 700, WALK = 95,
  RUB_MS = 1000, RUB_PATH = 40, RUB_SPOT = 24, AWAY_MS = 4000;
const TRICKS = ['trickSpin', 'trickFlick', 'trickShades'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function touchStart(t = 0) {
  return {
    mode: 'idle', press: null, pokes: 0, lastPoke: -1e9, lastTap: -1e9, lastTrick: -1, lastAct: t,
    shake: { hits: [], sign: 0, dizzyAt: -1e9 }, trail: [], at: {},
    body: { x: /** @type {number | null} */ (null), y: /** @type {number | null} */ (null), vx: 0, vy: 0, rot: 0, spin: 0, tx: 0, ty: 0, swing: 0, swingV: 0, squish: 0 },
  };
}

export function touchReducer(state, ev) {
  const s = { ...state, body: { ...state.body }, shake: { ...state.shake, hits: [...state.shake.hits] }, trail: [...state.trail], at: { ...state.at }, press: state.press && { ...state.press } };
  const fx = [], env = ev.env, t = ev.t, ground = env.groundY ?? env.floorY;
  if (s.body.x === null) { s.body.x = env.homeX; s.body.y = env.floorY; }
  const fire = (name) => fx.push({ fire: name }), play = (v) => fx.push({ play: v }), mood = (m) => fx.push({ mood: m }), buzz = (h) => fx.push({ haptic: h });

  const startCarry = () => {
    s.press.mode = 'carry'; s.mode = 'held'; s.trail = []; s.body.tx = s.press.last.x; s.body.ty = s.press.last.y - 4; s.body.rot = 0; s.body.spin = 0;
    fire('hop'); play('held'); mood('smirk'); buzz(15);
  };
  const release = () => {
    const b = s.body; b.swing = 0; b.squish = 0;
    let tr = s.trail.filter((q) => t - q.t < 130); if (tr.length < 2) tr = s.trail.slice(-3).filter((q) => t - q.t < 260);
    if (tr.length >= 2 && tr[tr.length - 1].t > tr[0].t) { const dts = (tr[tr.length - 1].t - tr[0].t) / 1000; b.vx = (tr[tr.length - 1].x - tr[0].x) / dts; b.vy = (tr[tr.length - 1].y - tr[0].y) / dts; }
    else { b.vx *= 0.4; b.vy *= 0.4; }
    b.vx = clamp(b.vx, -2600, 2600); b.vy = clamp(b.vy, -2600, 2600);
    if (Math.hypot(b.vx, b.vy) > THROW) { s.mode = 'flying'; b.spin = clamp(b.vx * 0.9, -900, 900); }
    else { s.mode = 'falling'; b.vx *= 0.3; }
    play('none');
  };
  const tap = () => {
    if (s.mode === 'asleep') { fire('wake'); buzz(10); s.mode = 'waking'; s.at.wake = t + WAKE_MS; return; }
    if (s.mode === 'back' || s.mode === 'waking') return;
    if (t - s.lastTap < DOUBLE_MS) {
      s.lastTap = -1e9; s.pokes = Math.max(0, s.pokes - 1);
      const options = [0, 1, 2].filter((i) => i !== s.lastTrick), i = options[Math.floor((ev.rand ?? Math.random()) * options.length)];
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
  const landed = (hard) => {
    const b = s.body; b.vy = 0; b.vx = 0; b.rot = 0; b.spin = 0; b.y = ground;
    fire('land'); buzz(hard ? [20, 30, 10] : 18);
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
    else if (pr.mode === 'pet') { play('none'); fire('ahem'); }
    else if (!ev.cancel && t - pr.t < TAP_MS && pr.moved < TAP_PX) tap();
  } else if (ev.type === 'tick') {
    const dt = ev.dt ?? 0.016, b = s.body;
    // The hold is checked once, at 300 ms, as the playground's timer does: a press made mid-flight never turns into a carry later.
    if (s.press && s.press.mode === 'press' && !s.press.holdChecked && t - s.press.t >= HOLD_MS) {
      s.press.holdChecked = true;
      if (ev.rule !== 'nocarry' && s.press.moved < HOLD_PX && !['asleep', 'waking', 'back', 'flying', 'falling'].includes(s.mode)) startCarry();
    }
    if (s.at.back && t >= s.at.back) { delete s.at.back; if (s.mode === 'back') { s.mode = 'idle'; play('none'); s.lastAct = t; } }
    if (s.at.wake && t >= s.at.wake) { delete s.at.wake; mood('smirk'); play('none'); s.mode = 'idle'; s.lastAct = t; }
    if (s.at.unwink && t >= s.at.unwink) { delete s.at.unwink; mood('smirk'); }
    if (s.at.smug && t >= s.at.smug) { delete s.at.smug; fire('smug'); }
    if (s.at.recover && t >= s.at.recover) {
      delete s.at.recover;
      if (s.mode === 'recover') { if (ev.rule === 'perch') { s.mode = 'idle'; play('none'); s.lastAct = t; } else walkHome(); }
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
    } else if (s.mode === 'falling' || s.mode === 'flying') {
      b.vy += GRAVITY * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt;
      if (b.x < 50) { b.x = 50; b.vx = Math.abs(b.vx) * 0.55; b.spin *= -0.6; buzz(8); }
      if (b.x > env.w - 50) { b.x = env.w - 50; b.vx = -Math.abs(b.vx) * 0.55; b.spin *= -0.6; buzz(8); }
      if (b.y < 110 && b.vy < 0) { b.y = 110; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y >= ground && b.vy > 0) {
        if (s.mode === 'flying' && b.vy > BOUNCE_SPEED) { b.y = ground; b.vy = -b.vy * 0.42; b.vx *= 0.7; b.spin *= 0.5; buzz(10); }
        else landed(s.mode === 'flying');
      }
    } else if (s.mode === 'walking') {
      b.x += Math.sign(env.homeX - b.x) * WALK * dt;
      if (Math.abs(b.x - env.homeX) < 4) { b.x = env.homeX; s.mode = 'idle'; play('none'); s.lastAct = t; }
    } else if (s.mode === 'idle' && t - s.lastAct > SLEEP_MS) {
      s.mode = 'asleep'; mood('sleepy'); play('sleep');
    }
  }
  return { state: s, effects: fx };
}
