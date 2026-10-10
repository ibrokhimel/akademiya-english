// Effects for the full app (after-MVP features), plan: docs/ideas/motion-plan.md §4 "After MVP".
//   node fx_full.js flame | streak | apples | chest | poof | clean | all
// - Streak Flame: + bool `risk` (small, nervous flicker), trigger `out` (dies down to grey), trigger `repair` (sputters, relights)
// - FX Confetti:  + trigger `streak` (orange/gold fountain for streak milestones 7/30/100/365)
// - "FX Apples" 240×240, VM FXApples: trigger fire (2 versions): 10 apples burst up and fall (currency earned / quest reward)
// - "FX Chest"  240×240, VM FXChest: triggers shake, open, reset: reward chest (daily quests, league rewards)
// - "FX Poof"   200×200, VM FXPoof: trigger fire (2 versions): cloud puff for outfit swaps / shop purchases
const fx = require('./fx_bake.js');
const { ids, save, call, vme, ae, K, PAL, SINE, OUT, IN, F, rng, key, artboard, makePieces, timeline, wire, bakePiece, hide, argb } = fx;
const focus = (ab) => call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab } } });
async function board(k, name, w, h) { const ab = ids[k]?.ab || await artboard(name, w, h); ids[k] = ids[k] || { ab, anims: {} }; save(); await focus(ab); return ab; }
async function group(name, parentId, x = 0, y = 0) { const r = await call('group_editor', { name, parentId }); await call('set_property_values', { propertyValues: { [r.group.id]: { [K.x]: x, [K.y]: y } } }); return r.group.id; }
async function addProps(vmName, props) {   // -> prop(name)
  const fresh = (await vme('listViewModels', {})).viewModels.find(v => v.id === ids.vms[vmName].id); if (fresh) { ids.vms[vmName] = fresh; save(); }
  const have = new Set(ids.vms[vmName].viewModelProperties.map(p => p.name)), need = props.filter(p => !have.has(p.name));
  if (need.length) { const r = await vme('addProperties', { viewModels: [{ viewModelId: ids.vms[vmName].id, viewModelProperties: need }] }); ids.vms[vmName] = r.viewModels.find(v => v.id === ids.vms[vmName].id); save(); }
  return (n) => ids.vms[vmName].viewModelProperties.find(p => p.name === n).id;
}
const cond = (id, op, value) => ({ leftComparator: { viewModelPropertyId: id }, ...(op ? { comparationOperation: op, rightComparator: { valueType: 'constantValueType', value } } : {}) });
async function layer0() { const sm = await ae('queryStateMachine', {}); const L = sm.layers[0]; const S = {}; for (const s of L.states) if (s.type === 'animation') S[s.name] = s.id; return { L, S }; }
async function ensureStates(names) { let { L, S } = await layer0(); const want = names.filter(n => !S[n]);
  if (want.length) await ae('createStates', { layerId: L.layerId, states: want.map((n, i) => ({ name: n, x: 620 + (i % 3) * 180, y: 200 + Math.floor(i / 3) * 80, linearAnimationName: n })) }); return layer0(); }
async function ensureTransitions(pairs) {   // [[fromId, toId]] -> transitions created if missing
  let { L } = await layer0(); const have = new Set(L.transitions.map(t => `${t.fromStateId}>${t.toStateId}`)), plan = {};
  for (const [a, b] of pairs) if (!have.has(`${a}>${b}`)) (plan[a] = plan[a] || []).push({ to: b });
  if (Object.keys(plan).length) await ae('createTransitions', { states: Object.entries(plan).map(([id, transitions]) => ({ id, transitions })) });
  return layer0();
}
const tr = (L, a, b) => L.transitions.find(t => t.fromStateId === a && t.toStateId === b);

