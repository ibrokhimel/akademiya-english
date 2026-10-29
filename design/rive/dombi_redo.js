// Dombi redo, batch 1 (2026-10-29): the owner marked these "doesn't animate properly" on the speak lab's action page.
//   face/listen : the old one tilted the eyes inside a still body (read as a skewed face). Now upright, wide-awake eyes, a slow small nod.
//   play/sleep  : the old one only slumped and waited for the app to set mood = sleepy, so on its own nothing showed.
//                 Now it is whole: eyes shut, sleepy mouth, slow deep breath, two Z's drifting up in turn.
//   play/peek   : the old one leaned over a card edge with two grey hand dots stuck under him. Now he sinks and leans out
//                 sideways like he's peeking round a corner, half-lidded, eyes darting; no hands. The page puts him at an edge.
// Play is a later layer than Face, so play/* may key eyes, lids, mouth and Z's while active; Face takes them back after.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { shapeOf } = require('../icons/mouth_geo');
const { polar, VK } = require('./dombi_mouth');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18, w: 20, h: 21, rad: 31 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 }, IN = { x1: 0.3, y1: 0, x2: 0.8, y2: 0.15 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });

const key = (objectId, propertyKey, frame, value, c = SINE) => c === 'hold' ? { objectId, propertyKey, frame, value, interpolationType: 'hold' }
  : { objectId, propertyKey, frame, value, interpolationType: 'cubic', cubicParams: c };
const T = (objectId, p, list) => list.map(([f, v, c]) => key(objectId, K[p], f, v, c));
const H = (objectId, props) => Object.entries(props).map(([p, v]) => key(objectId, K[p], 0, v, 'hold'));
const dedupe = (keys) => { const m = new Map(); for (const k of keys) m.set(`${k.objectId}|${k.propertyKey}|${k.frame}`, k); return [...m.values()]; };
const FACE = { x: 100, y: 104 };
const local = (v) => ({ p: [v.p[0] - FACE.x, v.p[1] - FACE.y], in: [v.in[0] - FACE.x, v.in[1] - FACE.y], out: [v.out[0] - FACE.x, v.out[1] - FACE.y] });
const REF = shapeOf(MOUTHS.smirk).map(local).map(v => polar(v));
const mouth = (m, frame = 0, c = 'hold') => shapeOf(m).map(local).flatMap((v, i) => { const pv = polar(v, REF[i]);
  return Object.entries(VK).map(([kk, pk]) => key(ids.mouthShape.verts[i], pk, frame, +pv[kk].toFixed(3), c)); });
const [eL, eR, lL, lR] = ids.eyeShapes;
// eyes as the rig draws them: shape x/y/r/op + the rounded-rect path w/h/radius (y relative to the eye row at 95)
const eyes = (l, r = l) => [...H(eL.id, { x: -25 + (l.dx || 0), y: l.y, r: 0, op: 100 }), ...H(eL.pathId, { w: l.w, h: l.h, rad: l.rad }),
  ...H(eR.id, { x: 25 + (r.dx || 0), y: r.y, r: 0, op: 100 }), ...H(eR.pathId, { w: r.w, h: r.h, rad: r.rad })];
const lidsOff = [...H(lL.id, { x: -25, y: -25, r: 0, op: 0 }), ...H(lR.id, { x: 25, y: -25, r: 0, op: 0 }), ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 })];
const zOff = [...H(ids.z1, { sx: 0, sy: 0, op: 0 }), ...H(ids.z2, { sx: 0, sy: 0, op: 0 })];

async function anim(name, frames, keys, loop = 0) {
  const id = mids.anims[name]; if (!id) throw new Error('no animation ' + name);
  const q = await ae('queryKeyFrames', { animationIds: [id] }); const old = (q.keyframes[id] || []).map(x => x.keyframeId);
  if (old.length) await ae('modifyKeyFrames', { animationId: id, delete: old });
  await call('set_property_values', { propertyValues: { [id]: { 56: 60, 57: frames, 59: loop } } });
  const add = dedupe(keys);
  for (let i = 0; i < add.length; i += 300) await ae('modifyKeyFrames', { animationId: id, add: add.slice(i, i + 300) });
  console.log(name, add.length, 'keys,', frames, 'frames', loop ? 'loop' : 'once');
}

const P = ids.pose, E = ids.eyes, OWN = [...H(ids.face, { sx: 100 })];
const noHands = [...H(ids.handL, { sx: 0, sy: 0 }), ...H(ids.handR, { sx: 0, sy: 0 }), ...H(ids.handRFront, { sx: 0, sy: 0 }), ...H(ids.armL, { r: 0 }), ...H(ids.armR, { r: 0 })];

