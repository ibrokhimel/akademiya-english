// Two custom effect artboards (plan docs/ideas/motion-plan.md F11 + streak flame).
//   node fx_voice_flame.js voice | flame | all
// "FX Voice" 200×200, VM FXVoice: number `amp` (0-100, live mic level) + trigger `heard`
//    3 coral rings whose size follows amp (data-bound, each ring a bit more than the last); `heard` = rings close in
//    and a green check draws itself (trim path), holds ~0.7 s, fades.
// "Streak Flame" 96×96, VM StreakFlame: bool `lit` + trigger `ignite`
//    off = grey and still · on = orange/gold flicker loop · ignite = pop up big, then settle into the loop
//    (set lit = true, then fire ignite, for the streak +1 moment).
const fx = require('./fx_bake.js');
const { ids, save, call, vme, ae, K, PAL, SINE, OUT, IN, F, key, artboard, timeline, wire, argb } = fx;
const focus = (ab) => call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ab } } });
async function board(k, name, w, h) { const ab = ids[k]?.ab || await artboard(name, w, h); ids[k] = ids[k] || { ab, anims: {} }; save(); await focus(ab); return ab; }
async function group(name, parentId, x, y) { const r = await call('group_editor', { name, parentId }); await call('set_property_values', { propertyValues: { [r.group.id]: { [K.x]: x, [K.y]: y } } }); return r.group.id; }
async function tree(abId) { const h = await call('get_artboard_hierarchy', { artboardId: abId, depth: 6 }); const by = {}; for (const o of h.objects) by[o.id] = o; return by; }
const paintOf = (by, shapeId) => by[shapeId].children.map(c => by[c]).find(o => o.types.includes('Fill') || o.types.includes('Stroke'));
const colorOf = (by, shapeId) => { const p = paintOf(by, shapeId); return p.children.map(c => by[c]).find(o => o.types.includes('SolidColor')).id; };

async function voice() {
  const ab = await board('voice', 'FX Voice', 200, 200), S = ids.voice;
  if (!S.rings) {
    S.group = await group('rings', ab, 100, 100);
    const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [0, 1, 2].map(i => ({ primitive: 'ellipse', name: 'ring' + i, parentId: S.group, x: 0, y: 0, width: 76, height: 76, paints: [{ paintType: 'stroke', color: argb(PAL.coral) }] })) } } });
    S.rings = r.shapes.map(x => x.id);
    S.checkGroup = await group('check', ab, 100, 100);
    await call('path_editor', { command: 'createShapes', data: { createShapes: { shapes: [{ name: 'checkMark', parentId: S.checkGroup, x: 0, y: 0, paints: [{ paintType: 'stroke', color: argb(PAL.green) }],
      paths: [{ name: 'checkPath', commands: [{ commandType: 'moveTo', x: -15, y: 1 }, { commandType: 'lineTo', x: -4, y: 12 }, { commandType: 'lineTo', x: 16, y: -11 }] }] }] } } });
    const by = await tree(ab);
    const check = Object.values(by).find(o => o.name === 'checkMark' && o.types.includes('Shape'));
    S.check = check.id; S.checkPath = check.children.map(c => by[c]).find(o => o.types.includes('PointsPath')).id; S.checkStroke = paintOf(by, check.id).id;
    const pv = { [S.checkPath]: { 32: false }, [S.checkStroke]: { 47: 8, 48: 1, 49: 1 }, [S.checkGroup]: { [K.op]: 0 } };
    S.rings.forEach((id, i) => { pv[paintOf(by, id).id] = { 47: 4 - i, 48: 1 }; pv[id] = { [K.op]: [70, 42, 22][i] }; });
    await call('set_property_values', { propertyValues: pv });
    await call('path_editor', { command: 'addTrimPaths', data: { addTrimPaths: { paintIds: [S.checkStroke], start: 0, end: 100 } } });
    const by2 = await tree(ab);
    S.trim = by2[S.checkStroke].children.map(c => by2[c]).find(o => o.types.some(t => /Trim/.test(t))).id;
    S.trimKeys = (await call('query_property_keys', { objectIds: [S.trim], animates: true })).properties[S.trim];
    save();
  }
  await focus(ab);
  const END = S.trimKeys.trimEnd, G = S.group, C = S.checkGroup;
  await timeline(S.anims, 'idle', 6, [key(G, K.sx, 0, 100, 'hold'), key(G, K.sy, 0, 100, 'hold'), key(G, K.op, 0, 100, 'hold'), key(C, K.op, 0, 0, 'hold'), key(S.trim, END, 0, 0, 'hold'), key(C, K.sx, 0, 100, 'hold'), key(C, K.sy, 0, 100, 'hold')]);
  await timeline(S.anims, 'heard', 76, [
    key(G, K.sx, 0, 100, IN), key(G, K.sx, 10, 55, 'hold'), key(G, K.sy, 0, 100, IN), key(G, K.sy, 10, 55, 'hold'), key(G, K.op, 0, 100, 'linear'), key(G, K.op, 10, 0, 'hold'),
    key(C, K.op, 0, 0, 'hold'), key(C, K.op, 5, 100, 'hold'), key(C, K.op, 62, 100, 'linear'), key(C, K.op, 74, 0, 'hold'),
    key(S.trim, END, 0, 0, 'hold'), key(S.trim, END, 5, 0, OUT), key(S.trim, END, 18, 100, 'hold'),
    key(C, K.sx, 0, 100, 'hold'), key(C, K.sx, 16, 100, OUT), key(C, K.sx, 21, 120, SINE), key(C, K.sx, 28, 100, 'hold'),
    key(C, K.sy, 0, 100, 'hold'), key(C, K.sy, 16, 100, OUT), key(C, K.sy, 21, 120, SINE), key(C, K.sy, 28, 100, 'hold')]);
  save();
  const { vm, prop } = await wire(ab, 'FXVoice', { heard: ['heard'] }, [{ name: 'amp', propertyType: 'number' }]);
  if (!S.bound) {
    const mk = async (name, formula) => (await vme('createConverters', { converters: [{ converterType: 'formula', name, formula }] })).converters[0].id;
    const conv = [await mk('voice ring 1', '1 + {Input} * 0.0045'), await mk('voice ring 2', '1 + {Input} * 0.009'), await mk('voice ring 3', '1 + {Input} * 0.0135')];
    await vme('databind', { viewModelId: vm.id, bindings: S.rings.flatMap((id, i) => [K.sx, K.sy].map(pk => ({ objectId: id, propertyKey: pk, viewModelPropertyId: prop('amp'), converterId: conv[i] }))) });
    S.bound = true; save();
  }
  console.log('voice ready');
}