// ---------- Streak Flame: risk / out / repair ----------
async function flame() {
  const S = ids.flame; await focus(S.ab);
  const { root: R, outerG: O, innerG: I } = S, col = (f, outer, inner, interp = 'hold') => [key(S.outerColor, K.color, f, argb(outer), interp), key(S.innerColor, K.color, f, argb(inner), interp)];
  const GREY = ['#E5E5E5', '#F4F4F4'], HOT = [PAL.orange, PAL.gold];
  const rest = [[O, K.sx], [O, K.sy], [I, K.sx], [I, K.sy]].map(([o, p]) => key(o, p, 0, 100, 'hold')).concat([key(O, K.r, 0, 0, 'hold'), key(I, K.r, 0, 0, 'hold'), key(R, K.r, 0, 0, 'hold')]);
  const flick = (o, p, list) => list.map(([f, v]) => key(o, p, f, v, SINE));
  // at risk: 0.8 s nervous loop, smaller
  await timeline(S.anims, 'risk', 48, [...col(0, ...HOT), key(R, K.sx, 0, 84, 'hold'), key(R, K.sy, 0, 80, 'hold'), key(R, K.r, 0, 0, 'hold'),
    ...flick(O, K.sy, [[0, 100], [8, 112], [16, 94], [26, 110], [36, 92], [48, 100]]), ...flick(O, K.sx, [[0, 100], [8, 92], [16, 104], [26, 93], [36, 105], [48, 100]]),
    ...flick(O, K.r, [[0, 0], [10, 5], [22, -5], [34, 4], [48, 0]]), ...flick(I, K.sy, [[0, 100], [6, 88], [14, 114], [24, 90], [34, 112], [48, 100]]), key(I, K.sx, 0, 100, 'hold'), ...flick(I, K.r, [[0, 0], [12, -6], [28, 6], [48, 0]])]);
  await call('set_property_values', { propertyValues: { [S.anims.risk]: { 59: 1 } } });
  // goes out: sinks, turns grey
  await timeline(S.anims, 'out', 34, [...rest.filter(k => k.objectId !== R), ...col(0, ...HOT, 'linear'), ...col(20, ...GREY), key(R, K.r, 0, 0, 'hold'),
    key(R, K.sy, 0, 100, IN), key(R, K.sy, 14, 46, OUT), key(R, K.sy, 24, 108, SINE), key(R, K.sy, 34, 100, 'hold'), key(R, K.sx, 0, 100, IN), key(R, K.sx, 14, 70, OUT), key(R, K.sx, 24, 96, SINE), key(R, K.sx, 34, 100, 'hold')]);
  // repaired: sputters grey/orange three times, then catches with a pop
  await timeline(S.anims, 'repair', 60, [...rest.filter(k => k.objectId !== R), key(R, K.r, 0, 0, 'hold'),
    ...col(0, ...GREY), ...col(6, ...HOT), ...col(10, ...GREY), ...col(16, ...HOT), ...col(20, ...GREY), ...col(26, ...HOT),
    key(R, K.sy, 0, 100, 'hold'), key(R, K.sy, 6, 108, 'hold'), key(R, K.sy, 10, 100, 'hold'), key(R, K.sy, 16, 112, 'hold'), key(R, K.sy, 20, 100, 'hold'),
    key(R, K.sy, 26, 72, OUT), key(R, K.sy, 35, 136, SINE), key(R, K.sy, 43, 92, SINE), key(R, K.sy, 51, 104, SINE), key(R, K.sy, 60, 100, 'hold'),
    key(R, K.sx, 0, 100, 'hold'), key(R, K.sx, 26, 116, OUT), key(R, K.sx, 35, 86, SINE), key(R, K.sx, 43, 106, SINE), key(R, K.sx, 51, 98, SINE), key(R, K.sx, 60, 100, 'hold')]);
  save();
  const prop = await addProps('StreakFlame', [{ name: 'risk', propertyType: 'boolean' }, { name: 'out', propertyType: 'trigger' }, { name: 'repair', propertyType: 'trigger' }]);
  let { L, S: st } = await ensureStates(['risk', 'out', 'repair']);
  ({ L, S: st } = await ensureTransitions([[st.on, st.risk], [st.risk, st.on], [st.risk, st.idle], [L.anyStateId, st.out], [st.out, st.idle], [L.anyStateId, st.repair], [st.repair, st.on]]));
  const pv = {}, conds = [], set = (t, p, c) => { if (!t) return; pv[t.id] = p; if (c && !t.conditions.length) conds.push({ id: t.id, conditions: c }); };
  const lit = ids.vms.StreakFlame.viewModelProperties.find(p => p.name === 'lit').id;
  set(tr(L, st.on, st.risk), { 152: F.enableEarlyExit, 158: 200, 349: 2 }, [cond(prop('risk'), 'equal', true)]);
  set(tr(L, st.risk, st.on), { 152: F.enableEarlyExit, 158: 200, 349: 2 }, [cond(prop('risk'), 'equal', false)]);
  set(tr(L, st.risk, st.idle), { 152: F.enableEarlyExit, 158: 300, 349: 2 }, [cond(lit, 'equal', false)]);
  set(tr(L, L.anyStateId, st.out), { 152: F.enableEarlyExit, 158: 0 }, [cond(prop('out'))]);
  set(tr(L, st.out, st.idle), { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 0 });
  set(tr(L, L.anyStateId, st.repair), { 152: F.enableEarlyExit, 158: 0 }, [cond(prop('repair'))]);
  set(tr(L, st.repair, st.on), { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 0 });
  await call('set_property_values', { propertyValues: pv }); if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('flame: risk / out / repair ready');
}

