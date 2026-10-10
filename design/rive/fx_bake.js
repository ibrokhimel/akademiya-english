// Baked particle effects for Akademiya (no scripting: physics is simulated here and written as keyframes, so the
// effects play in every Rive runtime). Numbers: research/4-particles-juice.md (canvas-confetti model: speed decays
// ×0.9 per frame, constant paper-like fall, wobble, tumble; tiers T1 6-20 local pieces, T2 40-60, T3 80-120).
//   node fx_bake.js pop | confetti | embers | all
// Artboards (components) + view models:
//   "FX Pop"      200×200   VM FXPop      trigger fire (3 random variants), color `color` (ring + main pieces)
//   "FX Confetti" 390×844   VM FXConfetti triggers medium (2 variants), large (3 waves), fountain (gold, level up)
//   "FX Embers"   200×260   VM FXEmbers   trigger fire (2 variants)
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const IDS = path.join(__dirname, 'fx_ids.json');
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
const save = () => fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18, color: 37 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();
const PAL = { violet: '#7B5CFF', gold: '#FFC800', coral: '#FF6B5E', white: '#FFFFFF', green: '#58CC02', orange: '#FF9600', pale: '#FFE58A', lilac: '#C9BDFF', ice: '#5BC8F5', iceSoft: '#BFE9FB', dust: '#D9D3F5' };
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const key = (objectId, propertyKey, frame, value, interp = 'linear') => typeof interp === 'object'
  ? { objectId, propertyKey, frame: Math.round(frame), value, interpolationType: 'cubic', cubicParams: interp }
  : { objectId, propertyKey, frame: Math.round(frame), value, interpolationType: interp };