const REDO = {
  // listening: upright face, eyes a touch taller and higher (interested), the friendly closed smirk, a slow small nod twice per loop
  'face/listen': [150, 1, [...eyes({ y: -3, w: 20, h: 37, rad: 10 }), ...lidsOff, ...mouth(MOUTHS.smirk), ...zOff, ...H(ids.mouthShape.id, { op: 100 }),
    ...H(ids.face, { x: 0, r: 0 }), ...T(ids.face, 'y', [[0, -66], [34, -68, SINE], [62, -66], [100, -67.5], [128, -66], [150, -66]])]],
  // asleep: shut eyes, tiny mouth, head tipped, slow deep breath (in 40 % / out 60 %), Z's rise and fade one after the other
  'play/sleep': [240, 1, [...OWN, ...noHands, ...eyes({ y: 6, w: 22, h: 6, rad: 3 }), ...lidsOff, ...mouth(MOUTHS.sleepy),
    ...H(ids.face, { x: 0, r: -6 }), ...T(ids.face, 'y', [[0, -64], [96, -66.5], [240, -64]]),
    ...H(P, { x: 0, r: -3 }), ...T(P, 'y', [[0, 4], [96, 2], [240, 4]]), ...T(P, 'sy', [[0, 95], [96, 98.5], [240, 95]]), ...T(P, 'sx', [[0, 105], [96, 101.5], [240, 105]]),
    ...H(ids.z1, { x: 60 }), ...T(ids.z1, 'y', [[0, -112], [240, -146]]), ...T(ids.z1, 'op', [[0, 0], [40, 100], [170, 100], [240, 0]]),
    ...T(ids.z1, 'sx', [[0, 55], [240, 100]]), ...T(ids.z1, 'sy', [[0, 55], [240, 100]]),
    ...H(ids.z2, { x: 80 }), ...T(ids.z2, 'y', [[0, -129], [120, -146, 'hold'], [121, -112], [240, -129]]),
    ...T(ids.z2, 'op', [[0, 100], [50, 100], [120, 0, 'hold'], [121, 0], [160, 100], [240, 100]]),
    ...T(ids.z2, 'sx', [[0, 78], [120, 100, 'hold'], [121, 55], [240, 78]]), ...T(ids.z2, 'sy', [[0, 78], [120, 100, 'hold'], [121, 55], [240, 78]])]],
  // peeking round a corner: low and leaning out, half-lidded, eyes dart out - back - out; a slow bob so he never freezes
  'play/peek': [180, 1, [...OWN, ...noHands, ...zOff,
    ...H(P, { r: 13, x: 16 }), ...T(P, 'y', [[0, 6], [90, 4], [180, 6]]), ...H(P, { sx: 103, sy: 97 }),
    ...H(lL.id, { x: -25, y: -14, r: 0, op: 100 }), ...H(lR.id, { x: 25, y: -14, r: 0, op: 100 }), ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 }),
    ...T(E, 'x', [[0, 5], [58, 5, OUT], [62, -4], [104, -4, OUT], [108, 6], [150, 6, OUT], [156, 5], [180, 5]]),
    ...T(E, 'y', [[0, -8], [58, -8, OUT], [62, -9], [104, -9, OUT], [108, -7], [150, -7, OUT], [156, -8], [180, -8]])]],
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const only = process.argv.slice(2);
  for (const [name, [frames, loop, keys]] of Object.entries(REDO)) if (!only.length || only.includes(name)) await anim(name, frames, keys, loop);
}
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const save = () => fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1));
async function newAnim(name, frames) {
  if (mids.anims[name]) return;
  const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
  mids.anims[name] = (r.animations || r.linearAnimations)[0].id; save();
}
// a new one-shot state: Any --trigger--> state --exit 100 %--> back; both interruptible
async function wire(layerName, stateName, trigger, back) {
  let sm = await ae('queryStateMachine', {});
  let L = sm.layers.find(l => l.layerName === layerName), nm = (id) => (L.states.find(s => s.id === id) || {}).name;
  if (!L.states.some(s => s.name === stateName)) {
    await ae('createStates', { layerId: L.layerId || L.id, states: [{ name: stateName, linearAnimationName: stateName, x: 900, y: 300 }] });
    sm = await ae('queryStateMachine', {}); L = sm.layers.find(l => l.layerName === layerName);
  }
  const st = L.states.find(s => s.name === stateName), any = L.states.find(s => s.type === 'any'), to = L.states.find(s => s.name === back);
  const has = (a, b) => L.transitions.some(t => t.fromStateId === a && t.toStateId === b);
  const add = []; if (!has(any.id, st.id)) add.push({ id: any.id, transitions: [{ to: st.id }] }); if (!has(st.id, to.id)) add.push({ id: st.id, transitions: [{ to: to.id }] });
  if (add.length) { await ae('createTransitions', { states: add }); sm = await ae('queryStateMachine', {}); L = sm.layers.find(l => l.layerName === layerName); }
  const tIn = L.transitions.find(t => t.fromStateId === any.id && t.toStateId === st.id), tOut = L.transitions.find(t => t.fromStateId === st.id && t.toStateId === to.id);
  await call('set_property_values', { propertyValues: { [tIn.id]: { 152: F.enableEarlyExit, 158: 40, 349: 2 }, [tOut.id]: { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 120, 349: 2 } } });
  const vm = (await call('viewmodel_editor', { command: 'listViewModels', data: { listViewModels: {} } })).viewModels.find(v => v.name === 'Dombi');
  const prop = vm.viewModelProperties.find(p => p.name === trigger).id;
  if (!tIn.conditions.length) await ae('createConditions', { transitions: [{ id: tIn.id, conditions: [{ leftComparator: { viewModelPropertyId: prop } }] }] });
  // the trigger used to start another state in this layer: drop that old route so only the new one fires
  for (const t of L.transitions.filter(t => t.fromStateId === any.id && t.toStateId !== st.id && (t.conditions || []).some(c => (c.leftComparator || {}).viewModelPropertyName === trigger)))
    { await call('delete_objects', { objectIds: [t.id] }); console.log('removed old', trigger, 'route to', nm(t.toStateId)); }
  console.log('wired', layerName, trigger, '->', stateName, '->', back);
}


