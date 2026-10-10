// Dombi engine, stage 2: view model + timelines + one state machine with owner-separated layers.
// Run once after `node dombi_engine.js rig`. All timings at 60 fps (frames = ms / 16.67).
//   Body  : squash breathing loop (owns squash sx/sy)
//   Sway  : slow lean loop, period unrelated to breath (owns root rotation)
//   Eyes  : random-interval blinks via Randomize Exit (owns eyes-group sx/sy)
//   Face  : one state per `mood` enum value (owns every eye/lid/mouth part + face tilt + Z's)
//   Hands : one state per `gesture` enum value, hidden by default (owns both hands)
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const { EXPR, POSES } = require('../icons/dombi_rig');
const { K, pose, faceValues, handValues } = require('./dombi_pose');
const ids = require('./dombi_ids.json');

const MOODS = Object.keys(EXPR);                       // smirk, happy, laugh, ...
const GESTURES = ['none', ...Object.keys(POSES)];      // none, wave, celebrate, thinking, point
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 };     // idle loops
const EASE_IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const EASE_OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 };
const OUT_BACK = { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 }; // M3 emphasized-decelerate
// transition flags (rive-runtime StateTransitionFlags) / state flags
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const RANDOM_STATE = 1;

const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const out = {};

// ---- keyframe helpers ----
function keysFromValues(values, frame, interp = 'hold', cubic) {
  const add = [];
  for (const [objectId, props] of Object.entries(values))
    for (const [k, value] of Object.entries(props))
      add.push({ objectId, propertyKey: +k, frame, value, interpolationType: interp, ...(cubic ? { cubicParams: cubic } : {}) });
  return add;
}
const key = (objectId, propertyKey, frame, value, cubic) =>
  ({ objectId, propertyKey, frame, value, interpolationType: cubic ? 'cubic' : 'hold', ...(cubic ? { cubicParams: cubic } : {}) });

