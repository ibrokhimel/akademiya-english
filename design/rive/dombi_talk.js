// Dombi engine, stage 7: the talking layer.
// Layer "Mouth" (last in the list = highest priority, so speech overrides the mood's mouth):
//   off (keys nothing -> the Face layer's mood mouth shows)  ·  mouth/v0 … mouth/v11 (one full mouth pose each)
//   Any -> mouth/vN   when talking == true AND viseme == N   (45 ms cubic morph, interruptible)
//   Any -> off        when talking == false                  (120 ms ease back to the mood's mouth)
// Shapes: design/icons/dombi_visemes.js (research/5-visemes.md §1.9).
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { VISEMES, OPTIONAL } = require('../icons/dombi_visemes');
const { MOUTHS } = require('../icons/dombi_rig');
const { L, Lf, lineVerts, polar, collapse, VK, OP } = require('./dombi_mouth');
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const F = { enableEarlyExit: 32 };

const shapeVerts = (f) => [{ p: f.verts[0], in: f.c[5], out: f.c[0] }, { p: f.verts[1], in: f.c[1], out: f.c[2] }, { p: f.verts[2], in: f.c[3], out: f.c[4] }];

function mouthKeys(m) {   // same construction as the mood mouths -> morphs cleanly to/from them
  const refLine = lineVerts(MOUTHS.smirk.line.map(s => s.map(L))).map(v => polar(v));
  const refShape = shapeVerts(Lf(MOUTHS.laugh.fill)).map(v => polar(v));
  let lineV, shapeV, lineOp, shapeOp;
  if (m.line) { lineV = lineVerts(m.line.map(s => s.map(L))); shapeV = collapse(lineV[1].p, 3); lineOp = 100; shapeOp = 0; }
  else {
    const f = Lf(m.fill); shapeV = shapeVerts(f);
    lineV = collapse([(f.verts[0][0] + f.verts[1][0] + f.verts[2][0]) / 3, (f.verts[0][1] + f.verts[1][1] + f.verts[2][1]) / 3], 3);
    lineOp = 0; shapeOp = 100;
  }
  const keys = [];
  const push = (obj, verts, refs) => verts.forEach((v, i) => { const pv = polar(v, refs[i]);
    for (const [k, pk] of Object.entries(VK)) keys.push({ objectId: obj.verts[i], propertyKey: pk, frame: 0, value: +pv[k].toFixed(3), interpolationType: 'hold' }); });
  push(ids.mouthLine, lineV, refLine); push(ids.mouthShape, shapeV, refShape);
  keys.push({ objectId: ids.mouthLine.id, propertyKey: OP, frame: 0, value: lineOp, interpolationType: 'hold' },
            { objectId: ids.mouthShape.id, propertyKey: OP, frame: 0, value: shapeOp, interpolationType: 'hold' });
  return keys;
}

async function anim(name, frames, add) {
  if (!mids.anims[name]) {
    const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
    mids.anims[name] = (r.animations || r.linearAnimations)[0].id;
  }
  await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: 0 } } });
  if (add.length) await ae('modifyKeyFrames', { animationId: mids.anims[name], add });
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const all = [...VISEMES, ...OPTIONAL];
  await anim('mouth/off', 6, []);
  for (const v of all) await anim(`mouth/v${v.id}`, 6, mouthKeys(v));
  fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1));

  let sm = await ae('queryStateMachine', {});
  if (!sm.layers.some(l => l.layerName === 'Mouth')) {
    const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [{ name: 'Mouth',
      states: [st('mouth/off', 200, 0), ...all.map((v, i) => st(`mouth/v${v.id}`, 420 + (i % 4) * 170, Math.floor(i / 4) * 90 - 90))],
      otherTransitions: [{ from: '{Entry State}', to: 'mouth/off' }, { from: '{Any State}', to: 'mouth/off' },
        ...all.map(v => ({ from: '{Any State}', to: `mouth/v${v.id}` }))] }] });
    sm = await ae('queryStateMachine', {});
  }
  const Lm = sm.layers.find(l => l.layerName === 'Mouth');
  const vm = (await call('viewmodel_editor', { command: 'listViewModels', data: { listViewModels: {} } })).viewModels.find(v => v.name === 'Dombi');
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;
  const name = {}; for (const s of Lm.states) name[s.id] = s.name || s.type;
  const pv = {}, conds = [];
  for (const t of Lm.transitions) {
    if (t.fromStateId !== Lm.anyStateId || t.conditions.length) continue;
    const to = name[t.toStateId];
    if (to === 'mouth/off') {
      pv[t.id] = { 152: F.enableEarlyExit, 158: 120, 349: 2 };
      conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('talking') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: false } }] });
    } else {
      pv[t.id] = { 152: F.enableEarlyExit, 158: 45, 349: 2 };
      conds.push({ id: t.id, conditions: [
        { leftComparator: { viewModelPropertyId: prop('talking') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: true } },
        { leftComparator: { viewModelPropertyId: prop('viseme') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: +to.slice(7) } }] });
    }
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('Mouth layer:', all.length, 'visemes,', conds.length, 'conditioned transitions');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
