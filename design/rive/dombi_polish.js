// Dombi engine, stage 11: mood entrance accents, enter/exit, motivated blinks, tap reaction.
//  A. face/<mood> timelines get a short accent on top of the 150 ms blend (eyes squash/pop, lids drop from above,
//     head tilt overshoot, Z's popping in). Only Face-owned properties, frame-0 values unchanged.
//  B. Presence layer on `stage`: VM `hidden` true -> exit (squash, drop, fade) -> hidden; false -> enter (pop up from
//     below with a stretch + landing squash). Entry picks shown/hidden from `hidden`.
//  C. Blinks with a reason: VM trigger `blink` (Eyes layer, Any -> blink); a listener fires it on every `mood` change;
//     the three big random glances (up-left, up-right, down-left) blink as the eyes land.
//  D. Tap: clicking his body fires VM trigger `tapped` -> react/tap (quick squash-pop + wide eyes).
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { pose } = require('../icons/dombi_rig');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18, h: 21 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const save = () => fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1));
const key = (objectId, propertyKey, frame, value, c = SINE) => ({ objectId, propertyKey, frame, value, interpolationType: 'cubic', cubicParams: c });
const trk = (objectId, propertyKey, list) => list.map(([f, v, c]) => key(objectId, propertyKey, f, v, c));
const [eL, eR, lL, lR] = ids.eyeShapes;

// ---------- A. accents: mood -> [frames, (P) => [[objectId, propKey, [[frame, value, curve?]...]]...]] ----------
const eyesH = (P, f) => [[eL.pathId, K.h, f(P.eyeL.h)], [eR.pathId, K.h, f(P.eyeR.h).map(([fr, v, c]) => [fr + 1, v, c]).map((x, i) => i === 0 ? [0, x[1], x[2]] : x)]];   // right eye 1 frame late
const faceY = (list) => [[ids.face, K.y, list.map(([f, d, c]) => [f, -66 + d, c])]];
const faceR = (list) => [[ids.face, K.r, list]];
const lidsY = (P, list) => [[lL.id, K.y, list.map(([f, d, c]) => [f, P.lidL.cy - 95 + d, c])], [lR.id, K.y, list.map(([f, d, c]) => [f, P.lidR.cy - 95 + d, c])]];
const ACCENT = {
  happy: [15, (P) => [...eyesH(P, h => [[0, h], [4, h * 0.78], [10, h * 1.06], [14, h]]), ...faceY([[0, 0], [4, 1.5], [10, -1], [14, 0]])]],
  laugh: [30, (P) => [...eyesH(P, h => [[0, h], [4, h * 0.65], [9, h]]), ...faceY([[0, 0], [5, -2.5], [10, 0], [15, -2], [20, 0], [30, 0]])]],
  surprised: [18, (P) => [...eyesH(P, h => [[0, h, OUT], [4, h * 1.17], [11, h * 0.98], [16, h]]), ...faceY([[0, 0, OUT], [4, -3], [12, 0]])]],
  think: [18, (P) => [[eL.id, K.y, [[0, P.eyeL.cy - 95], [6, P.eyeL.cy - 97.5], [14, P.eyeL.cy - 95]]], [eR.id, K.y, [[0, P.eyeR.cy - 95], [7, P.eyeR.cy - 97.5], [15, P.eyeR.cy - 95]]]]],
  focus: [15, (P) => lidsY(P, [[0, -8, OUT], [7, 1.5], [11, 0]])],          // lids drop in from above
  proud: [15, (P) => lidsY(P, [[0, -9, OUT], [7, 1.5], [11, 0]])],
  wink: [15, () => faceR([[0, 0], [5, 3.5], [13, 0]])],
  sleepy: [40, (P) => [[ids.z1, K.sx, [[0, 0], [10, 0, OUT], [17, 115], [22, 100]]], [ids.z1, K.sy, [[0, 0], [10, 0, OUT], [17, 115], [22, 100]]],
                       [ids.z2, K.sx, [[0, 0], [18, 0, OUT], [25, 82], [30, 70]]], [ids.z2, K.sy, [[0, 0], [18, 0, OUT], [25, 82], [30, 70]]]]],
  confused: [18, (P) => faceR([[0, P.face.rot], [5, P.face.rot - 4], [13, P.face.rot]])],
  oops: [18, (P) => faceR([[0, P.face.rot], [3, P.face.rot - 5], [7, P.face.rot + 2], [12, P.face.rot]])],
  listen: [15, (P) => faceR([[0, P.face.rot], [6, P.face.rot + 3], [13, P.face.rot]])],
};

