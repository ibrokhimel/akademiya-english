// Dombi engine, stage 13: full-app extras.
//  - PlayOnce: + trigger `grow` (pet growth: swells, holds, settles) and `dress` (quick hop-turn when an outfit changes)
//  - hat slot (group `hat` on top of his head, squashes with the body) + first outfit: an Uzbek doppi.
//    Layer Outfit: enum `hat` = none | doppi (drops on with a small squash; shrinks away)
//  - dark mode: bool `dark`. Layer Theme recolours body / edge / hands / Z's so he reads on a dark screen.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18, color: 37 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const save = () => { fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1)); fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1)); };
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();
const key = (objectId, propertyKey, frame, value, c = SINE) => c === 'hold' ? { objectId, propertyKey, frame, value, interpolationType: 'hold' } : { objectId, propertyKey, frame, value, interpolationType: 'cubic', cubicParams: c };
const T = (o, p, list) => list.map(([f, v, c]) => key(o, p, f, v, c));
async function anim(name, frames, keys, loop = 0) {
  if (!mids.anims[name]) { const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] }); mids.anims[name] = (r.animations || r.linearAnimations)[0].id; }
  else { const q = await ae('queryKeyFrames', { animationIds: [mids.anims[name]] }); const old = (q.keyframes[mids.anims[name]] || []).map(x => x.keyframeId); if (old.length) await ae('modifyKeyFrames', { animationId: mids.anims[name], delete: old }); }
  await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: loop } } });
  if (keys.length) await ae('modifyKeyFrames', { animationId: mids.anims[name], add: keys });
}
const cond = (id, op, value) => ({ leftComparator: { viewModelPropertyId: id }, ...(op ? { comparationOperation: op, rightComparator: { valueType: 'constantValueType', value } } : {}) });

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  // ---------- hat ----------
  if (!ids.hat) {
    const r = await call('group_editor', { name: 'hat', parentId: ids.squash }); ids.hat = r.group.id;
    await call('set_property_values', { propertyValues: { [ids.hat]: { [K.x]: 0, [K.y]: -132, [K.sx]: 0, [K.sy]: 0 } } });
    const rect = (name, x, y, w, h, rad, color, rot) => ({ primitive: 'rectangle', name, parentId: ids.hat, x, y, width: w, height: h, cornerRadius: rad, paints: [{ paintType: 'fill', color: argb(color) }] });
    const s = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
      rect('doppiCap', 0, -2, 78, 36, 12, '#0E0E16'), rect('doppiBand', 0, 13, 78, 4, 2, '#FFFFFF'),
      rect('doppiOrn1', -23, -3, 9, 9, 2.5, '#FFFFFF'), rect('doppiOrn2', 0, -6, 10, 10, 2.5, '#FFFFFF'), rect('doppiOrn3', 23, -3, 9, 9, 2.5, '#FFFFFF')] } } });
    ids.hatShapes = s.shapes.map(x => x.id);
    await call('set_property_values', { propertyValues: Object.fromEntries(ids.hatShapes.slice(2).map(id => [id, { [K.r]: 45 }])) });
    await call('reorder_objects', { operations: [{ objectId: ids.hat, order: 'sendToFront' }] });
    save();
  }
  // ---------- colours for the theme ----------
  if (!ids.theme) {
    // the rig is 16 levels deep now, so ask for each shape directly instead of the (depth-limited) hierarchy
    const cache = {};
    const colorOfAsync = async (shapeId) => { const r = await call('query_objects', { objectIds: [shapeId], depth: 3 }); const f = r.objects.find(o => o.types.includes('Fill')); return f.children[0]; };
    const sid = (x) => typeof x === 'string' ? x : x.id;
    const all = async (list) => { const out = []; for (const x of list) out.push(await colorOfAsync(sid(x))); return out; };
    ids.theme = { edge: await all([ids.bodyShapes[0], ids.handLShapes[0], ids.handRShapes[0], ids.handRFrontShapes[0]]), body: await all([ids.bodyShapes[1]]),
      hand: await all([ids.handLShapes[1], ids.handRShapes[1], ids.handRFrontShapes[1], ...ids.z1Shapes, ...ids.z2Shapes]), lids: await all([ids.eyeShapes[2], ids.eyeShapes[3]]) };
    save();
  }
  // ---------- view model ----------
  let vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  if (!vm.viewModelProperties.some(p => p.name === 'hat')) {
    await vme('createDataEnums', { dataEnums: [{ name: 'DombiHat', values: ['none', 'doppi'] }] });
    const r = await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: [{ name: 'hat', propertyType: 'enum', enumName: 'DombiHat' }, { name: 'dark', propertyType: 'boolean' }, { name: 'grow', propertyType: 'trigger' }, { name: 'dress', propertyType: 'trigger' }] }] });
    vm = r.viewModels.find(v => v.name === 'Dombi');
  }
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;

  // ---------- timelines ----------
  const O = ids.once, S = ids.shades, E = ids.eyes, Hh = ids.hat;
  const o = (spec) => ['x', 'y', 'r', 'sx', 'sy'].flatMap(p => T(O, K[p], spec[p] || [[0, p[0] === 's' ? 100 : 0, 'hold']])).concat([key(S, K.op, 0, 0, 'hold'), key(S, K.y, 0, -9, 'hold')]);
  await anim('once/grow', 44, [...o({ sx: [[0, 100, IN], [6, 93, OUT], [16, 124], [26, 122, IN], [34, 97, SINE], [40, 101], [44, 100]], sy: [[0, 100, IN], [6, 93, OUT], [16, 124], [26, 122, IN], [34, 97, SINE], [40, 101], [44, 100]] }),
    ...T(E, K.sy, [[0, 100, OUT], [6, 114], [26, 114], [36, 100], [44, 100]])]);
  await anim('once/dress', 30, [...o({ y: [[0, 0, OUT], [8, -12, IN], [16, 0], [30, 0]], sx: [[0, 100, IN], [5, 20, OUT], [10, 100], [16, 108], [22, 97], [30, 100]], sy: [[0, 100], [16, 94], [22, 103], [30, 100]] })]);
  await anim('outfit/none', 6, [key(Hh, K.sx, 0, 0, 'hold'), key(Hh, K.sy, 0, 0, 'hold'), key(Hh, K.y, 0, -123, 'hold'), key(Hh, K.r, 0, 0, 'hold')]);
  await anim('outfit/doppi', 22, [...T(Hh, K.y, [[0, -168, IN], [8, -119, OUT], [14, -125], [22, -123]]), ...T(Hh, K.sy, [[0, 100], [8, 100, OUT], [11, 82], [17, 104], [22, 100]]), ...T(Hh, K.sx, [[0, 100], [8, 100, OUT], [11, 110], [17, 98], [22, 100]]),
    ...T(Hh, K.r, [[0, -10], [8, 0], [22, 0]])]);
  const cols = (m) => [...ids.theme.edge.map(c => key(c, K.color, 0, argb(m.edge), 'hold')), ...ids.theme.body.map(c => key(c, K.color, 0, argb(m.body), 'hold')), ...ids.theme.hand.map(c => key(c, K.color, 0, argb(m.hand), 'hold')), ...ids.theme.lids.map(c => key(c, K.color, 0, argb(m.body), 'hold'))];
  await anim('theme/light', 6, cols({ body: '#2B2B3C', edge: '#17171F', hand: '#45455A' }));
  await anim('theme/dark', 6, cols({ body: '#5A5A7A', edge: '#3A3A54', hand: '#8686A8' }));
  save();

  // ---------- layers ----------
  let sm = await ae('queryStateMachine', {});
  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  const have = (n) => sm.layers.some(l => l.layerName === n);
  const add = [];
  if (!have('Outfit')) add.push({ name: 'Outfit', states: [st('outfit/none', 220, 0), st('outfit/doppi', 440, 0)], otherTransitions: [{ from: '{Entry State}', to: 'outfit/none' }, { from: '{Any State}', to: 'outfit/none' }, { from: '{Any State}', to: 'outfit/doppi' }] });
  if (!have('Theme')) add.push({ name: 'Theme', states: [st('theme/light', 220, 0), st('theme/dark', 440, 0)], otherTransitions: [{ from: '{Entry State}', to: 'theme/light' }, { from: 'theme/light', to: 'theme/dark' }, { from: 'theme/dark', to: 'theme/light' }] });
  if (add.length) await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: add });
  sm = await ae('queryStateMachine', {});
  let PO = sm.layers.find(l => l.layerName === 'PlayOnce');
  const missing = ['once/grow', 'once/dress'].filter(n => !PO.states.some(s => s.name === n));
  if (missing.length) {
    await ae('createStates', { layerId: PO.layerId, states: missing.map((n, i) => st(n, 440 + i * 190, 400)) });
    sm = await ae('queryStateMachine', {}); PO = sm.layers.find(l => l.layerName === 'PlayOnce');
    const id = (n) => PO.states.find(s => s.name === n).id;
    await ae('createTransitions', { states: [{ id: PO.anyStateId, transitions: missing.map(n => ({ to: id(n) })) }, ...missing.map(n => ({ id: id(n), transitions: [{ to: id('once/idle') }] }))] });
    sm = await ae('queryStateMachine', {});
  }
  const pv = {}, conds = [];
  for (const L of sm.layers.filter(l => ['Outfit', 'Theme', 'PlayOnce'].includes(l.layerName))) {
    const nm = {}; for (const s of L.states) nm[s.id] = s.name || s.type;
    for (const t of L.transitions) {
      const from = nm[t.fromStateId], to = nm[t.toStateId]; if (from === 'entry') continue;
      if (L.layerName === 'Outfit') { pv[t.id] = { 152: F.enableEarlyExit, 158: to === 'outfit/none' ? 150 : 0, 349: 2 }; if (!t.conditions.length) conds.push({ id: t.id, conditions: [cond(prop('hat'), 'equal', to.slice(7))] }); }
      else if (L.layerName === 'Theme') { pv[t.id] = { 152: F.enableEarlyExit, 158: 250, 349: 2 }; if (!t.conditions.length) conds.push({ id: t.id, conditions: [cond(prop('dark'), 'equal', to === 'theme/dark')] }); }
      else if (['once/grow', 'once/dress'].includes(to)) { pv[t.id] = { 152: F.enableEarlyExit, 158: 40, 349: 2 }; if (!t.conditions.length) conds.push({ id: t.id, conditions: [cond(prop(to.slice(5)))] }); }
      else if (['once/grow', 'once/dress'].includes(from)) pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 120, 349: 2 };
    }
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('dombi extras ready ·', conds.length, 'conditions · layers:', sm.layers.map(l => l.layerName).join(', '));
}
main().catch(e => { console.log('FAIL', String(e.stack).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exit(1); });