async function flame() {
  const ab = await board('flame', 'Streak Flame', 96, 96), S = ids.flame;
  if (!S.outer) {
    S.root = await group('flame', ab, 48, 88);                        // pivot at the base
    S.outerG = await group('outer', S.root, 0, 0); S.innerG = await group('inner', S.root, 0, 0);
    const P = (parentId, name, color, cmds) => ({ name, parentId, x: 0, y: 0, paints: [{ paintType: 'fill', color: argb(color) }], paths: [{ name: name + 'Path', commands: [...cmds, { commandType: 'close' }] }] });
    const c = (a, b, c2, d, e, f) => ({ commandType: 'cubicTo', control1X: a, control1Y: b, control2X: c2, control2Y: d, endX: e, endY: f });
    // coordinates relative to the base (48,88) of a 96 box
    await call('path_editor', { command: 'createShapes', data: { createShapes: { shapes: [
      P(S.outerG, 'flameOuter', PAL.orange, [{ commandType: 'moveTo', x: 1, y: -80 }, c(15, -64, 30, -48, 30, -28), c(30, -11, 17, 0, 0, 0), c(-17, 0, -30, -11, -30, -28), c(-30, -40, -22, -49, -15, -57), c(-13, -50, -8, -47, -5, -50), c(-3, -60, -3, -70, 1, -80)]),
      P(S.innerG, 'flameInner', PAL.gold, [{ commandType: 'moveTo', x: 1, y: -42 }, c(9, -34, 15, -27, 15, -18), c(15, -8, 9, -3, 0, -3), c(-9, -3, -15, -8, -15, -18), c(-15, -27, -7, -34, 1, -42)]),
    ] } } });
    const by = await tree(ab);
    const find = (n) => Object.values(by).find(o => o.name === n && o.types.includes('Shape')).id;
    S.outer = find('flameOuter'); S.inner = find('flameInner'); S.outerColor = colorOf(by, S.outer); S.innerColor = colorOf(by, S.inner);
    save();
  }
  await focus(ab);
  const { root: R, outerG: O, innerG: I } = S, col = (outer, inner) => [key(S.outerColor, K.color, 0, argb(outer), 'hold'), key(S.innerColor, K.color, 0, argb(inner), 'hold')];
  const still = (f) => [[R, K.sx], [R, K.sy], [O, K.sx], [O, K.sy], [I, K.sx], [I, K.sy]].flatMap(([o, p]) => [key(o, p, 0, 100, 'hold'), ...(f ? [key(o, p, f, 100, 'hold')] : [])]);
  await timeline(S.anims, 'idle', 6, [...col('#E5E5E5', '#F4F4F4'), ...still(0), key(O, K.r, 0, 0, 'hold'), key(I, K.r, 0, 0, 'hold'), key(R, K.r, 0, 0, 'hold')]);   // idle = off (grey)
  // on: 1.3 s flicker, outer and inner out of phase
  const flick = (o, list, p) => list.map(([f, v]) => key(o, p, f, v, SINE));
  await timeline(S.anims, 'on', 78, [...col(PAL.orange, PAL.gold),
    ...flick(O, [[0, 100], [20, 106], [39, 98], [58, 104], [78, 100]], K.sy), ...flick(O, [[0, 100], [20, 96], [39, 102], [58, 97], [78, 100]], K.sx),
    ...flick(O, [[0, 0], [26, 2.5], [52, -2], [78, 0]], K.r),
    ...flick(I, [[0, 100], [13, 94], [30, 110], [50, 96], [66, 106], [78, 100]], K.sy), ...flick(I, [[0, 100], [30, 94], [66, 97], [78, 100]], K.sx), ...flick(I, [[0, 0], [20, -3], [46, 3], [78, 0]], K.r),
    key(R, K.sx, 0, 100, 'hold'), key(R, K.sy, 0, 100, 'hold'), key(R, K.r, 0, 0, 'hold')]);
  await call('set_property_values', { propertyValues: { [S.anims.on]: { 59: 1 } } });   // loop
  // ignite: squash down, shoot up big, settle
  await timeline(S.anims, 'ignite', 34, [...col(PAL.orange, PAL.gold),
    key(R, K.sy, 0, 70, OUT), key(R, K.sy, 9, 138, SINE), key(R, K.sy, 17, 92, SINE), key(R, K.sy, 25, 104, SINE), key(R, K.sy, 34, 100, 'hold'),
    key(R, K.sx, 0, 118, OUT), key(R, K.sx, 9, 86, SINE), key(R, K.sx, 17, 106, SINE), key(R, K.sx, 25, 98, SINE), key(R, K.sx, 34, 100, 'hold'), key(R, K.r, 0, 0, 'hold'),
    ...[[O, K.sx], [O, K.sy], [I, K.sx], [I, K.sy]].map(([o, p]) => key(o, p, 0, 100, 'hold')), key(O, K.r, 0, 0, 'hold'), key(I, K.r, 0, 0, 'hold')]);
  save();
  // wiring: idle(off) <-> on by `lit`; Any -> ignite on trigger; ignite -> on
  const { prop } = await wire(ab, 'StreakFlame', { ignite: ['ignite'] }, [{ name: 'lit', propertyType: 'boolean' }]);
  if (!S.wired) {
    let sm = await ae('queryStateMachine', {}); let L = sm.layers[0];
    if (!L.states.some(s => s.name === 'on')) await ae('createStates', { layerId: L.layerId, states: [{ name: 'on', x: 420, y: -140, linearAnimationName: 'on' }] });
    sm = await ae('queryStateMachine', {}); L = sm.layers[0];
    const id = (n) => L.states.find(s => s.name === n).id;
    const toIdle = L.transitions.find(t => t.fromStateId === id('ignite') && t.toStateId === id('idle'));
    if (toIdle) await call('set_property_values', { propertyValues: { [toIdle.id]: { 151: id('on') } } });    // ignite -> on (not idle)
    await ae('createTransitions', { states: [{ id: id('idle'), transitions: [{ to: id('on') }] }, { id: id('on'), transitions: [{ to: id('idle') }] }] });
    sm = await ae('queryStateMachine', {}); L = sm.layers[0];
    const pv = {}, conds = [];
    for (const t of L.transitions) {
      const a = L.states.find(s => s.id === t.fromStateId), b = L.states.find(s => s.id === t.toStateId);
      if (a.name === 'idle' && b.name === 'on') { pv[t.id] = { 152: F.enableEarlyExit, 158: 220, 349: 2 }; conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('lit') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: true } }] }); }
      if (a.name === 'on' && b.name === 'idle') { pv[t.id] = { 152: F.enableEarlyExit, 158: 300, 349: 2 }; conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('lit') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: false } }] }); }
    }
    await call('set_property_values', { propertyValues: pv }); await ae('createConditions', { transitions: conds });
    S.wired = true; save();
  }
  console.log('flame ready');
}

(async () => {
  const what = process.argv[2] || 'all';
  if (what === 'voice' || what === 'all') await voice();
  if (what === 'flame' || what === 'all') await flame();
})().catch(e => { console.log('FAIL', String(e.stack).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exit(1); });
