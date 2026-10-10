// Dombi engine, stage 9: rig groups for the remaining animations + correct / wrong reactions.
// New groups (all identity, each owned by ONE layer):
//   stage (artboard -> stage -> root, z1, z2; origin at the feet)  : Presence layer (enter / exit)
//   react (act -> react -> lean)                                    : Reactions layer (correct / wrong body motion)
//   look  (face -> look -> eyes)                                    : data-bound to lookX / lookY
// Reactions layer (after Hands/Face in the list, so it overrides them while a reaction plays, then releases):
//   react/idle (keys nothing) · react/correct (1.2 s) · react/wrong (0.9 s); Any -> correct|wrong on the VM triggers.
// Beats: skill rive-animation §3 (correct: eyes snap wide -> dip -> pop -> 80 ms hold -> hand out -> settle;
//        wrong: quick blink, 4° tilt, flat "hm" mouth, back in < 0.9 s; no sad face, no shake).
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { shapeOf } = require('../icons/mouth_geo');
const { polar, VK } = require('./dombi_mouth');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const save = () => { fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1)); fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1)); };
const k = (part, p, frame, value, c = SINE) => ({ objectId: ids[part], propertyKey: K[p], frame, value, interpolationType: 'cubic', cubicParams: c });
const track = (part, p, list) => list.map(([f, v, c]) => k(part, p, f, v, c));

const FACE = { x: 100, y: 104 };
const local = (v) => ({ p: [v.p[0] - FACE.x, v.p[1] - FACE.y], in: [v.in[0] - FACE.x, v.in[1] - FACE.y], out: [v.out[0] - FACE.x, v.out[1] - FACE.y] });
const REF = shapeOf(MOUTHS.smirk).map(local).map(v => polar(v));
const mouthKeys = (m, frame = 0) => shapeOf(m).map(local).flatMap((v, i) => { const pv = polar(v, REF[i]);
  return Object.entries(VK).map(([kk, pk]) => ({ objectId: ids.mouthShape.verts[i], propertyKey: pk, frame, value: +pv[kk].toFixed(3), interpolationType: 'hold' })); });

