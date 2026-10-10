// Dombi engine, stage 8: ONE mouth shape for everything (fixes the flash between talking shapes).
//  - mouthLine is deleted; mouthShape gets a 7 px round white stroke on top of its fill
//  - every face/<mood> and mouth/v<N> timeline re-keys mouthShape's 3 vertices from design/icons/mouth_geo.js
//    (closed mouths = zero-area path the stroke draws as a line) -> every switch is a pure 3-point morph
//  - Mouth-layer pacing: into closed lips (MBP, FV) 50 ms, into other shapes 75 ms, back to the mood 120 ms
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES, OPTIONAL } = require('../icons/dombi_visemes');
const { shapeOf } = require('../icons/mouth_geo');
const { polar, VK, OP } = require('./dombi_mouth');
const FACE = { x: 100, y: 104 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const F = { enableEarlyExit: 32 };

const local = (v) => ({ p: [v.p[0] - FACE.x, v.p[1] - FACE.y], in: [v.in[0] - FACE.x, v.in[1] - FACE.y], out: [v.out[0] - FACE.x, v.out[1] - FACE.y] });
const REF = shapeOf(MOUTHS.smirk).map(local).map(v => polar(v));   // handle angles unwrap around the smirk's
function keysFor(m) {
  const verts = shapeOf(m).map(local), keys = [];
  verts.forEach((v, i) => { const pv = polar(v, REF[i]);
    for (const [k, pk] of Object.entries(VK)) keys.push({ objectId: ids.mouthShape.verts[i], propertyKey: pk, frame: 0, value: +pv[k].toFixed(3), interpolationType: 'hold' }); });
  keys.push({ objectId: ids.mouthShape.id, propertyKey: OP, frame: 0, value: 100, interpolationType: 'hold' });
  return keys;
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---- rig ----
  if (ids.mouthLine) {
    await call('delete_objects', { objectIds: [ids.mouthLine.id] });
    ids.deletedMouthLine = ids.mouthLine; delete ids.mouthLine;
  }
  if (!ids.mouthShape.stroke) {
    await call('path_editor', { command: 'addPaints', data: { addPaints: { shapeId: ids.mouthShape.id, paints: [{ paintType: 'stroke', color: '#ffffffff' }] } } });
    const h = await call('get_artboard_hierarchy', { artboardId: ids.artboard, depth: 12 });
    const by = {}; for (const o of h.objects) by[o.id] = o;
    const stroke = by[ids.mouthShape.id].children.map(c => by[c]).find(o => o.types.includes('Stroke'));
    ids.mouthShape.stroke = stroke.id;
    await call('set_property_values', { propertyValues: { [stroke.id]: { 47: 7, 48: 1, 49: 1 } } });   // 7 px, round cap + join
  }
  fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));

  // ---- re-key mouths ----
  const owned = new Set([ids.mouthShape.id, ...ids.mouthShape.verts]);
  const plan = {};
  for (const [mood, m] of Object.entries(MOUTHS)) if (mids.anims['face/' + mood]) plan[mids.anims['face/' + mood]] = keysFor(m);
  for (const v of [...VISEMES, ...OPTIONAL]) plan[mids.anims[`mouth/v${v.id}`]] = keysFor(v);
  const q = await ae('queryKeyFrames', { animationIds: Object.keys(plan) });
  for (const [anim, add] of Object.entries(plan)) {
    const old = (q.keyframes[anim] || []).filter(k => owned.has(k.objectId)).map(k => k.keyframeId);
    if (old.length) await ae('modifyKeyFrames', { animationId: anim, delete: old });
    await ae('modifyKeyFrames', { animationId: anim, add });
  }
  // design-view pose = smirk
  const base = {}; for (const k of keysFor(MOUTHS.smirk)) (base[k.objectId] = base[k.objectId] || {})[k.propertyKey] = k.value;
  await call('set_property_values', { propertyValues: base });

  // ---- pacing ----
  const sm = await ae('queryStateMachine', {});
  const Lm = sm.layers.find(l => l.layerName === 'Mouth');
  const name = {}; for (const s of Lm.states) name[s.id] = s.name || s.type;
  const pv = {};
  for (const t of Lm.transitions) {
    if (t.fromStateId !== Lm.anyStateId) continue;
    const to = name[t.toStateId];
    pv[t.id] = { 152: F.enableEarlyExit, 349: 2, 158: to === 'mouth/off' ? 120 : (to === 'mouth/v1' || to === 'mouth/v2') ? 50 : 75 };
  }
  await call('set_property_values', { propertyValues: pv });
  console.log('single-shape mouth: re-keyed', Object.keys(plan).length, 'timelines; pacing set on', Object.keys(pv).length, 'transitions');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
