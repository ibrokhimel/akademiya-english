// Adds any viseme in VISEMES/OPTIONAL that is missing from the Mouth layer (timeline + state + Any-State transition
// with talking == true && viseme == N, 75 ms cubic, interruptible). Re-keys ALL mouth/v* timelines from the current
// shapes (single-shape model), so shape tweaks in dombi_visemes.js land here too.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { VISEMES, OPTIONAL } = require('../icons/dombi_visemes');
const { MOUTHS } = require('../icons/dombi_rig');
const { shapeOf } = require('../icons/mouth_geo');
const { polar, VK, OP } = require('./dombi_mouth');
const FACE = { x: 100, y: 104 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const local = (v) => ({ p: [v.p[0] - FACE.x, v.p[1] - FACE.y], in: [v.in[0] - FACE.x, v.in[1] - FACE.y], out: [v.out[0] - FACE.x, v.out[1] - FACE.y] });
const REF = shapeOf(MOUTHS.smirk).map(local).map(v => polar(v));
function keysFor(m) {
  const keys = [];
  shapeOf(m).map(local).forEach((v, i) => { const pv = polar(v, REF[i]);
    for (const [k, pk] of Object.entries(VK)) keys.push({ objectId: ids.mouthShape.verts[i], propertyKey: pk, frame: 0, value: +pv[k].toFixed(3), interpolationType: 'hold' }); });
  keys.push({ objectId: ids.mouthShape.id, propertyKey: OP, frame: 0, value: 100, interpolationType: 'hold' });
  return keys;
}
(async () => {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const all = [...VISEMES, ...OPTIONAL], owned = new Set([ids.mouthShape.id, ...ids.mouthShape.verts]);
  const added = [];
  for (const v of all) {
    const name = `mouth/v${v.id}`;
    if (!mids.anims[name]) {
      const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: 0.1 }] });
      mids.anims[name] = (r.animations || r.linearAnimations)[0].id; added.push(name);
    }
    await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: 6, 59: 0 } } });
  }
  const q = await ae('queryKeyFrames', { animationIds: all.map(v => mids.anims[`mouth/v${v.id}`]) });
  for (const v of all) {
    const id = mids.anims[`mouth/v${v.id}`];
    const old = (q.keyframes[id] || []).filter(k => owned.has(k.objectId)).map(k => k.keyframeId);
    if (old.length) await ae('modifyKeyFrames', { animationId: id, delete: old });
    await ae('modifyKeyFrames', { animationId: id, add: keysFor(v) });
  }
  fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1));

  let sm = await ae('queryStateMachine', {}); let Lm = sm.layers.find(l => l.layerName === 'Mouth');
  const missing = all.filter(v => !Lm.states.some(s => s.name === `mouth/v${v.id}`));
  if (missing.length) {
    await ae('createStates', { layerId: Lm.layerId, states: missing.map((v, i) => ({ name: `mouth/v${v.id}`, x: 420 + (i % 4) * 170, y: 220, linearAnimationName: `mouth/v${v.id}` })) });
    sm = await ae('queryStateMachine', {}); Lm = sm.layers.find(l => l.layerName === 'Mouth');
    const newIds = missing.map(v => Lm.states.find(s => s.name === `mouth/v${v.id}`).id);
    await ae('createTransitions', { states: [{ id: Lm.anyStateId, transitions: newIds.map(id => ({ to: id })) }] });
    sm = await ae('queryStateMachine', {}); Lm = sm.layers.find(l => l.layerName === 'Mouth');
    const vm = (await call('viewmodel_editor', { command: 'listViewModels', data: { listViewModels: {} } })).viewModels.find(v => v.name === 'Dombi');
    const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;
    const pv = {}, conds = [];
    for (const t of Lm.transitions) if (t.fromStateId === Lm.anyStateId && newIds.includes(t.toStateId)) {
      const n = +Lm.states.find(s => s.id === t.toStateId).name.slice(7);
      pv[t.id] = { 152: 32, 158: 75, 349: 2 };
      conds.push({ id: t.id, conditions: [
        { leftComparator: { viewModelPropertyId: prop('talking') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: true } },
        { leftComparator: { viewModelPropertyId: prop('viseme') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: n } }] });
    }
    await call('set_property_values', { propertyValues: pv });
    await ae('createConditions', { transitions: conds });
  }
  console.log('visemes re-keyed:', all.length, '· new timelines:', added.join(',') || 'none', '· new states:', missing.map(v => v.name).join(',') || 'none');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