async function group(name, parentId, x = 0, y = 0) {
  const r = await call('group_editor', { name, parentId });
  await call('set_property_values', { propertyValues: { [r.group.id]: { [K.x]: x, [K.y]: y } } });
  return r.group.id;
}
async function anim(name, frames, add, loop = 0) {
  if (!mids.anims[name]) { const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] }); mids.anims[name] = (r.animations || r.linearAnimations)[0].id; }
  await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: loop } } });
  for (let i = 0; i < add.length; i += 150) await ae('modifyKeyFrames', { animationId: mids.anims[name], add: add.slice(i, i + 150) });
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---------- rig ----------
  if (!ids.react) {
    ids.react = await group('react', ids.act);
    await call('reparent_objects', { operations: [{ objectId: ids.lean, newParentId: ids.react }] });
  }
  if (!ids.look) {
    ids.look = await group('look', ids.face);
    await call('reparent_objects', { operations: [{ objectId: ids.eyes, newParentId: ids.look }] });
    await call('reorder_objects', { operations: [{ objectId: ids.look, order: 'sendToBack' }] });   // eyes stay behind the mouth, as before
    await call('set_property_values', { propertyValues: { [ids.eyes]: { [K.x]: 0, [K.y]: -9 } } });
  }
  if (!ids.stage) {
    ids.stage = await group('stage', ids.artboard, 130, 200);
    for (const c of [ids.z2, ids.z1, ids.root]) await call('reparent_objects', { operations: [{ objectId: c, newParentId: ids.stage, position: 'end' }] });
    await call('set_property_values', { propertyValues: { [ids.root]: { [K.x]: 0, [K.y]: 0 }, [ids.z1]: { [K.x]: 60, [K.y]: -118 }, [ids.z2]: { [K.x]: 78, [K.y]: -140 } } });
  }
  save();

  // ---------- view model: extra controls ----------
  let vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  const want = [['looking', 'boolean'], ['hidden', 'boolean'], ['blink', 'trigger'], ['tapped', 'trigger']];
  const missing = want.filter(([n]) => !vm.viewModelProperties.some(p => p.name === n));
  if (missing.length) {
    await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: missing.map(([name, propertyType]) => ({ name, propertyType })) }] });
    vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  }
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;

  // ---------- timelines ----------
  await anim('react/idle', 6, []);
  await anim('react/correct', 72, [
    // body: dip (80 ms) -> pop (100 ms) -> hold 80 ms -> settle
    ...track('react', 'sy', [[0, 100], [5, 94, OUT], [11, 106], [16, 106, IN], [22, 98], [28, 101], [34, 100], [72, 100]]),
    ...track('react', 'sx', [[0, 100], [5, 106, OUT], [11, 95], [16, 95, IN], [22, 102], [28, 99.5], [34, 100], [72, 100]]),
    ...track('react', 'y', [[0, 0], [5, 0, OUT], [11, -6], [16, -6, IN], [22, 0], [72, 0]]),
    ...track('react', 'r', [[0, 0], [72, 0]]), ...track('react', 'x', [[0, 0], [72, 0]]),
    // eyes lead: snap wide in 50 ms, relax after the hold
    ...track('eyes', 'sy', [[0, 100, OUT], [3, 108], [16, 108], [30, 100], [72, 100]]),
    ...track('eyes', 'sx', [[0, 100, OUT], [3, 104], [16, 104], [30, 100], [72, 100]]),
    // one hand, late: out from behind with a small overshoot, hold, tuck away
    ...track('handR', 'x', [[0, 0], [16, 0, OUT], [23, 47], [27, 44], [56, 44, IN], [70, 0], [72, 0]]),
    ...track('handR', 'y', [[0, 0], [16, 0, OUT], [23, -45], [27, -40], [56, -40, IN], [70, 0], [72, 0]]),
    ...track('armR', 'r', [[0, 0], [27, 0], [33, -8], [40, 4], [46, 0], [72, 0]]),          // one small "nice" shake
    ...mouthKeys(MOUTHS.happy),
  ]);
  await anim('react/wrong', 54, [
    // quick blink first (eyes lead), then a small tilt + sink, "hm" mouth, ease back
    ...track('eyes', 'sy', [[0, 100, IN], [4, 10], [6, 10, OUT], [13, 100], [54, 100]]),
    ...track('eyes', 'sx', [[0, 100, IN], [4, 107], [6, 107, OUT], [13, 100], [54, 100]]),
    ...track('react', 'r', [[0, 0], [3, 0, OUT], [12, 4], [34, 4], [54, 0]]),
    ...track('react', 'sy', [[0, 100], [3, 100, OUT], [12, 97], [34, 97], [54, 100]]),
    ...track('react', 'sx', [[0, 100], [3, 100, OUT], [12, 103], [34, 103], [54, 100]]),
    ...track('react', 'y', [[0, 0], [54, 0]]), ...track('react', 'x', [[0, 0], [54, 0]]),
    ...mouthKeys(MOUTHS.focus),
  ]);
  save();

  // ---------- layer ----------
  let sm = await ae('queryStateMachine', {});
  if (!sm.layers.some(l => l.layerName === 'Reactions')) {
    const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [{ name: 'Reactions',
      states: [st('react/idle', 200, 0), st('react/correct', 440, -60), st('react/wrong', 440, 60)],
      otherTransitions: [{ from: '{Entry State}', to: 'react/idle' }, { from: '{Any State}', to: 'react/correct' }, { from: '{Any State}', to: 'react/wrong' },
        { from: 'react/correct', to: 'react/idle' }, { from: 'react/wrong', to: 'react/idle' }] }] });
    sm = await ae('queryStateMachine', {});
  }
  const L = sm.layers.find(l => l.layerName === 'Reactions');
  const name = {}; for (const s of L.states) name[s.id] = s.name || s.type;
  const pv = {}, conds = [];
  for (const t of L.transitions) {
    const from = name[t.fromStateId], to = name[t.toStateId];
    if (from === 'entry') continue;
    if (to === 'react/idle') pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: from === 'react/wrong' ? 250 : 200, 349: 2 };
    else { pv[t.id] = { 152: F.enableEarlyExit, 158: 60, 349: 2 };
      if (!t.conditions.length) conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop(to.slice(6)) } }] }); }
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('reactions ready ·', conds.length, 'trigger conditions · groups:', ['stage', 'react', 'look'].map(g => g + '=' + ids[g]).join(' '));
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
