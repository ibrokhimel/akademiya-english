// Dombi's new faces, round 2 of the owner's "way more" batch (2026-10-30). Each is a Face-layer pose (face/<name>, 6 frames,
// every face part keyed so nothing leaks from the face before), reached by the view-model enum `mood` = <name>, 150 ms blend,
// like the 13 faces before them. Eye / lid y and x are relative to their spot on the eye row; the face group sits at y -66.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES } = require('../icons/dombi_visemes');
const { H, T, SINE, OUT, IN, mouth, eL, eR, lL, lR, anim, newAnim, ae } = require('./dombi_redo');
const VIS = (n) => VISEMES.find((v) => v.name === n);
// a tall open mouth for the jaw drop, in the rig's closed-fill format (3 vertices + 6 control points, 200-space)
// a mouth collapsed to a dot: the mouth is one path with a round stroke, so a zero-length line draws a small dot
const DOT = { line: [[[100, 129], [100.3, 129], [100.6, 129], [101, 129]]] };
const JAW = { fill: { verts: [[89, 121], [113, 121], [101, 148]], c: [[89, 121], [113, 121], [116, 134], [109, 149], [93, 149], [86, 134]] } };
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });

// a lid not in use is parked above the eye at full opacity (invisible on his body), never faded: a half-faded lid over a white
// eye showed as a grey box during the 150 ms switch. Lids slide down instead, like real eyelids.
const EYE = { dx: 0, y: 0, w: 18, h: 34, rad: 9, r: 0 }, LID = { y: -32, r: 0, op: 100 }, FACE = { x: 0, y: -66, r: 0 };
function face({ eyeL = {}, eyeR = {}, eyes = {}, lidL = {}, lidR = {}, lids = {}, m = MOUTHS.smirk, f = {}, noMouth = false }) {
  const el = { ...EYE, ...eyes, ...eyeL }, er = { ...EYE, ...eyes, ...eyeR }, ll = { ...LID, ...lids, ...lidL }, lr = { ...LID, ...lids, ...lidR }, fc = { ...FACE, ...f };
  return [...H(eL.id, { x: -25 + el.dx, y: el.y, r: el.r, op: 100 }), ...H(eL.pathId, { w: el.w, h: el.h, rad: el.rad }),
    ...H(eR.id, { x: 25 + er.dx, y: er.y, r: er.r, op: 100 }), ...H(eR.pathId, { w: er.w, h: er.h, rad: er.rad }),
    ...H(lL.id, { x: -25 + el.dx, y: ll.y, r: ll.r, op: ll.op }), ...H(lR.id, { x: 25 + er.dx, y: lr.y, r: lr.r, op: lr.op }),   // lids move with the eyes
    ...H(lL.pathId, { w: 34, h: ll.h || 16, rad: 0 }), ...H(lR.pathId, { w: 34, h: lr.h || 16, rad: 0 }),
    ...mouth(m), ...H(ids.mouthShape.id, { op: noMouth ? 0 : 100 }), ...H(ids.face, { x: fc.x, y: fc.y, r: fc.r }),
    ...H(ids.z1, { sx: 0, sy: 0, op: 0 }), ...H(ids.z2, { sx: 0, sy: 0, op: 0 })];
}