// ---------- generic builders ----------
async function artboard(name, w, h) {
  const all = (await call('open_file_editor', { command: 'listArtboards', data: { listArtboards: {} } })).artboards || [];
  let ab = all.find(a => a.name === name);
  if (!ab) ab = (await call('open_file_editor', { command: 'createArtboard', data: { createArtboard: [{ name, width: w, height: h, isComponent: true }] } })).artboards[0];
  const h3 = await call('get_artboard_hierarchy', { artboardId: ab.id, depth: 3 });
  const a = h3.objects.find(o => o.id === ab.id), fill = h3.objects.find(o => a.children.includes(o.id) && o.types.includes('Fill'));
  const col = fill && h3.objects.find(o => fill.children.includes(o.id));
  if (col) await call('set_property_values', { propertyValues: { [col.id]: { 37: '#00000000' } } });
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab.id } } });
  return ab.id;
}
// specs: [{name, primitive, w, h, r, color, stroke?}] -> [{id, colorId, strokeId?}] (all start invisible)
async function makePieces(abId, specs) {
  const out = [];
  for (let i = 0; i < specs.length; i += 40) {
    const batch = specs.slice(i, i + 40);
    const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: batch.map(s => ({
      primitive: s.primitive, name: s.name, parentId: abId, x: 0, y: 0, width: s.w, height: s.h, ...(s.r !== undefined ? { cornerRadius: s.r } : {}), ...(s.points ? { points: s.points, innerRadius: s.inner } : {}),
      paints: [{ paintType: s.stroke ? 'stroke' : 'fill', color: argb(s.color) }] })) } } });
    out.push(...r.shapes.map(x => ({ id: x.id })));
  }
  const h = await call('get_artboard_hierarchy', { artboardId: abId, depth: 4 });
  const by = {}; for (const o of h.objects) by[o.id] = o;
  const pv = {};
  out.forEach((p, i) => {
    const paint = by[p.id].children.map(c => by[c]).find(o => o.types.includes('Fill') || o.types.includes('Stroke'));
    p.colorId = paint.children.map(c => by[c]).find(o => o.types.includes('SolidColor')).id;
    if (specs[i].stroke) { p.strokeId = paint.id; pv[paint.id] = { 47: specs[i].stroke, 48: 1, 49: 1 }; }
    pv[p.id] = { [K.op]: 0 };
  });
  await call('set_property_values', { propertyValues: pv });
  return out;
}
async function timeline(store, name, frames, keys) {
  if (!store[name]) {
    const la = await ae('listLinearAnimations', {});
    const def = la.linearAnimations.find(a => /^Timeline/.test(a.name));
    if (def) { await ae('renameAnimations', { animations: [{ animationId: def.id, name }] }); store[name] = def.id; }
    else { const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] }); store[name] = (r.animations || r.linearAnimations)[0].id; }
  } else {   // rebuild: wipe old keys
    const q = await ae('queryKeyFrames', { animationIds: [store[name]] });
    const old = (q.keyframes[store[name]] || []).map(x => x.keyframeId);
    for (let i = 0; i < old.length; i += 500) await ae('modifyKeyFrames', { animationId: store[name], delete: old.slice(i, i + 500) });
  }
  await call('set_property_values', { propertyValues: { [store[name]]: { 56: 60, 57: frames, 59: 0 } } });
  for (let i = 0; i < keys.length; i += 400) await ae('modifyKeyFrames', { animationId: store[name], add: keys.slice(i, i + 400) });
  return keys.length;
}
// triggers: { triggerName: [timelineName, ...] } ; one layer: idle + (pick ->) variants
async function wire(abId, vmName, triggers, extraProps = []) {
  // listViewModels does not list a view model until it is bound, so keep the create result ourselves
  ids.vms = ids.vms || {}; ids._bound = ids._bound || {};
  if (!ids.vms[vmName]) {
    const r = await vme('createViewModels', { viewModels: [{ name: vmName, viewModelProperties: [...Object.keys(triggers).map(name => ({ name, propertyType: 'trigger' })), ...extraProps] }] });
    ids.vms[vmName] = r.viewModels[0]; save();
  }
  const vm = ids.vms[vmName];
  if (!ids._bound[vmName]) {
    await vme('createViewModelInstances', { viewModelId: vm.id, instances: [{ name: 'Default', instanceProperties: [] }] });
    await vme('bindViewModelToArtboard', { artboardId: abId, viewModelId: vm.id });
    ids._bound[vmName] = true; save();
  }
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;
  let sm = await ae('queryStateMachine', {});
  let L = sm.layers[0];
  const have = new Set(L.states.map(s => s.name));
  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  const want = [];
  Object.entries(triggers).forEach(([t, vars], i) => { if (vars.length > 1 && !have.has('pick-' + t)) want.push({ name: 'pick-' + t, x: 380, y: i * 140, linearAnimationName: 'idle' });
    vars.forEach((v, j) => { if (!have.has(v)) want.push(st(v, 600, i * 140 + j * 60)); }); });
  if (want.length) await ae('createStates', { layerId: L.layerId, states: want });
  sm = await ae('queryStateMachine', {}); L = sm.layers[0];
  let S = {}; for (const s of L.states) if (s.type === 'animation') S[s.name] = s.id;
  if (!S.idle) {   // the default state must be idle: create it and point Entry at it
    await ae('createStates', { layerId: L.layerId, states: [st('idle', 180, -120)] });
    sm = await ae('queryStateMachine', {}); L = sm.layers[0];
    S = {}; for (const s of L.states) if (s.type === 'animation') S[s.name] = s.id;
    const entry = L.transitions.find(t => t.fromStateId === L.entryStateId);
    await call('set_property_values', { propertyValues: { [entry.id]: { 151: S.idle } } });
    sm = await ae('queryStateMachine', {}); L = sm.layers[0];
  }
  const idle = S.idle, plan = {};
  const add = (from, to) => (plan[from] = plan[from] || []).push({ to });
  const existing = new Set(L.transitions.map(t => `${t.fromStateId}>${t.toStateId}`));
  for (const [t, vars] of Object.entries(triggers)) {
    const first = vars.length > 1 ? S['pick-' + t] : S[vars[0]];
    if (!existing.has(`${L.anyStateId}>${first}`)) add(L.anyStateId, first);
    for (const v of vars) { if (vars.length > 1 && !existing.has(`${first}>${S[v]}`)) add(first, S[v]); if (!existing.has(`${S[v]}>${idle}`)) add(S[v], idle); }
  }
  if (Object.keys(plan).length) await ae('createTransitions', { states: Object.entries(plan).map(([id, transitions]) => ({ id, transitions })) });
  sm = await ae('queryStateMachine', {}); L = sm.layers[0];
  const nm = {}; for (const s of L.states) nm[s.id] = s.name || s.type;
  const pv = {}, conds = [];
  for (const s of L.states) if ((s.name || '').startsWith('pick-')) pv[s.id] = { 536: 1 };
  for (const t of L.transitions) {
    const from = nm[t.fromStateId], to = nm[t.toStateId];
    if (from === 'entry') continue;
    if (from === 'any') { pv[t.id] = { 152: F.enableEarlyExit, 158: 0 };
      const trig = to.startsWith('pick-') ? to.slice(5) : Object.keys(triggers).find(k2 => triggers[k2][0] === to);
      if (!t.conditions.length) conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop(trig) } }] }); }
    else pv[t.id] = { 152: from.startsWith('pick-') ? 0 : (F.enableExitTime | F.exitTimeIsPercentage), 160: 100, 158: 0, 537: 1 };
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  return { vm, prop };
}