async function anim(name, frames, add, loop = 0) {
  if (!mids.anims[name]) { const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] }); mids.anims[name] = (r.animations || r.linearAnimations)[0].id; }
  await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: loop } } });
  if (add.length) await ae('modifyKeyFrames', { animationId: mids.anims[name], add });
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;
  const cond = (p, op, value) => ({ leftComparator: { viewModelPropertyId: prop(p) }, comparationOperation: op, rightComparator: { valueType: 'constantValueType', value } });
  const trig = (p) => ({ leftComparator: { viewModelPropertyId: prop(p) } });

  // ---------- A ----------
  const faceIds = Object.keys(ACCENT).map(m => mids.anims['face/' + m]);
  const q = await ae('queryKeyFrames', { animationIds: faceIds });
  for (const [mood, [frames, fn]] of Object.entries(ACCENT)) {
    const id = mids.anims['face/' + mood], tracks = fn(pose(mood));
    const hit = new Set(tracks.map(([o, p]) => `${o}|${p}`));
    const old = (q.keyframes[id] || []).filter(x => hit.has(`${x.objectId}|${x.propertyKey}`)).map(x => x.keyframeId);
    if (old.length) await ae('modifyKeyFrames', { animationId: id, delete: old });
    await call('set_property_values', { propertyValues: { [id]: { 57: frames } } });
    await ae('modifyKeyFrames', { animationId: id, add: tracks.flatMap(([o, p, list]) => trk(o, p, list)) });
  }

  // ---------- C (timelines): blink on the big glances ----------
  const blink = [[0, 100, IN], [4, 10], [6, 10, OUT], [13, 100]], blinkX = [[0, 100, IN], [4, 107], [6, 107, OUT], [13, 100]];
  const gq = await ae('queryKeyFrames', { animationIds: ['up-left', 'up-right', 'down-left'].map(n => mids.anims['gaze/' + n]) });
  for (const n of ['up-left', 'up-right', 'down-left']) {
    const id = mids.anims['gaze/' + n];
    if ((gq.keyframes[id] || []).some(x => x.objectId === ids.eyes && x.propertyKey === K.sy)) continue;
    const len = (await call('query_property_values', { propertyKeys: { [id]: [57] } })).values[id][57];
    await ae('modifyKeyFrames', { animationId: id, add: [...trk(ids.eyes, K.sy, [...blink, [len, 100]]), ...trk(ids.eyes, K.sx, [...blinkX, [len, 100]])] });
  }

  // ---------- B + D timelines ----------
  const S = ids.stage;
  await anim('present/shown', 6, []);
  await anim('present/hidden', 6, [key(S, K.op, 0, 0), key(S, K.sx, 0, 60), key(S, K.sy, 0, 60), key(S, K.y, 0, 235)]);
  await anim('present/enter', 30, [
    ...trk(S, K.op, [[0, 0], [4, 100], [30, 100]]),
    ...trk(S, K.y, [[0, 235, OUT], [12, 194], [18, 200], [30, 200]]),
    ...trk(S, K.sy, [[0, 60, OUT], [12, 108], [18, 95], [24, 101.5], [30, 100]]),
    ...trk(S, K.sx, [[0, 60, OUT], [12, 94], [18, 105], [24, 99], [30, 100]])]);
  await anim('present/exit', 18, [
    ...trk(S, K.sy, [[0, 100], [5, 92, IN], [16, 60], [18, 60]]), ...trk(S, K.sx, [[0, 100], [5, 108, IN], [16, 60], [18, 60]]),
    ...trk(S, K.y, [[0, 200], [5, 200, IN], [16, 235], [18, 235]]), ...trk(S, K.op, [[0, 100], [9, 100], [16, 0], [18, 0]])]);
  const R = ids.react;
  await anim('react/tap', 36, [
    ...trk(R, K.sy, [[0, 100], [4, 92, OUT], [10, 105], [16, 98], [22, 100], [36, 100]]), ...trk(R, K.sx, [[0, 100], [4, 108, OUT], [10, 96], [16, 102], [22, 100], [36, 100]]),
    ...trk(R, K.y, [[0, 0], [36, 0]]), ...trk(R, K.x, [[0, 0], [36, 0]]), ...trk(R, K.r, [[0, 0], [36, 0]]),
    ...trk(ids.eyes, K.sy, [[0, 100, OUT], [3, 112], [14, 112], [24, 100], [36, 100]]), ...trk(ids.eyes, K.sx, [[0, 100, OUT], [3, 105], [14, 105], [24, 100], [36, 100]])]);
  save();

  // ---------- layers / transitions ----------
  let sm = await ae('queryStateMachine', {});
  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  if (!sm.layers.some(l => l.layerName === 'Presence')) {
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [{ name: 'Presence',
      states: [st('present/shown', 220, -60), st('present/hidden', 220, 80), st('present/enter', 460, 80), st('present/exit', 460, -60)],
      otherTransitions: [{ from: '{Entry State}', to: 'present/shown' }, { from: '{Entry State}', to: 'present/hidden' },
        { from: 'present/shown', to: 'present/exit' }, { from: 'present/exit', to: 'present/hidden' },
        { from: 'present/hidden', to: 'present/enter' }, { from: 'present/enter', to: 'present/shown' }, { from: 'present/enter', to: 'present/exit' }] }] });
  }
  sm = await ae('queryStateMachine', {});
  const layer = (n) => sm.layers.find(l => l.layerName === n);
  const names = (L) => { const m = {}; for (const s of L.states) m[s.id] = s.name || s.type; return m; };
  const pv = {}, conds = [];
  { const L = layer('Presence'), nm = names(L);
    for (const t of L.transitions) { if (t.conditions.length) continue; const k2 = `${nm[t.fromStateId]}>${nm[t.toStateId]}`;
      const EXIT = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0 }, NOW = { 152: 0, 158: 0 };
      if (k2 === 'entry>present/shown') { pv[t.id] = NOW; conds.push({ id: t.id, conditions: [cond('hidden', 'equal', false)] }); }
      else if (k2 === 'entry>present/hidden') { pv[t.id] = NOW; conds.push({ id: t.id, conditions: [cond('hidden', 'equal', true)] }); }
      else if (k2 === 'present/shown>present/exit' || k2 === 'present/enter>present/exit') { pv[t.id] = { 152: F.enableEarlyExit, 158: 60, 349: 2 }; conds.push({ id: t.id, conditions: [cond('hidden', 'equal', true)] }); }
      else if (k2 === 'present/hidden>present/enter') { pv[t.id] = NOW; conds.push({ id: t.id, conditions: [cond('hidden', 'equal', false)] }); }
      else pv[t.id] = EXIT; } }
  // Eyes: blink on demand
  { const L = layer('Eyes'), blinkState = L.states.find(s => s.name === 'eyes/blink').id;
    if (!L.transitions.some(t => t.fromStateId === L.anyStateId && t.toStateId === blinkState)) {
      await ae('createTransitions', { states: [{ id: L.anyStateId, transitions: [{ to: blinkState }] }] });
      const L2 = (await ae('queryStateMachine', {})).layers.find(l => l.layerName === 'Eyes');
      const t = L2.transitions.find(x => x.fromStateId === L2.anyStateId && x.toStateId === blinkState);
      pv[t.id] = { 152: F.enableEarlyExit, 158: 0 }; conds.push({ id: t.id, conditions: [trig('blink')] }); } }
  // Reactions: tap
  { const L = layer('Reactions');
    if (!L.states.some(s => s.name === 'react/tap')) {
      await ae('createStates', { layerId: L.layerId, states: [st('react/tap', 440, 180)] });
      let L2 = (await ae('queryStateMachine', {})).layers.find(l => l.layerName === 'Reactions');
      const tap = L2.states.find(s => s.name === 'react/tap').id, idle = L2.states.find(s => s.name === 'react/idle').id;
      await ae('createTransitions', { states: [{ id: L2.anyStateId, transitions: [{ to: tap }] }, { id: tap, transitions: [{ to: idle }] }] });
      L2 = (await ae('queryStateMachine', {})).layers.find(l => l.layerName === 'Reactions');
      for (const t of L2.transitions) {
        if (t.toStateId === tap) { pv[t.id] = { 152: F.enableEarlyExit, 158: 40, 349: 2 }; conds.push({ id: t.id, conditions: [trig('tapped')] }); }
        if (t.fromStateId === tap) pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 150, 349: 2 };
      } } }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });

  // ---------- listeners ----------
  sm = await ae('queryStateMachine', {});
  if (!(sm.listeners || []).length) {
    await call('create_listeners', { listeners: [
      { name: 'mood change → blink', targetName: 'Dombi', listenerTypes: [{ type: 'viewModel', viewModelPropertyId: prop('mood') }], actions: [{ type: 'viewModelChange', viewModelPropertyId: prop('blink') }] },
      { name: 'tap body', targetId: ids.bodyShapes[1].id, listenerTypes: ['click'], actions: [{ type: 'viewModelChange', viewModelPropertyId: prop('tapped') }] },
    ] });
  }
  console.log('polish ready ·', Object.keys(ACCENT).length, 'mood accents ·', conds.length, 'new conditions');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
