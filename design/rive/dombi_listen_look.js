// Dombi engine, stage 10: listening + voice pulse + look-at.
// New groups (identity): react -> listen -> voice -> lean.
//   voice : sx/sy data-bound to VM `amp` (0-100) -> the body pulses with a voice (learner's while listening, his own
//           while talking). Formula converters; +5 % tall / -3 % wide at amp 100.
//   listen: Listen layer. listening == true -> lean in (0.3 s) -> attentive loop; silence (amp < 6) for 1.5 s ->
//           "can't hear you" head tilt until sound returns; listening == false -> ease out. Eyes lock on the learner.
//   look  : x/y data-bound to VM lookX / lookY (-100..100 -> ±6 px). `looking` == true parks the random Gaze layer.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const save = () => { fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1)); fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1)); };
const k = (part, p, frame, value, c = SINE) => ({ objectId: ids[part], propertyKey: K[p], frame, value, interpolationType: 'cubic', cubicParams: c });
const track = (part, p, list) => list.map(([f, v, c]) => k(part, p, f, v, c));
async function group(name, parentId) {
  const r = await call('group_editor', { name, parentId });
  await call('set_property_values', { propertyValues: { [r.group.id]: { [K.x]: 0, [K.y]: 0 } } });
  return r.group.id;
}
async function anim(name, frames, add, loop = 0) {
  if (!mids.anims[name]) { const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] }); mids.anims[name] = (r.animations || r.linearAnimations)[0].id; }
  await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: loop } } });
  if (add.length) await ae('modifyKeyFrames', { animationId: mids.anims[name], add });
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  // ---------- rig ----------
  if (!ids.listen) {
    ids.listen = await group('listen', ids.react);
    ids.voice = await group('voice', ids.listen);
    await call('reparent_objects', { operations: [{ objectId: ids.lean, newParentId: ids.voice }] });
    save();
  }
  const vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;

  // ---------- data binds ----------
  if (!ids.converters) {
    const mk = async (name, formula) => { const r = await vme('createConverters', { converters: [{ converterType: 'formula', name, formula }] });
      return (r.converters || r.created || r.dataConverters)[0].id; };
    ids.converters = {
      ampY: await mk('amp → tall', '1 + {Input} * 0.0005'), ampX: await mk('amp → narrow', '1 - {Input} * 0.0003'),
      look: await mk('look → px', '{Input} * 0.06'),
    };
    await vme('databind', { viewModelId: vm.id, bindings: [
      { objectId: ids.voice, propertyKey: K.sy, viewModelPropertyId: prop('amp'), converterId: ids.converters.ampY },
      { objectId: ids.voice, propertyKey: K.sx, viewModelPropertyId: prop('amp'), converterId: ids.converters.ampX },
      { objectId: ids.look, propertyKey: K.x, viewModelPropertyId: prop('lookX'), converterId: ids.converters.look },
      { objectId: ids.look, propertyKey: K.y, viewModelPropertyId: prop('lookY'), converterId: ids.converters.look },
    ] });
    save();
  }

  // ---------- timelines ----------
  const EYE = { x: 0, y: -7 };   // eyes on the learner (rest is 0,-9)
  const eyesHold = (f) => [...track('eyes', 'x', [[0, EYE.x], [f, EYE.x]]), ...track('eyes', 'y', [[0, EYE.y], [f, EYE.y]])];
  const pose = (f, r = -2) => [...track('listen', 'sx', [[0, 103.5], [f, 103.5]]), ...track('listen', 'sy', [[0, 103.5], [f, 103.5]]),
    ...track('listen', 'x', [[0, 0], [f, 0]]), ...track('listen', 'r', [[0, r], [f, r]])];
  await anim('listen/off', 6, []);
  await anim('listen/in', 18, [   // lean in: grows 3.5 % toward the learner with a small overshoot
    ...track('listen', 'sx', [[0, 100, OUT], [10, 104.5], [18, 103.5]]), ...track('listen', 'sy', [[0, 100, OUT], [10, 104.5], [18, 103.5]]),
    ...track('listen', 'y', [[0, 0, OUT], [10, -3], [18, -2]]), ...track('listen', 'r', [[0, 0, OUT], [12, -2], [18, -2]]),
    ...track('listen', 'x', [[0, 0], [18, 0]]), ...eyesHold(18)]);
  await anim('listen/on', 150, [   // attentive: one slow nod per 2.5 s
    ...pose(150), ...track('listen', 'y', [[0, -2], [60, -2], [72, 0], [86, -2], [150, -2]]), ...eyesHold(150)], 1);
  await anim('listen/quiet', 90, [...pose(90), ...track('listen', 'y', [[0, -2], [90, -2]]), ...eyesHold(90)]);   // 1.5 s of silence
  await anim('listen/cant-hear', 30, [   // head tilt + lean closer: "can't hear you"
    ...track('listen', 'r', [[0, -2, OUT], [14, 8], [20, 7], [30, 7]]), ...track('listen', 'sx', [[0, 103.5, OUT], [14, 106], [30, 106]]),
    ...track('listen', 'sy', [[0, 103.5, OUT], [14, 106], [30, 106]]), ...track('listen', 'y', [[0, -2], [30, -2]]), ...track('listen', 'x', [[0, 0], [30, 0]]), ...eyesHold(30)]);
  await anim('gaze/still', 60, [...track('eyes', 'x', [[0, 0], [60, 0]]), ...track('eyes', 'y', [[0, -9], [60, -9]])]);
  save();

  // ---------- Listen layer ----------
  let sm = await ae('queryStateMachine', {});
  if (!sm.layers.some(l => l.layerName === 'Listen')) {
    const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
    const on = ['listen/in', 'listen/on', 'listen/quiet', 'listen/cant-hear'];
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [{ name: 'Listen',
      states: [st('listen/off', 200, 0), st('listen/in', 400, 0), st('listen/on', 600, 0), st('listen/quiet', 800, -60), st('listen/cant-hear', 800, 80)],
      otherTransitions: [{ from: '{Entry State}', to: 'listen/off' }, { from: 'listen/off', to: 'listen/in' }, { from: 'listen/in', to: 'listen/on' },
        { from: 'listen/on', to: 'listen/quiet' }, { from: 'listen/quiet', to: 'listen/on' }, { from: 'listen/quiet', to: 'listen/cant-hear' },
        { from: 'listen/cant-hear', to: 'listen/on' }, ...on.map(s => ({ from: s, to: 'listen/off' }))] }] });
    sm = await ae('queryStateMachine', {});
  }
  const pv = {}, conds = [];
  const cond = (p, op, value) => ({ leftComparator: { viewModelPropertyId: prop(p) }, comparationOperation: op, rightComparator: { valueType: 'constantValueType', value } });
  const L = sm.layers.find(l => l.layerName === 'Listen');
  const nm = {}; for (const s of L.states) nm[s.id] = s.name || s.type;
  for (const t of L.transitions) {
    const key = `${nm[t.fromStateId]}>${nm[t.toStateId]}`; if (nm[t.fromStateId] === 'entry' || t.conditions.length) continue;
    let c = null, p = { 152: F.enableEarlyExit, 158: 150, 349: 2 };
    if (key.endsWith('>listen/off')) { c = [cond('listening', 'equal', false)]; p[158] = 250; }
    else if (key === 'listen/off>listen/in') { c = [cond('listening', 'equal', true)]; p[158] = 0; }
    else if (key === 'listen/in>listen/on') p = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0 };
    else if (key === 'listen/on>listen/quiet') { c = [cond('amp', 'lessThan', 6)]; p[158] = 0; }
    else if (key === 'listen/quiet>listen/on') { c = [cond('amp', 'greaterThanOrEqual', 6)]; p[158] = 0; }
    else if (key === 'listen/quiet>listen/cant-hear') { c = [cond('amp', 'lessThan', 6)]; p = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0 }; }
    else if (key === 'listen/cant-hear>listen/on') { c = [cond('amp', 'greaterThanOrEqual', 6)]; p[158] = 200; }
    pv[t.id] = p; if (c) conds.push({ id: t.id, conditions: c });
  }

  // ---------- Gaze: park while the app points his eyes ----------
  const G = sm.layers.find(l => l.layerName === 'Gaze');
  if (!G.states.some(s => s.name === 'gaze/still')) {
    await ae('createStates', { layerId: G.layerId, states: [{ name: 'gaze/still', x: 200, y: 300, linearAnimationName: 'gaze/still' }] });
    let sm2 = await ae('queryStateMachine', {}); let G2 = sm2.layers.find(l => l.layerName === 'Gaze');
    const still = G2.states.find(s => s.name === 'gaze/still').id, center = G2.states.find(s => s.name === 'gaze/center').id;
    await ae('createTransitions', { states: [{ id: G2.anyStateId, transitions: [{ to: still }] }, { id: still, transitions: [{ to: center }] }] });
    sm2 = await ae('queryStateMachine', {}); G2 = sm2.layers.find(l => l.layerName === 'Gaze');
    for (const t of G2.transitions) {
      if (t.toStateId === still) { pv[t.id] = { 152: F.enableEarlyExit, 158: 80, 349: 2 }; conds.push({ id: t.id, conditions: [cond('looking', 'equal', true)] }); }
      if (t.fromStateId === still) { pv[t.id] = { 152: F.enableEarlyExit, 158: 120, 349: 2 }; conds.push({ id: t.id, conditions: [cond('looking', 'equal', false)] }); }
    }
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('listen + look ready ·', conds.length, 'conditions · converters', JSON.stringify(ids.converters));
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