// ---------- particle physics (canvas-confetti model) ----------
const steps = (life) => { const s = [0, 2, 4, 6, 9, 12, 15, 18, 22, 26, 30]; for (let f = 40; f < life; f += 10) s.push(f); return [...s.filter(f => f < life), life]; };
// p: {x,y,angle(deg, 0 = right, -90 = up),v0,decay,fall(px/frame),wobAmp,wobHz,wobPhase,drift, start, life, rot0, rotSpeed, tumble(frames/half-turn, 0 = none)}
function bakePiece(piece, p, total) {
  const keys = [], a = p.angle * Math.PI / 180, pos = [];
  let x = p.x, y = p.y, v = p.v0;
  for (let f = 0; f <= p.life; f++) {
    pos.push([x + Math.sin(p.wobPhase + f / 60 * p.wobHz * 2 * Math.PI) * p.wobAmp * Math.min(1, f / 20), y]);
    x += Math.cos(a) * v + (p.drift || 0); y += Math.sin(a) * v + p.fall * Math.min(1, f / 14); v *= p.decay;
  }
  if (p.start > 0) keys.push(key(piece.id, K.op, 0, 0, 'hold'));
  const fadeAt = p.start + p.life * (p.fadeFrom ?? 0.7);
  keys.push(key(piece.id, K.op, p.start, 100, 'hold'), key(piece.id, K.op, fadeAt, 100, 'linear'), key(piece.id, K.op, p.start + p.life, 0, 'hold'));
  for (const s of steps(p.life)) keys.push(key(piece.id, K.x, p.start + s, +pos[s][0].toFixed(1)), key(piece.id, K.y, p.start + s, +pos[s][1].toFixed(1)));
  keys.push(key(piece.id, K.r, p.start, p.rot0), key(piece.id, K.r, p.start + p.life, +(p.rot0 + p.rotSpeed * p.life).toFixed(1)));
  if (p.tumble) { let sgn = 1; for (let f = 0; f <= p.life; f += p.tumble) { keys.push(key(piece.id, K.sx, p.start + f, 100 * sgn * (p.scale ?? 1), SINE)); sgn = -sgn; } }
  else keys.push(key(piece.id, K.sx, 0, 100 * (p.scale ?? 1), 'hold'));
  if (p.shrink) keys.push(key(piece.id, K.sy, p.start, 100, IN), key(piece.id, K.sy, p.start + p.life, 0, 'hold'));
  else keys.push(key(piece.id, K.sy, 0, 100 * (p.scale ?? 1), 'hold'));
  if (p.color) keys.push(key(piece.colorId, K.color, 0, argb(p.color), 'hold'));
  return keys;
}
const hide = (piece) => [key(piece.id, K.op, 0, 0, 'hold')];

