// Dombi's new faces, round 2 of the owner's "way more" batch (2026-10-30). Each is a Face-layer pose (face/<name>, 6 frames,
// every face part keyed so nothing leaks from the face before), reached by the view-model enum `mood` = <name>, 150 ms blend,
// like the 13 faces before them. Eye / lid y and x are relative to their spot on the eye row; the face group sits at y -66.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES } = require('../icons/dombi_visemes');
const { H, mouth, eL, eR, lL, lR, anim, newAnim, ae } = require('./dombi_redo');
const VIS = (n) => VISEMES.find((v) => v.name === n);
// a tall open mouth for the jaw drop, in the rig's closed-fill format (3 vertices + 6 control points, 200-space)
const JAW = { fill: { verts: [[89, 121], [113, 121], [101, 148]], c: [[89, 121], [113, 121], [116, 134], [109, 149], [93, 149], [86, 134]] } };
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });

const EYE = { dx: 0, y: 0, w: 18, h: 34, rad: 9, r: 0 }, LID = { y: -25, r: 0, op: 0 }, FACE = { x: 0, y: -66, r: 0 };
function face({ eyeL = {}, eyeR = {}, eyes = {}, lidL = {}, lidR = {}, lids = {}, m = MOUTHS.smirk, f = {} }) {
  const el = { ...EYE, ...eyes, ...eyeL }, er = { ...EYE, ...eyes, ...eyeR }, ll = { ...LID, ...lids, ...lidL }, lr = { ...LID, ...lids, ...lidR }, fc = { ...FACE, ...f };
  return [...H(eL.id, { x: -25 + el.dx, y: el.y, r: el.r, op: 100 }), ...H(eL.pathId, { w: el.w, h: el.h, rad: el.rad }),
    ...H(eR.id, { x: 25 + er.dx, y: er.y, r: er.r, op: 100 }), ...H(eR.pathId, { w: er.w, h: er.h, rad: er.rad }),
    ...H(lL.id, { x: -25, y: ll.y, r: ll.r, op: ll.op }), ...H(lR.id, { x: 25, y: lr.y, r: lr.r, op: lr.op }),
    ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 }),
    ...mouth(m), ...H(ids.mouthShape.id, { op: 100 }), ...H(ids.face, { x: fc.x, y: fc.y, r: fc.r }),
    ...H(ids.z1, { sx: 0, sy: 0, op: 0 }), ...H(ids.z2, { sx: 0, sy: 0, op: 0 })];
}

const FACES = {
  // side-eye: both eyes slid to one side under flat half lids, flat mouth
  sideEye: face({ eyes: { dx: 7 }, lids: { y: -15, op: 100 }, m: MOUTHS.focus }),
  // deadpan: heavy flat lids, eyes straight ahead, a flat mouth - nothing impresses him
  deadpan: face({ lids: { y: -11, op: 100 }, m: MOUTHS.focus }),
  // mischievous grin: lids slanting in a little, the widest smile
  grin: face({ lidL: { y: -16, r: 9, op: 100 }, lidR: { y: -16, r: -9, op: 100 }, m: MOUTHS.happy }),
  // suspicious: one eye narrowed, the other wide, looking slightly aside, mouth pulled to one side
  suspicious: face({ eyes: { dx: -3 }, eyeR: { h: 38, y: -2 }, lidL: { y: -10, r: -6, op: 100 }, m: MOUTHS.think }),
  // cringe: eyes squeezed, teeth gritted, head turning away
  cringe: face({ eyes: { w: 22, h: 12, rad: 6, y: 2 }, m: VIS('TEETH'), f: { r: -4 } }),
  // disgusted: lopsided - one lid low and slanted, the other eye squinting, a crooked mouth, head turned away and pulled back
  disgusted: face({ eyes: { h: 26, y: 2, dx: 4 }, lidL: { y: -12, r: -12, op: 100 }, lidR: { y: -17, op: 100 }, m: MOUTHS.confused, f: { y: -64, r: 7 } }),
  // jaw-drop shock: tall wide eyes, the mouth hanging wide open (a tall open mouth of its own, bigger than any viseme)
  shocked: face({ eyes: { w: 22, h: 44, rad: 11, y: -4 }, m: JAW, f: { y: -68 } }),
  // awkward: eyes looking away, a small tight mouth, a little head tilt
  awkward: face({ eyes: { dx: -5, h: 30 }, m: MOUTHS.listen, f: { r: 3 } }),
  // crying-laughing: eyes squeezed into tilted lines, laughing mouth open
  cryLaugh: face({ eyeL: { w: 22, h: 6, rad: 3, y: 2, r: 18 }, eyeR: { w: 22, h: 6, rad: 3, y: 2, r: -18 }, m: MOUTHS.laugh }),
  // bored: half lids, eyes drifting up and to the side, a flat sleepy mouth, head tipped
  bored: face({ eyes: { dx: -4, y: -2 }, lids: { y: -12, op: 100 }, m: MOUTHS.sleepy, f: { r: -4 } }),
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const names = Object.keys(FACES);
  const en = (await vme('listDataEnums', {})).dataEnums.find((e) => e.name === 'DombiMood');
  const missing = names.filter((n) => !en.values.some((v) => v.key === n));
  if (missing.length) await vme('addDataEnumValues', { dataEnumName: 'DombiMood', values: missing });
  for (const n of names) { await newAnim('face/' + n, 6); await anim('face/' + n, 6, FACES[n], 0); }

  let sm = await ae('queryStateMachine', {}); let L = sm.layers.find((l) => l.layerName === 'Face');
  const todo = names.filter((n) => !L.states.some((s) => s.name === 'face/' + n));
  if (todo.length) { await ae('createStates', { layerId: L.layerId, states: todo.map((n, i) => ({ name: 'face/' + n, linearAnimationName: 'face/' + n, x: 900 + (i % 4) * 180, y: 300 + Math.floor(i / 4) * 90 })) });
    sm = await ae('queryStateMachine', {}); L = sm.layers.find((l) => l.layerName === 'Face'); }
  const any = L.states.find((s) => s.type === 'any'), st = (n) => L.states.find((s) => s.name === 'face/' + n);
  const need = names.filter((n) => !L.transitions.some((t) => t.fromStateId === any.id && t.toStateId === st(n).id));
  if (need.length) { await ae('createTransitions', { states: [{ id: any.id, transitions: need.map((n) => ({ to: st(n).id })) }] });
    sm = await ae('queryStateMachine', {}); L = sm.layers.find((l) => l.layerName === 'Face'); }
  const vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi'), mood = vm.viewModelProperties.find((p) => p.name === 'mood').id;
  const pv = {}, conds = [];
  for (const n of names) {
    const t = L.transitions.find((x) => x.fromStateId === any.id && x.toStateId === st(n).id);
    pv[t.id] = { 152: 32, 158: 150 };                                             // early exit, 150 ms, like the other faces
    if (!(t.conditions || []).length) conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: mood }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: n } }] });
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('faces:', names.length, '· new enum values', missing.length, '· new states', todo.length, '· new conditions', conds.length);
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