async function anim(name, frames, loop, add) {
  let a = out.anims[name];
  if (!a) {
    const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
    a = (r.linearAnimations || r.animations || r.created)[0].id;
    out.anims[name] = a;
  }
  await call('set_property_values', { propertyValues: { [a]: { 56: 60, 57: frames, 59: loop ? 1 : 0 } } });
  for (let i = 0; i < add.length; i += 150) await ae('modifyKeyFrames', { animationId: a, add: add.slice(i, i + 150) });
  return a;
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  out.anims = {};

  // ---------- view model ----------
  const have = ((await vme('listViewModels', {})).viewModels || []).some(v => v.name === 'Dombi');
  if (!have) {
  await vme('createDataEnums', { dataEnums: [{ name: 'DombiMood', values: MOODS }, { name: 'DombiGesture', values: GESTURES }] });
  const vm = await vme('createViewModels', { viewModels: [{ name: 'Dombi', viewModelProperties: [
    { name: 'mood', propertyType: 'enum', enumName: 'DombiMood' },
    { name: 'gesture', propertyType: 'enum', enumName: 'DombiGesture' },
    { name: 'listening', propertyType: 'boolean' }, { name: 'talking', propertyType: 'boolean' },
    { name: 'viseme', propertyType: 'number' }, { name: 'amp', propertyType: 'number' },
    { name: 'lookX', propertyType: 'number' }, { name: 'lookY', propertyType: 'number' },
    { name: 'correct', propertyType: 'trigger' }, { name: 'wrong', propertyType: 'trigger' },
    { name: 'celebrate', propertyType: 'trigger' }, { name: 'gestureDone', propertyType: 'trigger' },
  ] }] });
  fs.writeFileSync(path.join(__dirname, 'vm_create.json'), JSON.stringify(vm, null, 1));
  }
  const list = await vme('listViewModels', {});
  const V = (list.viewModels || []).find(v => v.name === 'Dombi');
  out.vm = V;
  const prop = (n) => V.viewModelProperties.find(p => p.name === n).id;
  if (!have) await vme('createViewModelInstances', { viewModelId: V.id, instances: [{ name: 'Default', instanceProperties: [
    { propertyType: 'enum', viewModelPropertyId: prop('mood'), value: 'smirk' },
    { propertyType: 'enum', viewModelPropertyId: prop('gesture'), value: 'none' }] }] });
  await vme('bindViewModelToArtboard', { artboardId: ids.artboard, viewModelId: V.id });

  // ---------- timelines ----------
  const la = await ae('listLinearAnimations', {});
  const t1 = la.linearAnimations.find(a => /^Timeline/.test(a.name));
  if (t1) { await ae('renameAnimations', { animations: [{ animationId: t1.id, name: 'body/breathe' }] }); out.anims['body/breathe'] = t1.id; }

  // Body: 3.6 s breath, inhale 40 % / exhale 60 %, area-preserving 1.5 % squash from the floor.
  await anim('body/breathe', 216, true, [
    key(ids.squash, K.sx, 0, 100, SINE), key(ids.squash, K.sy, 0, 100, SINE),
    key(ids.squash, K.sx, 86, 98.5, SINE), key(ids.squash, K.sy, 86, 101.5, SINE),
    key(ids.squash, K.sx, 216, 100, SINE), key(ids.squash, K.sy, 216, 100, SINE)]);
  // Sway: 9.1 s, ±0.8° lean around the bottom pivot (incommensurate with the breath).
  await anim('body/sway', 546, true, [0, 137, 273, 410, 546].map((f, i) => key(ids.root, K.r, f, [0, 0.8, 0, -0.8, 0][i], SINE)));
  // Eyes: open holds of different lengths + blink + double blink (close 67 ms, hold 33, open 117).
  for (const [n, f] of [['eyes/open-3.5s', 210], ['eyes/open-5s', 300], ['eyes/open-6.5s', 390]])
    await anim(n, f, false, [key(ids.eyes, K.sy, 0, 100), key(ids.eyes, K.sx, 0, 100)]);
  const blink = (o) => [key(ids.eyes, K.sy, o, 100, EASE_IN), key(ids.eyes, K.sy, o + 4, 10), key(ids.eyes, K.sy, o + 6, 10, EASE_OUT), key(ids.eyes, K.sy, o + 13, 100),
                        key(ids.eyes, K.sx, o, 100, EASE_IN), key(ids.eyes, K.sx, o + 4, 107), key(ids.eyes, K.sx, o + 6, 107, EASE_OUT), key(ids.eyes, K.sx, o + 13, 100)];
  await anim('eyes/blink', 14, false, blink(0));
  await anim('eyes/double', 31, false, [...blink(0), ...blink(17)]);
  // Face: one full pose per mood (every face-owned property keyed -> no leaks).
  for (const m of MOODS) await anim('face/' + m, 6, false, keysFromValues(faceValues(ids, pose(m)), 0));
  // Hands: none = both hidden; gesture = pop in at the pose spot (0 -> 115 % in 150 ms -> 100 %).
  const rest = handValues(ids, pose('smirk'));
  await anim('hands/none', 6, false, keysFromValues(rest, 0));
  for (const g of GESTURES.slice(1)) {
    const hv = handValues(ids, pose(g)), add = [];
    for (const [id, p] of Object.entries(hv)) {
      add.push(key(id, K.x, 0, p[K.x]), key(id, K.y, 0, p[K.y]));
      const s = p[K.sx];
      for (const sk of [K.sx, K.sy]) add.push(key(id, sk, 0, 0, OUT_BACK), key(id, sk, 9, s ? 115 : 0, EASE_OUT), key(id, sk, 15, s));
    }
    await anim('hands/' + g, 15, false, add);
  }
  fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(out, null, 1));

  // ---------- state machine ----------
  let sm = await ae('queryStateMachine', {});
  const L1 = sm.layers[0];
  await call('rename_objects', { renames: [{ id: L1.layerId, name: 'Body' }, { id: sm.stateMachineId, name: 'Dombi' }] }).catch(() => {});
  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [
    { name: 'Sway', states: [st('body/sway', 160, 0)], otherTransitions: [{ from: '{Entry State}', to: 'body/sway' }] },
    { name: 'Eyes', states: [st('eyes/open-3.5s', 200, -120), st('eyes/open-5s', 200, 0), st('eyes/open-6.5s', 200, 120), st('eyes/blink', 480, -60), st('eyes/double', 480, 60)],
      otherTransitions: [{ from: '{Entry State}', to: 'eyes/open-5s' },
        ...['eyes/open-3.5s', 'eyes/open-5s', 'eyes/open-6.5s'].flatMap(o => [{ from: o, to: 'eyes/blink' }, { from: o, to: 'eyes/double' }]),
        ...['eyes/blink', 'eyes/double'].flatMap(b => ['eyes/open-3.5s', 'eyes/open-5s', 'eyes/open-6.5s'].map(o => ({ from: b, to: o })))] },
    { name: 'Face', states: MOODS.map((m, i) => st('face/' + m, 200 + (i % 4) * 180, Math.floor(i / 4) * 90)),
      otherTransitions: [{ from: '{Entry State}', to: 'face/smirk' }, ...MOODS.map(m => ({ from: '{Any State}', to: 'face/' + m }))] },
    { name: 'Hands', states: GESTURES.map((g, i) => st('hands/' + g, 200 + i * 180, 0)),
      otherTransitions: [{ from: '{Entry State}', to: 'hands/none' }, ...GESTURES.map(g => ({ from: '{Any State}', to: 'hands/' + g }))] },
  ] });
  // Body layer: point the default state at body/breathe (it was "Timeline 1", now renamed).
  sm = await ae('queryStateMachine', {});
  fs.writeFileSync(path.join(__dirname, 'sm_raw.json'), JSON.stringify(sm, null, 1));

  // ---------- transition properties + conditions ----------
  const pv = {}, conds = [];
  const byId = {}; for (const l of sm.layers) for (const s of l.states) byId[s.id] = { ...s, layer: l.layerName };
  for (const l of sm.layers) for (const t of l.transitions) {
    const from = byId[t.fromStateId], to = byId[t.toStateId];
    if (from.type === 'entry') continue;
    if (l.layerName === 'Eyes') {   // finish the hold/blink, then pick the next one at random
      const w = to.name === 'eyes/double' ? 1 : to.name === 'eyes/blink' ? 5 : to.name === 'eyes/open-5s' ? 3 : 2;
      pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0, 537: w };
    } else if (l.layerName === 'Face') {
      pv[t.id] = { 152: F.enableEarlyExit, 158: 150, 349: 2 };     // 150 ms cubic blend, interruptible
      conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('mood') }, comparationOperation: 'equal',
        rightComparator: { valueType: 'constantValueType', value: to.name.slice(5) } }] });
    } else if (l.layerName === 'Hands') {
      const g = to.name.slice(6);
      pv[t.id] = { 152: F.enableEarlyExit, 158: g === 'none' ? 150 : 0, 349: 2 };  // pop-out = 150 ms blend to hidden
      conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('gesture') }, comparationOperation: 'equal',
        rightComparator: { valueType: 'constantValueType', value: g } }] });
    }
  }
  for (const l of sm.layers) if (l.layerName === 'Eyes') for (const s of l.states) if (s.type === 'animation') pv[s.id] = { 536: RANDOM_STATE };
  await call('set_property_values', { propertyValues: pv });
  await ae('createConditions', { transitions: conds });
  console.log('done', Object.keys(out.anims).length, 'timelines,', conds.length, 'conditions');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