// ---------- FX Confetti ----------
async function confetti() {
  const W = 390, H = 844, N = 110;
  const ab = ids.confetti?.ab || await artboard('FX Confetti', W, H);
  ids.confetti = ids.confetti || { ab, anims: {} };
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab } } });
  if (!ids.confetti.pieces) {
    const R = rng(7), kinds = [['rectangle', 6, 13, 2.5], ['ellipse', 9, 9], ['rectangle', 9, 9, 2.5], ['rectangle', 5, 11, 2.5], ['rectangle', 7, 17, 3]];
    const cols = [PAL.violet, PAL.gold, PAL.coral, PAL.violet, PAL.gold, PAL.coral, PAL.white, PAL.green, PAL.lilac];
    ids.confetti.pieces = await makePieces(ab, Array.from({ length: N }, (_, i) => { const k2 = kinds[i % 10 === 9 ? 4 : Math.floor(R() * 4)];
      return { name: 'c' + i, primitive: k2[0], w: k2[1], h: k2[2], r: k2[3], color: cols[Math.floor(R() * cols.length)] }; }));
    ids.confetti.base = ids.confetti.pieces.map((_, i) => { const R2 = rng(100 + i); return [PAL.violet, PAL.gold, PAL.coral, PAL.violet, PAL.gold, PAL.coral, PAL.white, PAL.green, PAL.lilac][Math.floor(R2() * 9)]; });
    save();
  }
  const P = ids.confetti.pieces, base = ids.confetti.base;
  if (!ids.confetti.anims.idle) { const r = await ae('createLinearAnimations', { linearAnimations: [{ name: 'idle', duration: 0.1 }] }); ids.confetti.anims.idle = (r.animations || r.linearAnimations)[0].id; save(); }
  const common = (R) => ({ decay: 0.9, fall: 2.6 + R() * 1.4, wobAmp: 6 + R() * 6, wobHz: 0.8 + R() * 0.8, wobPhase: R() * 6.28, rot0: R() * 360, rotSpeed: (R() < 0.5 ? -1 : 1) * (3 + R() * 9), tumble: 9 + Math.floor(R() * 10) });
  const cannon = (R, left, start, power = 1) => ({ ...common(R), x: left ? -6 : W + 6, y: H + 6, angle: (left ? -62 : -118) + (R() - 0.5) * 50, v0: (40 + R() * 34) * power, start, life: 118 + Math.floor(R() * 30) });
  const stats = {};
  // medium: 2 corner cannons, 52 pieces, ~2.4 s (two variants)
  for (const [vname, seed] of [['medium-a', 11], ['medium-b', 23]]) {
    const R = rng(seed), keys = [];
    P.forEach((pc, i) => keys.push(...(i < 52 ? bakePiece(pc, { ...cannon(R, i % 2 === 0, Math.floor(R() * 4)), color: base[i] }, 150) : hide(pc))));
    stats[vname] = await timeline(ids.confetti.anims, vname, 152, keys);
  }
  // large: wave 1 cannons (40) · wave 2 cannons, 20 % shorter, +250 ms (36) · wave 3 rain from the top, +600 ms (34)
  { const R = rng(41), keys = [];
    P.forEach((pc, i) => {
      if (i < 40) keys.push(...bakePiece(pc, { ...cannon(R, i % 2 === 0, Math.floor(R() * 4)), color: base[i] }, 200));
      else if (i < 76) keys.push(...bakePiece(pc, { ...cannon(R, i % 2 === 0, 15 + Math.floor(R() * 5), 0.8), color: base[i] }, 200));
      else keys.push(...bakePiece(pc, { ...common(R), x: 10 + R() * (W - 20), y: -14, angle: 90, v0: 2 + R() * 3, decay: 0.97, fall: 3.2 + R() * 1.6, start: 36 + Math.floor(R() * 22), life: 130 + Math.floor(R() * 26), color: base[i], fadeFrom: 0.8 }, 200));
    });
    stats.large = await timeline(ids.confetti.anims, 'large', 196, keys); }
  // fountain (level up): gold cone from the middle, pieces leave over 300 ms
  { const R = rng(77), keys = [], gold = [PAL.gold, PAL.gold, PAL.pale, PAL.white, PAL.violet, PAL.gold, PAL.orange];
    P.forEach((pc, i) => keys.push(...(i < 90 ? bakePiece(pc, { ...common(R), x: W / 2 + (R() - 0.5) * 24, y: 470, angle: -90 + (R() - 0.5) * 62, v0: 30 + R() * 34, fall: 2.8 + R() * 1.6,
      start: Math.floor(R() * 18), life: 112 + Math.floor(R() * 34), color: gold[Math.floor(R() * gold.length)] }, 170) : hide(pc))));
    stats.fountain = await timeline(ids.confetti.anims, 'fountain', 168, keys); }
  save();
  await wire(ab, 'FXConfetti', { medium: ['medium-a', 'medium-b'], large: ['large'], fountain: ['fountain'] });
  console.log('confetti keys', JSON.stringify(stats));
}