// shared helpers for PlayOnce one-shots (emotes): PlayOnce owns the 'once' group, so each one-shot keys all five of its props
// (unlisted ones hold neutral) and hides the props only one-shots use (shades, spit drop)
const once = (spec) => ['x', 'y', 'r', 'sx', 'sy'].flatMap((p) => T(ids.once, p, spec[p] || [[0, p[0] === 's' ? 100 : 0, 'hold']]))
  .concat(H(ids.shades, { op: 0, y: -9 }), ids.spitDrop ? H(ids.spitDrop, { op: 0 }) : [], ids.handLFront ? H(ids.handLFront, { sx: 0, sy: 0 }) : []);   // the second front hand stays hidden unless a one-shot shows it
const scale = (id, list) => [...T(id, 'sx', list), ...T(id, 'sy', list)];
const bothEyes = (p, list) => [...T(eL.pathId, p, list), ...T(eR.pathId, p, list)];
const bothEyesY = (list) => [...T(eL.id, 'y', list), ...T(eR.id, 'y', list)];
const eyesAt = [...H(eL.id, { x: -25, r: 0, op: 100 }), ...H(eR.id, { x: 25, r: 0, op: 100 })];
const lidsY = (yList, rot = 0) => [...T(lL.id, 'y', yList), ...T(lR.id, 'y', yList), ...H(lL.id, { x: -25, r: rot, op: 100 }), ...H(lR.id, { x: 25, r: -rot, op: 100 }),
  ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 })];
const allHandsOff = [...H(ids.handL, { sx: 0, sy: 0 }), ...H(ids.handR, { sx: 0, sy: 0 }), ...H(ids.handRFront, { sx: 0, sy: 0 })];
// eyes shut as lines (blissful, bowing, melting): from frame a to b
const shut = (a, b) => [...bothEyes('h', [[0, 34], [a, 34, OUT], [a + 5, 6], [b, 6, OUT], [b + 6, 34]]), ...bothEyes('w', [[0, 18], [a, 18, OUT], [a + 5, 22], [b, 22, OUT], [b + 6, 18]]),
  ...bothEyes('rad', [[0, 9], [a, 9, OUT], [a + 5, 3], [b, 3, OUT], [b + 6, 9]]), ...bothEyesY([[0, 0], [a, 0, OUT], [a + 5, 6], [b, 6, OUT], [b + 6, 0]])];

module.exports = { K, SINE, OUT, IN, ae, key, T, H, mouth, eL, eR, lL, lR, eyes, lidsOff, zOff, noHands, anim, newAnim, wire, F, once, scale, bothEyes, bothEyesY, eyesAt, lidsY, allHandsOff, shut };
if (require.main === module) main().catch(e => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