const FACES = {
  // side-eye: both eyes slid to one side under flat half lids, flat mouth
  sideEye: face({ eyes: { dx: 10 }, lids: { y: -15, op: 100 }, m: MOUTHS.focus }),
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
  shocked: face({ eyes: { w: 22, h: 44, rad: 11, y: -4 }, lids: { y: -31, h: 8 }, m: JAW, f: { y: -68 } }),   // thin lids parked just above the tall eyes, still inside his head
  // awkward: eyes looking away, a small tight mouth, a little head tilt
  awkward: face({ eyes: { dx: -5, h: 30 }, m: MOUTHS.listen, f: { r: 3 } }),
  // crying-laughing (redone: a still face can't laugh): a 0.8 s loop - head bobbing up on every 'ha', mouth wide open and
  // half closing on the beat, squeezed tilted eyes shaking with it, a little side-to-side rock
  cryLaugh: { frames: 48, keys: (() => {
    const base = face({ eyeL: { w: 22, h: 6, rad: 3, y: 2, r: 18 }, eyeR: { w: 22, h: 6, rad: 3, y: 2, r: -18 }, m: MOUTHS.laugh }).filter((k) => !(k.objectId === ids.face && [14, 15].includes(k.propertyKey)) && !(k.objectId === eL.id && k.propertyKey === 14) && !(k.objectId === eR.id && k.propertyKey === 14));
    const beats = [0, 8, 16, 24, 32, 40], up = [], rot = [], ey = [], m = [];
    beats.forEach((b, i) => { up.push([b, -66, OUT], [b + 4, -70, IN]); rot.push([b, i % 2 ? -3 : 3, SINE]); ey.push([b, 2, OUT], [b + 4, 0, IN]); m.push(...mouth(MOUTHS.laugh, b, SINE), ...mouth(VIS('EH'), b + 4, SINE)); });
    up.push([48, -66]); rot.push([48, 3]); ey.push([48, 2]);
    return [...base.filter((k) => !ids.mouthShape.verts.includes(k.objectId)), ...T(ids.face, 'y', up), ...T(ids.face, 'r', rot), ...T(eL.id, 'y', ey), ...T(eR.id, 'y', ey), ...m, ...mouth(MOUTHS.laugh, 48, SINE)];
  })() },
  // bored: half lids, eyes drifting up and to the side, a flat sleepy mouth, head tipped
  bored: face({ eyes: { dx: -4, y: -2 }, lids: { y: -12, op: 100 }, m: MOUTHS.sleepy, f: { r: -4 } }),
  // batch 5 (2026-10-30)
  // hmph: a pout - eyes shut tight and tilted, a small tight mouth, head turned away
  hmph: face({ eyeL: { w: 22, h: 6, rad: 3, y: 2, r: -8 }, eyeR: { w: 22, h: 6, rad: 3, y: 2, r: 8 }, m: MOUTHS.listen, f: { r: -9 } }),
  // squint: narrowed eyes trying to make something out, mouth pulled to one side
  squint: face({ eyes: { w: 20, h: 10, rad: 5, y: 2 }, m: MOUTHS.think, f: { r: 3 } }),
  // innocent "who, me?": eyes up and away, a small whistling mouth, head tipped
  innocent: face({ eyes: { y: -6, dx: 3 }, m: VIS('OO'), f: { r: 5 } }),
  // excited: big wide eyes, a wide open smile
  excited: face({ eyes: { w: 22, h: 40, rad: 11, y: -3 }, lids: { y: -34 }, m: MOUTHS.laugh, f: { y: -68 } }),
  // speechless: little dot eyes and no mouth at all
  speechless: face({ eyes: { w: 10, h: 10, rad: 5, y: 2 }, m: DOT }),   // a dot, not a faded-out mouth (a fading mouth shows grey)
  // nervous grin: eyes a touch wide and looking away, teeth showing in a tight grin
  nervousGrin: face({ eyes: { dx: -4, h: 36 }, m: VIS('TEETH'), f: { r: 2 } }),
  // content: eyes shut in calm lines, a soft smile, head resting to one side
  content: face({ eyes: { w: 22, h: 6, rad: 3, y: 4 }, m: MOUTHS.happy, f: { r: -3 } }),
  // thinking hard: one eye shut, the other up and aside, mouth twisted
  thinkingHard: face({ eyeL: { w: 20, h: 6, rad: 3, y: 3 }, eyeR: { y: -4, dx: 2 }, m: MOUTHS.think, f: { r: 6 } }),
  // batch 6 (2026-10-30)
  // angry: lids in a hard V, eyes narrowed, teeth gritted (never sad, so no frown)
  angry: face({ eyes: { h: 30, y: 2 }, lidL: { y: -13, r: 18, op: 100 }, lidR: { y: -13, r: -18, op: 100 }, m: VIS('TEETH') }),
  // smug: flat half lids, the proud lopsided smirk, head tipped back a little
  smugFace: face({ lids: { y: -14, op: 100 }, m: MOUTHS.proud, f: { r: -4 } }),
  // worried: lids slanting up in the middle, eyes a little wide, a small tight mouth
  worried: face({ eyes: { h: 36, dx: -2 }, lidL: { y: -17, r: -12, op: 100 }, lidR: { y: -17, r: 12, op: 100 }, m: MOUTHS.listen }),
  // woozy: eyes of different sizes at odd angles, a wobbly mouth, head lolling
  woozy: face({ eyeL: { w: 22, h: 22, rad: 11, r: 20, y: 2 }, eyeR: { w: 14, h: 30, rad: 7, r: -15 }, m: MOUTHS.confused, f: { r: 8 } }),
  // tired: heavy flat lids, eyes sagging low, a sleepy mouth, head dropped a little
  tired: face({ eyes: { y: 3 }, lids: { y: -10, op: 100 }, m: MOUTHS.sleepy, f: { y: -64 } }),
  // delighted: big round eyes and the biggest smile
  delighted: face({ eyes: { w: 22, h: 40, rad: 11, y: -3 }, lids: { y: -34 }, m: MOUTHS.happy, f: { y: -67 } }),
  // judging: one lid low and flat, eyes slid aside, a flat mouth
  judging: face({ eyes: { dx: 3 }, lidL: { y: -10, op: 100 }, lidR: { y: -28, h: 8 }, m: MOUTHS.focus, f: { r: 3 } }),
  // flirty: a slow wink on one side, a half lid on the other, the proud smirk (the Asalim pack)
  flirty: face({ eyeL: { w: 22, h: 6, rad: 3, y: 2, r: -6 }, lidL: { y: -28, h: 8 }, lidR: { y: -16, op: 100 }, m: MOUTHS.proud, f: { r: -5 } }),
  // cocky: half lids, eyes a touch aside, the smirk, chin up
  cocky: face({ eyes: { dx: 2 }, lids: { y: -16, op: 100 }, m: MOUTHS.proud, f: { r: 6 } }),
  // scared: tall wide eyes darting aside at the threat, gritted teeth, head pulled down and back
  scared: face({ eyes: { w: 18, h: 40, rad: 9, y: -3, dx: -6 }, lids: { y: -30, h: 8 }, m: VIS('TEETH'), f: { y: -62, r: -4 } }),
  // puzzled: one eye big, one small, a crooked mouth, head tilted right over
  puzzled: face({ eyeL: { h: 40, w: 20, rad: 10, y: -3 }, eyeR: { h: 20, y: 3 }, lidL: { y: -29, h: 8 }, lidR: { y: -28, h: 8 }, m: MOUTHS.confused, f: { r: -10 } }),
  // hungry: eyes up dreaming of food, mouth hanging open
  hungry: face({ eyes: { y: -5 }, m: VIS('AA'), f: { r: 3 } }),
  // dreamy: eyes drifting up under soft lids, a gentle smile, head tipped
  dreamy: face({ eyes: { y: -6, h: 28 }, lids: { y: -18, op: 100 }, m: MOUTHS.happy, f: { r: -6 } }),
  // serious: straight eyes, lids lowered a touch, a flat mouth, no smirk
  serious: face({ lids: { y: -20, op: 100 }, m: MOUTHS.focus }),
  // evil laugh: a 0.8 s loop - the grin's slanted lids, the head bobbing on each "mwa-ha", mouth opening and closing
  evilLaugh: { frames: 48, keys: (() => {
    const base = face({ lidL: { y: -15, r: 12, op: 100 }, lidR: { y: -15, r: -12, op: 100 }, m: MOUTHS.laugh }).filter((k) => !(k.objectId === ids.face && [14, 15].includes(k.propertyKey)));
    const beats = [0, 8, 16, 24, 32, 40], up = [], rot = [], m = [];
    beats.forEach((b, i) => { up.push([b, -66, OUT], [b + 4, -69, IN]); rot.push([b, i % 2 ? -2 : 2, SINE]); m.push(...mouth(MOUTHS.laugh, b, SINE), ...mouth(VIS('EH'), b + 4, SINE)); });
    up.push([48, -66]); rot.push([48, 2]);
    return [...base.filter((k) => !ids.mouthShape.verts.includes(k.objectId)), ...T(ids.face, 'y', up), ...T(ids.face, 'r', rot), ...m, ...mouth(MOUTHS.laugh, 48, SINE)];
  })() },
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const names = Object.keys(FACES);
  const en = (await vme('listDataEnums', {})).dataEnums.find((e) => e.name === 'DombiMood');
  const missing = names.filter((n) => !en.values.some((v) => v.key === n));
  if (missing.length) await vme('addDataEnumValues', { dataEnumName: 'DombiMood', values: missing });
  // a face is a still pose (6 frames) or a loop { frames, keys }
  for (const n of names) { const f = FACES[n], loop = !Array.isArray(f); await newAnim('face/' + n, loop ? f.frames : 6); await anim('face/' + n, loop ? f.frames : 6, loop ? f.keys : f, loop ? 1 : 0); }

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