// ---------- FX Pop (correct answer / combo) ----------
async function pop() {
  const ab = ids.pop?.ab || await artboard('FX Pop', 200, 200);
  ids.pop = ids.pop || { ab, anims: {} };
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab } } });
  if (!ids.pop.pieces) {
    const specs = [{ name: 'ring', primitive: 'ellipse', w: 44, h: 44, color: PAL.green, stroke: 5 },
      ...Array.from({ length: 8 }, (_, i) => i % 2 ? { name: 'pill' + i, primitive: 'rectangle', w: 5, h: 12, r: 2.5, color: PAL.green } : { name: 'dot' + i, primitive: 'ellipse', w: 8, h: 8, color: PAL.green }),
      ...Array.from({ length: 4 }, (_, i) => ({ name: 'spark' + i, primitive: 'rectangle', w: 6, h: 6, r: 2, color: PAL.white }))];
    ids.pop.pieces = await makePieces(ab, specs); save();
  }
  const [ring, ...rest] = ids.pop.pieces, main = rest.slice(0, 8), sparks = rest.slice(8);
  await timeline(ids.pop.anims, 'idle', 6, []).catch(() => {});
  for (const [vname, seed] of [['pop-a', 3], ['pop-b', 5], ['pop-c', 9]]) {
    const R = rng(seed), keys = [], off = R() * 45;
    keys.push(key(ring.id, K.x, 0, 100, 'hold'), key(ring.id, K.y, 0, 100, 'hold'),
      key(ring.id, K.sx, 0, 70, OUT), key(ring.id, K.sx, 19, 185, 'hold'), key(ring.id, K.sy, 0, 70, OUT), key(ring.id, K.sy, 19, 185, 'hold'),
      key(ring.id, K.op, 0, 75, 'linear'), key(ring.id, K.op, 19, 0, 'hold'));
    const radial = (pc, ang, dist, life, spin, start = 0) => {
      const a = ang * Math.PI / 180, at = (d) => [100 + Math.cos(a) * d, 100 + Math.sin(a) * d], p0 = at(12), p9 = at(12 + (dist - 12) * 0.9), p1 = at(dist), s = start;
      if (s) keys.push(key(pc.id, K.op, 0, 0, 'hold'));
      keys.push(key(pc.id, K.op, s, 100, 'hold'), key(pc.id, K.op, s + life, 0, 'hold'),
        key(pc.id, K.x, s, +p0[0].toFixed(1), OUT), key(pc.id, K.y, s, +p0[1].toFixed(1), OUT), key(pc.id, K.x, s + 11, +p9[0].toFixed(1), 'linear'), key(pc.id, K.y, s + 11, +p9[1].toFixed(1), 'linear'),
        key(pc.id, K.x, s + life, +p1[0].toFixed(1), 'hold'), key(pc.id, K.y, s + life, +p1[1].toFixed(1), 'hold'),
        key(pc.id, K.r, s, ang + 90, 'linear'), key(pc.id, K.r, s + life, ang + 90 + spin, 'hold'),
        key(pc.id, K.sx, s, 100, 'hold'), key(pc.id, K.sx, s + Math.round(life * 0.4), 100, IN), key(pc.id, K.sx, s + life, 0, 'hold'),
        key(pc.id, K.sy, s, 100, 'hold'), key(pc.id, K.sy, s + Math.round(life * 0.4), 100, IN), key(pc.id, K.sy, s + life, 0, 'hold'));
    };
    main.forEach((pc, i) => radial(pc, off + i * 45 + (R() - 0.5) * 30, 46 + R() * 30, 22 + Math.floor(R() * 8), i % 2 ? 0 : 90, 1 + Math.floor(R() * 3)));
    sparks.forEach((pc, i) => radial(pc, off + 22 + i * 90 + (R() - 0.5) * 40, 30 + R() * 22, 18 + Math.floor(R() * 6), 120, 3 + Math.floor(R() * 3)));
    await timeline(ids.pop.anims, vname, 34, keys);
  }
  save();
  const { vm, prop } = await wire(ab, 'FXPop', { fire: ['pop-a', 'pop-b', 'pop-c'] }, [{ name: 'color', propertyType: 'color' }]);
  if (!ids.pop.bound) {
    await vme('databind', { viewModelId: vm.id, bindings: [ring, ...main].map(pc => ({ objectId: pc.colorId, propertyKey: K.color, viewModelPropertyId: prop('color') })) });
    ids.pop.bound = true; ids.pop.colorProp = prop('color'); save();
  }
  console.log('pop ready');
}