// ---------- FX Confetti: streak-milestone fountain ----------
async function streak() {
  const S = ids.confetti; await focus(S.ab);
  const R = rng(131), keys = [], pal = [PAL.orange, PAL.orange, PAL.gold, PAL.gold, PAL.coral, PAL.white, PAL.pale];
  S.pieces.forEach((pc, i) => keys.push(...(i < 100 ? bakePiece(pc, { decay: 0.9, fall: 2.6 + R() * 1.6, wobAmp: 6 + R() * 6, wobHz: 0.8 + R() * 0.8, wobPhase: R() * 6.28, rot0: R() * 360, rotSpeed: (R() < 0.5 ? -1 : 1) * (3 + R() * 9),
    tumble: 9 + Math.floor(R() * 10), x: 195 + (R() - 0.5) * 36, y: 560, angle: -90 + (R() - 0.5) * 84, v0: 34 + R() * 38, start: Math.floor(R() * 30), life: 118 + Math.floor(R() * 36), color: pal[Math.floor(R() * pal.length)] }, 190) : hide(pc))));
  const n = await timeline(S.anims, 'streak', 188, keys); save();
  const prop = await addProps('FXConfetti', [{ name: 'streak', propertyType: 'trigger' }]);
  let { L, S: st } = await ensureStates(['streak']);
  ({ L, S: st } = await ensureTransitions([[L.anyStateId, st.streak], [st.streak, st.idle]]));
  const a = tr(L, L.anyStateId, st.streak), b = tr(L, st.streak, st.idle);
  await call('set_property_values', { propertyValues: { [a.id]: { 152: F.enableEarlyExit, 158: 0 }, [b.id]: { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0 } } });
  if (!a.conditions.length) await ae('createConditions', { transitions: [{ id: a.id, conditions: [cond(prop('streak'))] }] });
  console.log('confetti: streak fountain ready', n, 'keys');
}