// ---------- FX Embers (streak +1) ----------
async function embers() {
  const ab = ids.embers?.ab || await artboard('FX Embers', 200, 260);
  ids.embers = ids.embers || { ab, anims: {} };
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab } } });
  if (!ids.embers.pieces) {
    const R = rng(13), cols = [PAL.orange, PAL.gold, PAL.orange, PAL.gold, PAL.coral, PAL.white];
    ids.embers.pieces = await makePieces(ab, Array.from({ length: 16 }, (_, i) => { const s = 5 + Math.floor(R() * 5);
      return i % 3 === 0 ? { name: 'e' + i, primitive: 'rectangle', w: s, h: s, r: s * 0.3, color: cols[i % cols.length] } : { name: 'e' + i, primitive: 'ellipse', w: s, h: s, color: cols[i % cols.length] }; })); save();
  }
  await timeline(ids.embers.anims, 'idle', 6, []).catch(() => {});
  for (const [vname, seed] of [['embers-a', 31], ['embers-b', 57]]) {
    const R = rng(seed), keys = [];
    ids.embers.pieces.forEach(pc => keys.push(...bakePiece(pc, { x: 100 + (R() - 0.5) * 44, y: 226, angle: -90 + (R() - 0.5) * 36, v0: 3.6 + R() * 4, decay: 0.955, fall: -0.25 - R() * 0.35,
      wobAmp: 5 + R() * 9, wobHz: 0.9 + R() * 0.9, wobPhase: R() * 6.28, start: Math.floor(R() * 16), life: 44 + Math.floor(R() * 30), rot0: 45, rotSpeed: (R() - 0.5) * 6, tumble: 0, shrink: true, fadeFrom: 0.6 }, 90)));
    await timeline(ids.embers.anims, vname, 92, keys);
  }
  save();
  await wire(ab, 'FXEmbers', { fire: ['embers-a', 'embers-b'] });
  console.log('embers ready');
}

module.exports = { ids, save, call, vme, ae, K, PAL, SINE, OUT, IN, F, rng, key, artboard, makePieces, timeline, wire, bakePiece, hide, argb };
if (require.main === module) (async () => {
  const what = process.argv[2] || 'all';
  if (what === 'pop' || what === 'all') await pop();
  if (what === 'embers' || what === 'all') await embers();
  if (what === 'confetti' || what === 'all') await confetti();
  if (what === 'confetti-wire') {   // wiring only (keys already baked)
    await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.confetti.ab } } });
    await wire(ids.confetti.ab, 'FXConfetti', { medium: ['medium-a', 'medium-b'], large: ['large'], fountain: ['fountain'] });
    console.log('confetti wired');
  }
})().catch(e => { console.log('FAIL', String(e.stack).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exit(1); });