// ---------- FX Apples ----------
async function apples() {
  const ab = await board('apples', 'FX Apples', 240, 240), S = ids.apples;
  if (!S.pieces) {
    S.pieces = [];
    for (let i = 0; i < 10; i++) {
      const g = await group('apple' + i, ab, 120, 150);
      await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
        { primitive: 'ellipse', name: 'fruit', parentId: g, x: 0, y: 2, width: 18, height: 17, paints: [{ paintType: 'fill', color: argb('#FF4B4B') }] },
        { primitive: 'ellipse', name: 'shine', parentId: g, x: -4, y: -1, width: 5, height: 5, paints: [{ paintType: 'fill', color: argb('#FF8A8A') }] },
        { primitive: 'rectangle', name: 'leaf', parentId: g, x: 3, y: -8, width: 5, height: 9, cornerRadius: 2.5, paints: [{ paintType: 'fill', color: argb(PAL.green) }] }] } } });
      S.pieces.push({ id: g });
    }
    const pv = {}; S.pieces.forEach(p => pv[p.id] = { [K.op]: 0 }); await call('set_property_values', { propertyValues: pv }); save();
  }
  await focus(ab); await timeline(S.anims, 'idle', 6, []);
  for (const [vname, seed] of [['apples-a', 211], ['apples-b', 223]]) {
    const R = rng(seed), keys = [];
    S.pieces.forEach(pc => keys.push(...bakePiece(pc, { x: 120 + (R() - 0.5) * 20, y: 150, angle: -90 + (R() - 0.5) * 110, v0: 9 + R() * 8, decay: 0.92, fall: 4 + R() * 1.6, wobAmp: 0, wobHz: 1, wobPhase: 0,
      start: Math.floor(R() * 6), life: 46 + Math.floor(R() * 16), rot0: (R() - 0.5) * 40, rotSpeed: (R() - 0.5) * 14, tumble: 0, fadeFrom: 0.72 }, 70)));
    await timeline(S.anims, vname, 70, keys);
  }
  save(); await wire(ab, 'FXApples', { fire: ['apples-a', 'apples-b'] }); console.log('apples ready');
}

// ---------- FX Poof ----------
async function poof() {
  const ab = await board('poof', 'FX Poof', 200, 200), S = ids.poof;
  if (!S.pieces) { S.pieces = await makePieces(ab, [...Array.from({ length: 9 }, (_, i) => ({ name: 'puff' + i, primitive: 'ellipse', w: 24 + (i % 3) * 6, h: 24 + (i % 3) * 6, color: i % 2 ? PAL.dust : PAL.lilac })),
    ...Array.from({ length: 4 }, (_, i) => ({ name: 'star' + i, primitive: 'star', w: 12, h: 12, points: 4, inner: 30, r: 1.5, color: PAL.gold }))]); save(); }
  await focus(ab); await timeline(S.anims, 'idle', 6, []);
  for (const [vname, seed] of [['poof-a', 307], ['poof-b', 311]]) {
    const R = rng(seed), keys = [], off = R() * 40;
    S.pieces.forEach((pc, i) => { const puff = i < 9, a = (off + (puff ? i * 40 : 20 + (i - 9) * 90) + (R() - 0.5) * 20) * Math.PI / 180, d = puff ? 34 + R() * 26 : 62 + R() * 18, life = puff ? 20 + Math.floor(R() * 8) : 26, s = puff ? Math.floor(R() * 3) : 6;
      const x0 = 100 + Math.cos(a) * 8, y0 = 100 + Math.sin(a) * 8, x1 = 100 + Math.cos(a) * d, y1 = 100 + Math.sin(a) * d;
      if (s) keys.push(key(pc.id, K.op, 0, 0, 'hold'));
      keys.push(key(pc.id, K.x, s, +x0.toFixed(1), OUT), key(pc.id, K.y, s, +y0.toFixed(1), OUT), key(pc.id, K.x, s + life, +x1.toFixed(1), 'hold'), key(pc.id, K.y, s + life, +y1.toFixed(1), 'hold'),
        key(pc.id, K.sx, s, puff ? 50 : 0, OUT), key(pc.id, K.sx, s + life, puff ? 130 : 110, 'hold'), key(pc.id, K.sy, s, puff ? 50 : 0, OUT), key(pc.id, K.sy, s + life, puff ? 130 : 110, 'hold'),
        key(pc.id, K.op, s, puff ? 95 : 100, 'linear'), key(pc.id, K.op, s + life, 0, 'hold'), key(pc.id, K.r, s, 0, 'linear'), key(pc.id, K.r, s + life, puff ? 0 : 70, 'hold')); });
    await timeline(S.anims, vname, 34, keys);
  }
  save(); await wire(ab, 'FXPoof', { fire: ['poof-a', 'poof-b'] }); console.log('poof ready');
}

// ---------- FX Chest ----------
async function chest() {
  const ab = await board('chest', 'FX Chest', 240, 240), S = ids.chest;
  if (!S.root) {
    S.root = await group('chest', ab, 120, 200);                       // pivot at the floor
    const rect = (name, parentId, x, y, w, h, r, color) => ({ primitive: 'rectangle', name, parentId, x, y, width: w, height: h, cornerRadius: r, paints: [{ paintType: 'fill', color: argb(color) }] });
    S.glow = await group('glow', S.root, 0, -62);
    const g = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [rect('glowBar', S.glow, 0, 0, 92, 60, 14, PAL.pale)] } } }); S.glowShape = g.shapes[0].id;
    S.coins = (await makePieces(ab, Array.from({ length: 12 }, (_, i) => ({ name: 'coin' + i, primitive: 'ellipse', w: 13 + (i % 3) * 2, h: 13 + (i % 3) * 2, color: i % 3 === 0 ? '#FF4B4B' : i % 3 === 1 ? PAL.gold : PAL.pale }))));
    await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
      rect('inside', S.root, 0, -58, 104, 26, 8, '#6B4410'), rect('base', S.root, 0, -30, 116, 60, 12, '#C97A2B'), rect('baseBand', S.root, 0, -30, 20, 60, 0, PAL.gold), rect('baseEdge', S.root, 0, -5, 116, 10, 5, '#A85F1C')] } } });
    S.lid = await group('lid', S.root, 0, -60);                        // pivot at the lid's bottom edge
    await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
      rect('lidTop', S.lid, 0, -17, 120, 34, 14, '#D98B36'), rect('lidBand', S.lid, 0, -17, 20, 34, 0, PAL.gold), { primitive: 'ellipse', name: 'lock', parentId: S.lid, x: 0, y: -2, width: 18, height: 18, paints: [{ paintType: 'fill', color: argb('#FFE58A') }] }] } } });
    await call('set_property_values', { propertyValues: { [S.glow]: { [K.op]: 0 } } }); save();
  }
  await focus(ab);
  const { root: R, lid: Ld, glow: G } = S;
  const closed = [key(Ld, K.y, 0, -60, 'hold'), key(Ld, K.r, 0, 0, 'hold'), key(G, K.op, 0, 0, 'hold'), key(G, K.sy, 0, 40, 'hold'), key(G, K.y, 0, -62, 'hold'), key(R, K.r, 0, 0, 'hold'), key(R, K.sx, 0, 100, 'hold'), key(R, K.sy, 0, 100, 'hold'), ...S.coins.map(c => key(c.id, K.op, 0, 0, 'hold'))];
  await timeline(S.anims, 'idle', 6, closed);
  // anticipation: three small shakes
  await timeline(S.anims, 'shake', 36, [...closed, ...[[0, 0], [5, -5], [10, 5], [15, -4], [20, 4], [25, -2], [30, 0], [36, 0]].map(([f, v]) => key(R, K.r, f, v, SINE))]);
  // open: squash, lid pops up and tilts, glow rises, coins and apples burst out
  const Rn = rng(401), coinKeys = [];
  S.coins.forEach(pc => coinKeys.push(...bakePiece(pc, { x: 120 + (Rn() - 0.5) * 50, y: 132, angle: -90 + (Rn() - 0.5) * 100, v0: 8 + Rn() * 8, decay: 0.92, fall: 4 + Rn() * 1.5, wobAmp: 0, wobHz: 1, wobPhase: 0,
    start: 9 + Math.floor(Rn() * 7), life: 44 + Math.floor(Rn() * 16), rot0: 0, rotSpeed: 0, tumble: 0, fadeFrom: 0.7 }, 80)));
  const openKeys = [key(R, K.r, 0, 0, 'hold'), key(R, K.sy, 0, 100, OUT), key(R, K.sy, 5, 86, OUT), key(R, K.sy, 11, 108, SINE), key(R, K.sy, 18, 100, 'hold'), key(R, K.sx, 0, 100, OUT), key(R, K.sx, 5, 110, OUT), key(R, K.sx, 11, 96, SINE), key(R, K.sx, 18, 100, 'hold'),
    key(Ld, K.y, 0, -60, 'hold'), key(Ld, K.y, 5, -60, OUT), key(Ld, K.y, 12, -98, SINE), key(Ld, K.y, 18, -90, 'hold'), key(Ld, K.r, 0, 0, 'hold'), key(Ld, K.r, 5, 0, OUT), key(Ld, K.r, 12, -16, SINE), key(Ld, K.r, 18, -12, 'hold'),
    key(G, K.op, 0, 0, 'hold'), key(G, K.op, 6, 0, OUT), key(G, K.op, 12, 100, 'hold'), key(G, K.sy, 0, 40, 'hold'), key(G, K.sy, 6, 40, OUT), key(G, K.sy, 14, 100, 'hold'), key(G, K.y, 0, -62, 'hold'), key(G, K.y, 6, -62, OUT), key(G, K.y, 14, -78, 'hold')];
  await timeline(S.anims, 'open', 80, [...openKeys, ...coinKeys]);
  await timeline(S.anims, 'opened', 6, [key(Ld, K.y, 0, -90, 'hold'), key(Ld, K.r, 0, -12, 'hold'), key(G, K.op, 0, 100, 'hold'), key(G, K.sy, 0, 100, 'hold'), key(G, K.y, 0, -78, 'hold'), key(R, K.r, 0, 0, 'hold'), key(R, K.sx, 0, 100, 'hold'), key(R, K.sy, 0, 100, 'hold'), ...S.coins.map(c => key(c.id, K.op, 0, 0, 'hold'))]);
  save();
  const { prop } = await wire(ab, 'FXChest', { shake: ['shake'], open: ['open'] }, [{ name: 'reset', propertyType: 'trigger' }]);
  let { L, S: st } = await ensureStates(['opened']);
  const toIdle = tr(L, st.open, st.idle); if (toIdle) await call('set_property_values', { propertyValues: { [toIdle.id]: { 151: st.opened } } });    // open -> opened (stays open)
  ({ L, S: st } = await ensureTransitions([[st.opened, st.idle]]));
  const back = tr(L, st.opened, st.idle);
  await call('set_property_values', { propertyValues: { [back.id]: { 152: F.enableEarlyExit, 158: 200, 349: 2 } } });
  if (!back.conditions.length) await ae('createConditions', { transitions: [{ id: back.id, conditions: [cond(prop('reset'))] }] });
  console.log('chest ready');
}

async function clean() {   // remove duplicate, unbound FXPop view models left by earlier failed runs
  const l = await vme('listViewModels', {}); const dup = l.viewModels.filter(v => v.name === 'FXPop' && v.id !== ids.vms.FXPop.id).map(v => v.id);
  if (dup.length) await call('delete_objects', { objectIds: dup }); console.log('removed duplicate view models:', dup.length);
}

(async () => {
  const what = process.argv[2] || 'all';
  for (const [n, fn] of [['clean', clean], ['flame', flame], ['streak', streak], ['apples', apples], ['poof', poof], ['chest', chest]]) if (what === n || what === 'all') await fn();
})().catch(e => { console.log('FAIL', String(e.stack).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exit(1); });
