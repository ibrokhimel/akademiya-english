// Dombi engine, stage 12: touch interactions (hold & carry, poke, pet, feed, high-five, tricks ...).
// The app does the physics (where he is, how fast he moves); Rive does the acting.
// New groups (identity): stage -> carry -> gum -> root (+ z1, z2)   and   root -> pose -> once -> act
//   carry : r <- VM `swing` (degrees), sx/sy <- VM `squish` (-100..100)      data-bound: jelly swing while carried / tilted
//   gum   : sx/sy <- VM `stretch` (0..100)                                   data-bound: pinch
//   pose  : layer Play     (persistent poses chosen by enum `play`)
//   once  : layer PlayOnce (one-shots fired by triggers; idle keys only its own things, so it releases everything else)
//   shades: sunglasses for one of the double-tap tricks (child of face)
// Both layers come after every other layer, so they override hands / eyes / mouth while active and hand them back after.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES } = require('../icons/dombi_visemes');
const { shapeOf } = require('../icons/mouth_geo');
const { polar, VK } = require('./dombi_mouth');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18, w: 20, h: 21 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const save = () => { fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1)); fs.writeFileSync(path.join(__dirname, 'dombi_machine_ids.json'), JSON.stringify(mids, null, 1)); };
const argb = (hex) => '#ff' + hex.slice(1).toLowerCase();

// ---- key helpers ----
const key = (objectId, propertyKey, frame, value, c = SINE) => c === 'hold' ? { objectId, propertyKey, frame, value, interpolationType: 'hold' }
  : { objectId, propertyKey, frame, value, interpolationType: 'cubic', cubicParams: c };
const T = (objectId, propertyKey, list) => list.map(([f, v, c]) => key(objectId, propertyKey, f, v, c));
const H = (objectId, props) => Object.entries(props).map(([p, v]) => key(objectId, K[p], 0, v, 'hold'));          // hold values from frame 0
const dedupe = (keys) => { const m = new Map(); for (const k of keys) m.set(`${k.objectId}|${k.propertyKey}|${k.frame}`, k); return [...m.values()]; };
const FACE = { x: 100, y: 104 };
const local = (v) => ({ p: [v.p[0] - FACE.x, v.p[1] - FACE.y], in: [v.in[0] - FACE.x, v.in[1] - FACE.y], out: [v.out[0] - FACE.x, v.out[1] - FACE.y] });
const REF = shapeOf(MOUTHS.smirk).map(local).map(v => polar(v));
const mouth = (m, frame = 0, c = 'hold') => shapeOf(m).map(local).flatMap((v, i) => { const pv = polar(v, REF[i]);
  return Object.entries(VK).map(([kk, pk]) => key(ids.mouthShape.verts[i], pk, frame, +pv[kk].toFixed(3), c)); });
const VIS = (name) => VISEMES.find(v => v.name === name);
const [eL, eR, lL, lR] = ids.eyeShapes;
const hand = (which, gx, gy) => which === 'L' ? { x: gx - 62, y: gy - 128 } : { x: gx - 138, y: gy - 128 };   // global 200-space -> from the shoulder
const lids = (y, op, rot = 0) => [...H(lL.id, { y, op, r: rot }), ...H(lR.id, { y, op, r: -rot })];

async function group(name, parentId, x = 0, y = 0) {
  const r = await call('group_editor', { name, parentId });
  await call('set_property_values', { propertyValues: { [r.group.id]: { [K.x]: x, [K.y]: y } } });
  return r.group.id;
}
async function anim(name, frames, keys, loop = 0) {
  if (!mids.anims[name]) { const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] }); mids.anims[name] = (r.animations || r.linearAnimations)[0].id; }
  else { const q = await ae('queryKeyFrames', { animationIds: [mids.anims[name]] }); const old = (q.keyframes[mids.anims[name]] || []).map(x => x.keyframeId); if (old.length) await ae('modifyKeyFrames', { animationId: mids.anims[name], delete: old }); }
  await call('set_property_values', { propertyValues: { [mids.anims[name]]: { 56: 60, 57: frames, 59: loop } } });
  const add = dedupe(keys);
  for (let i = 0; i < add.length; i += 300) await ae('modifyKeyFrames', { animationId: mids.anims[name], add: add.slice(i, i + 300) });
}

const PLAY = ['none', 'held', 'walk', 'pet', 'peek', 'warm', 'sleep', 'wind', 'highfive', 'back'];
const ONCE = ['hop', 'land', 'smug', 'poke1', 'poke2', 'poke3', 'eat', 'ahem', 'clap', 'playoff', 'wake', 'snap', 'trickSpin', 'trickFlick', 'trickShades', 'dizzy', 'shook'];

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  // ---------- rig ----------
  if (!ids.carry) {
    ids.carry = await group('carry', ids.stage); ids.gum = await group('gum', ids.carry);
    for (const c of [ids.z2, ids.z1, ids.root]) await call('reparent_objects', { operations: [{ objectId: c, newParentId: ids.gum, position: 'end' }] });
    await call('set_property_values', { propertyValues: { [ids.root]: { [K.x]: 0, [K.y]: 0 }, [ids.z1]: { [K.x]: 60, [K.y]: -118 }, [ids.z2]: { [K.x]: 78, [K.y]: -140 } } });
    ids.pose = await group('pose', ids.root); ids.once = await group('once', ids.pose);
    await call('reparent_objects', { operations: [{ objectId: ids.act, newParentId: ids.once }] });
    await call('set_property_values', { propertyValues: { [ids.act]: { [K.x]: 0, [K.y]: 0 } } });
    save();
  }
  if (!ids.shades) {
    ids.shades = await group('shades', ids.face, 0, -9);
    const dark = argb('#0E0E16'), rect = (name, x, y, w, h, r, color) => ({ primitive: 'rectangle', name, parentId: ids.shades, x, y, width: w, height: h, cornerRadius: r, paints: [{ paintType: 'fill', color }] });
    const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [
      rect('bridge', 0, -6, 30, 6, 3, dark), rect('lensL', -25, 0, 34, 26, 10, dark), rect('lensR', 25, 0, 34, 26, 10, dark),
      rect('glintL', -30, -2, 4, 13, 2, argb('#FFFFFF')), rect('glintR', 20, -2, 4, 13, 2, argb('#FFFFFF'))] } } });
    ids.shadesShapes = r.shapes.map(x => x.id);
    await call('reorder_objects', { operations: [{ objectId: ids.shades, order: 'sendToFront' }] });
    await call('set_property_values', { propertyValues: { [ids.shades]: { [K.op]: 0 }, [ids.shadesShapes[3]]: { [K.r]: 28 }, [ids.shadesShapes[4]]: { [K.r]: 28 } } });
    save();
  }

  // ---------- view model ----------
  let vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  if (!vm.viewModelProperties.some(p => p.name === 'play')) {
    await vme('createDataEnums', { dataEnums: [{ name: 'DombiPlay', values: PLAY }] });
    await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: [{ name: 'play', propertyType: 'enum', enumName: 'DombiPlay' },
      ...['swing', 'squish', 'stretch'].map(name => ({ name, propertyType: 'number' })), ...ONCE.map(name => ({ name, propertyType: 'trigger' }))] }] });
    vm = (await vme('listViewModels', {})).viewModels.find(v => v.name === 'Dombi');
  }
  const prop = (n) => vm.viewModelProperties.find(p => p.name === n).id;
  if (!ids.playBound) {
    const mk = async (name, formula) => (await vme('createConverters', { converters: [{ converterType: 'formula', name, formula }] })).converters[0].id;
    const c = { rot: await mk('swing deg→rad', '{Input} * 0.0174533'), sqY: await mk('squish → tall', '1 + {Input} * 0.002'), sqX: await mk('squish → wide', '1 - {Input} * 0.0015'),
      stX: await mk('stretch → wide', '1 + {Input} * 0.007'), stY: await mk('stretch → flat', '1 - {Input} * 0.003') };
    await vme('databind', { viewModelId: vm.id, bindings: [
      { objectId: ids.carry, propertyKey: K.r, viewModelPropertyId: prop('swing'), converterId: c.rot },
      { objectId: ids.carry, propertyKey: K.sy, viewModelPropertyId: prop('squish'), converterId: c.sqY }, { objectId: ids.carry, propertyKey: K.sx, viewModelPropertyId: prop('squish'), converterId: c.sqX },
      { objectId: ids.gum, propertyKey: K.sx, viewModelPropertyId: prop('stretch'), converterId: c.stX }, { objectId: ids.gum, propertyKey: K.sy, viewModelPropertyId: prop('stretch'), converterId: c.stY }] });
    ids.playBound = true; save();
  }

  // ---------- Play timelines (persistent) ----------
  const P = ids.pose, O = ids.once, FA = ids.face, E = ids.eyes, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, AL = ids.armL, AR = ids.armR;
  const OWN = [...H(P, { x: 0, y: 0, r: 0, sx: 100, sy: 100 }), ...H(FA, { sx: 100 }), ...H(ids.z1, { x: 60, y: -118 }), ...H(ids.z2, { x: 78, y: -140 })];   // only Play touches these
  const gripL = hand('L', 44, 152), gripR = hand('R', 156, 152);
  const handsAt = (l, r) => [...H(HL, { x: l.x, y: l.y, sx: 100, sy: 100 }), ...H(HR, { x: r.x, y: r.y, sx: 100, sy: 100 }), ...H(AL, { r: 0 }), ...H(AR, { r: 0 }), ...H(HF, { sx: 0, sy: 0 })];
  const play = {
    none: [6, 0, OWN],
    // lounging on your fingertip like you're the taxi: leaning back, half-lidded, both hands gripping below
    held: [120, 1, [...OWN, ...T(P, K.r, [[0, -4], [60, -5.5], [120, -4]]), ...T(P, K.sy, [[0, 97], [60, 98.5], [120, 97]]), ...T(P, K.sx, [[0, 103], [60, 101.5], [120, 103]]),
      ...handsAt(gripL, gripR), ...lids(-14, 100)]],
    // little hops while the app slides him back to his spot
    walk: [24, 1, [...OWN, ...T(P, K.y, [[0, 0, OUT], [10, -8, IN], [20, 0], [24, 0]]), ...T(P, K.sy, [[0, 94], [4, 104], [10, 102], [20, 92], [24, 94]]),
      ...T(P, K.sx, [[0, 106], [4, 96], [10, 98], [20, 108], [24, 106]]), ...H(P, { r: 4 })]],
    // being rubbed: tolerates it, eyes half closed, slow sway
    pet: [90, 1, [...OWN, ...T(P, K.r, [[0, -2], [45, 2], [90, -2]]), ...H(P, { sy: 97, sx: 103 }), ...lids(-10, 100), ...mouth(MOUTHS.listen)]],
    // sitting on a card, leaning over the edge to peek at it
    peek: [40, 0, [...OWN, ...T(P, K.r, [[0, 0, OUT], [12, 9], [18, 8], [40, 8]]), ...T(P, K.sy, [[0, 100, OUT], [12, 95], [40, 95]]), ...T(P, K.sx, [[0, 100, OUT], [12, 105], [40, 105]]),
      ...T(E, K.x, [[0, 0, OUT], [10, 2], [40, 2]]), ...T(E, K.y, [[0, -9, OUT], [10, -4], [40, -4]]), ...handsAt(hand('L', 44, 154), hand('R', 156, 154))]],
    // warming both hands at the flame on his right
    warm: [60, 1, [...OWN, ...H(P, { r: 5, sy: 98, sx: 102 }), ...H(HL, { x: 0, y: 0, sx: 100, sy: 100 }), ...H(AL, { r: 0 }), ...H(AR, { r: 0 }),
      ...T(HR, K.x, [[0, 34], [15, 37], [30, 34], [45, 37], [60, 34]]), ...H(HR, { y: 20, sx: 100, sy: 100 }),
      ...T(HF, K.x, [[0, 52], [15, 49], [30, 52], [45, 49], [60, 52]]), ...H(HF, { y: -14, sx: 100, sy: 100 }), ...lids(-12, 100)]],
    // asleep: slumped, slow deep breath, Z's drifting up (the app also sets mood = sleepy)
    sleep: [240, 1, [...OWN, ...T(P, K.sy, [[0, 95], [120, 97.5], [240, 95]]), ...T(P, K.sx, [[0, 105], [120, 102.5], [240, 105]]), ...H(P, { r: -3 }),
      ...T(ids.z1, K.y, [[0, -118], [120, -127], [240, -118]]), ...T(ids.z2, K.y, [[0, -146], [60, -151], [180, -139], [240, -146]])]],
    // blown at: leaning back, fluttering, eyes squinting
    wind: [40, 1, [...OWN, ...T(P, K.r, [[0, -14], [10, -17], [20, -13.5], [30, -16.5], [40, -14]]), ...H(P, { sx: 104, sy: 96, x: -4 }), ...H(E, { sy: 45, sx: 104 }), ...mouth(MOUTHS.oops)]],
    // one hand offered for a high-five, eyes on it
    highfive: [60, 1, [...OWN, ...H(P, { r: 2 }), ...H(HR, { x: 38, sx: 100, sy: 100 }), ...T(HR, K.y, [[0, -72], [30, -76], [60, -72]]), ...H(AR, { r: 0 }), ...H(E, { x: 3.5, y: -11 })]],
    // fed up with being poked: turns his back (the face slides round and is gone)
    back: [14, 0, [...OWN, ...T(FA, K.sx, [[0, 100, IN], [10, 0], [14, 0]]), ...T(FA, K.x, [[0, 0, IN], [10, 26], [14, 26]]), ...T(P, K.sx, [[0, 100], [5, 92], [10, 100], [14, 100]])]],
  };
  for (const [n, [frames, loop, keys]] of Object.entries(play)) await anim('play/' + n, frames, keys, loop);

  // ---------- PlayOnce timelines (one-shots) ----------
  const S = ids.shades, [, , , gL, gR] = ids.shadesShapes;
  const IDLE = [...H(O, { x: 0, y: 0, r: 0, sx: 100, sy: 100 }), ...H(S, { op: 0, y: -9 })];
  const o = (frames, spec) => ['x', 'y', 'r', 'sx', 'sy'].flatMap(p => T(O, K[p], spec[p] || [[0, p[0] === 's' ? 100 : 0, 'hold']])).concat(H(S, { op: 0, y: -9 }));
  const blinkShut = (f0, hold, open) => [...T(E, K.sy, [[f0, 100, IN], [f0 + 8, 10], [f0 + 8 + hold, 10, OUT], [f0 + 8 + hold + open, 100]]), ...T(E, K.sx, [[f0, 100, IN], [f0 + 8, 107], [f0 + 8 + hold, 107, OUT], [f0 + 8 + hold + open, 100]])];
  const wob = (a) => ({ sx: [[0, 100, OUT], [3, 100 + a, SINE], [9, 100 - a * 0.6], [15, 100 + a * 0.35], [21, 100 - a * 0.15], [27, 100]], sy: [[0, 100, OUT], [3, 100 - a * 0.85, SINE], [9, 100 + a * 0.5], [15, 100 - a * 0.28], [21, 100 + a * 0.1], [27, 100]] });
  const focusLids = (from, to) => [...T(lL.id, K.op, [[0, 0, 'hold'], [from, 100, 'hold'], [to, 0, 'hold']]), ...T(lR.id, K.op, [[0, 0, 'hold'], [from, 100, 'hold'], [to, 0, 'hold']]),
    ...H(lL.id, { y: -15, r: 14 }), ...H(lR.id, { y: -15, r: -14 })];
  const once = {
    // hop onto the fingertip: squash, jump, land, small bounce
    hop: [30, [...o(30, { sy: [[0, 100, OUT], [6, 82, OUT], [12, 112], [16, 104, IN], [20, 88, OUT], [25, 103], [30, 100]], sx: [[0, 100, OUT], [6, 118, OUT], [12, 90], [16, 97, IN], [20, 112, OUT], [25, 98], [30, 100]],
      y: [[0, 0], [6, 0, OUT], [13, -24, IN], [20, 0], [30, 0]] })]],
    // landing: flat squash held for 80 ms (hit-stop), rebound, then shakes it off
    land: [40, [...o(40, { sy: [[0, 74, 'hold'], [5, 74, OUT], [11, 108], [16, 97], [20, 100], [40, 100]], sx: [[0, 128, 'hold'], [5, 128, OUT], [11, 94], [16, 102], [20, 100], [40, 100]],
      r: [[0, 0], [20, 0], [23, -7], [27, 6], [31, -4], [35, 3], [39, 0], [40, 0]] }), ...T(E, K.sy, [[0, 10, 'hold'], [8, 10, OUT], [14, 100], [40, 100]]), ...T(E, K.sx, [[0, 107, 'hold'], [8, 107, OUT], [14, 100], [40, 100]])]],
    // slow smug blink after landing on his feet
    smug: [64, [...o(64, { r: [[0, 0], [8, -3], [40, -3], [60, 0], [64, 0]] }), ...blinkShut(0, 14, 12), ...T(E, K.sy, [[64, 100]]),
      ...T(lL.id, K.op, [[0, 0, 'hold'], [8, 100, 'hold'], [52, 0, 'hold']]), ...T(lR.id, K.op, [[0, 0, 'hold'], [8, 100, 'hold'], [52, 0, 'hold']]), ...H(lL.id, { y: -14, r: 0 }), ...H(lR.id, { y: -14, r: 0 })]],
    // poke 1: jelly wobble + side-eye
    poke1: [32, [...o(32, wob(12)), ...T(E, K.x, [[0, 0, OUT], [4, 5], [22, 5], [30, 0], [32, 0]]), ...H(E, { y: -9 })]],
    // poke 2: bigger wobble, one lid drops (the raised-eyebrow look), longer side-eye
    poke2: [44, [...o(44, { ...wob(16), r: [[0, 0], [6, 3], [34, 3], [42, 0], [44, 0]] }), ...T(E, K.x, [[0, 0, OUT], [4, 5.5], [34, 5.5], [42, 0], [44, 0]]), ...H(E, { y: -9 }),
      ...T(lR.id, K.op, [[0, 0, 'hold'], [4, 100, 'hold'], [36, 0, 'hold']]), ...H(lR.id, { y: -12, r: 0 })]],
    // poke 3: a hand comes at the screen and pushes your finger away, annoyed lids
    poke3: [50, [...o(50, { r: [[0, 0], [8, 4], [28, 4], [40, 0], [50, 0]] }), ...H(HF, { x: 0, y: -62 }),
      ...T(HF, K.sx, [[0, 0, OUT], [8, 185], [12, 170], [28, 170, IN], [38, 0], [50, 0]]), ...T(HF, K.sy, [[0, 0, OUT], [8, 185], [12, 170], [28, 170, IN], [38, 0], [50, 0]]), ...focusLids(0, 40)]],
    // eating a word: open wide, chomp, chew twice, gulp, pleased
    eat: [60, [...o(60, { y: [[0, 0], [6, -3], [16, 2], [48, 0], [60, 0]], sy: [[0, 100], [16, 93], [22, 101], [27, 95], [32, 101], [37, 96], [44, 106], [52, 100], [60, 100]] }),
      ...mouth(VIS('AA'), 6, SINE), ...mouth(VIS('AA'), 12, IN), ...mouth(VIS('MBP'), 16, SINE), ...mouth(VIS('EH'), 22, SINE), ...mouth(VIS('MBP'), 27, SINE), ...mouth(VIS('EH'), 32, SINE),
      ...mouth(VIS('MBP'), 37, SINE), ...mouth(MOUTHS.happy, 48, 'hold'), ...mouth(MOUTHS.smirk, 0, SINE), ...T(E, K.sy, [[0, 100], [12, 100], [16, 60], [22, 100], [60, 100]])]],
    // after being petted: snaps out of it, looks away, "that was nothing"
    ahem: [44, [...o(44, { r: [[0, 0], [5, -2], [30, -2], [40, 0], [44, 0]] }), ...T(E, K.sy, [[0, 100, OUT], [3, 112], [24, 112], [34, 100], [44, 100]]), ...T(E, K.x, [[0, 0, OUT], [5, -5], [30, -5], [40, 0], [44, 0]]), ...H(E, { y: -9 }),
      ...mouth(MOUTHS.focus), ...H(lL.id, { op: 0 }), ...H(lR.id, { op: 0 })]],
    // high-five landed: the hand takes the hit and springs back
    clap: [30, [...o(30, { sy: [[0, 100], [3, 94], [9, 105], [16, 100], [30, 100]] }), ...H(HR, { x: 38, y: -74 }), ...T(HR, K.sx, [[0, 100, OUT], [3, 140], [9, 90], [14, 105], [20, 100], [30, 100]]),
      ...T(HR, K.sy, [[0, 100, OUT], [3, 140], [9, 90], [14, 105], [20, 100], [30, 100]]), ...T(AR, K.r, [[0, 0], [3, -10], [9, 6], [14, 0], [30, 0]]), ...T(E, K.sy, [[0, 100, OUT], [3, 115], [14, 115], [24, 100], [30, 100]])]],
    // high-five ignored: the hand goes up to smooth his head instead, eyes elsewhere
    playoff: [64, [...o(64, { r: [[0, 0], [10, -3], [40, -3], [54, 0], [64, 0]] }), ...T(HR, K.x, [[0, 38, OUT], [14, -20], [24, -8], [34, -20, IN], [50, 0], [64, 0]]), ...T(HR, K.y, [[0, -72, OUT], [14, -98], [34, -98, IN], [50, 0], [64, 0]]),
      ...H(HR, { sx: 100, sy: 100 }), ...H(AR, { r: 0 }), ...T(E, K.x, [[0, 3.5, OUT], [8, -5], [40, -5], [52, 0], [64, 0]]), ...T(E, K.y, [[0, -11], [8, -11], [52, -9], [64, -9]])]],
    // waking: one eye opens first, then the other, then a stretch
    wake: [96, [...o(96, { sy: [[0, 100], [64, 100], [72, 108], [82, 97], [90, 100], [96, 100]], sx: [[0, 100], [64, 100], [72, 94], [82, 102], [90, 100], [96, 100]] }),
      ...T(eR.pathId, K.h, [[0, 6, 'hold'], [8, 6, OUT], [18, 36], [22, 34], [96, 34]]), ...T(eR.pathId, K.w, [[0, 22, 'hold'], [8, 22, OUT], [18, 18], [96, 18]]), ...T(eR.id, K.y, [[0, 6, 'hold'], [8, 6, OUT], [18, 0], [96, 0]]),
      ...T(eL.pathId, K.h, [[0, 6, 'hold'], [50, 6, OUT], [60, 36], [64, 34], [96, 34]]), ...T(eL.pathId, K.w, [[0, 22, 'hold'], [50, 22, OUT], [60, 18], [96, 18]]), ...T(eL.id, K.y, [[0, 6, 'hold'], [50, 6, OUT], [60, 0], [96, 0]])]],
    // pinch released: snaps back like gum
    snap: [30, [...o(30, { sx: [[0, 84, OUT], [5, 110], [11, 95], [17, 103], [23, 99], [30, 100]], sy: [[0, 112, OUT], [5, 93], [11, 104], [17, 98], [23, 101], [30, 100]] })]],
    // trick: a spin (flips round like a coin) with a hop
    trickSpin: [40, [...o(40, { sx: [[0, 100, IN], [6, 0, 'hold'], [6, 0, OUT], [12, -100, IN], [18, 0, OUT], [24, 100], [40, 100]], y: [[0, 0, OUT], [12, -12, IN], [24, 0], [40, 0]],
      sy: [[0, 100], [24, 100], [27, 90], [33, 104], [40, 100]] })]],
    // trick: hand flick
    trickFlick: [44, [...o(44, { r: [[0, 0], [8, -3], [30, -3], [40, 0], [44, 0]] }), ...T(HR, K.x, [[0, 0, OUT], [7, 44], [30, 44, IN], [42, 0], [44, 0]]), ...T(HR, K.y, [[0, 0, OUT], [7, -50], [30, -50, IN], [42, 0], [44, 0]]),
      ...T(HR, K.sx, [[0, 100], [10, 100], [13, 125], [18, 100], [44, 100]]), ...T(HR, K.sy, [[0, 100], [10, 100], [13, 125], [18, 100], [44, 100]]), ...T(AR, K.r, [[0, 0], [7, 0, IN], [10, -24, OUT], [13, 14], [17, 0], [44, 0]])]],
    // trick: sunglasses drop on, glint, slide off
    trickShades: [96, [...o(96, { r: [[0, 0], [9, 0], [13, 2.5], [20, 0], [96, 0]], sy: [[0, 100], [9, 100], [12, 96], [18, 100], [96, 100]] }),
      ...T(S, K.y, [[0, -70, OUT], [9, -6], [13, -9], [76, -9, IN], [88, -70], [96, -70]]), ...T(S, K.op, [[0, 100, 'hold'], [88, 0, 'hold']]),
      ...T(gL, K.x, [[0, -36, 'hold'], [18, -36, SINE], [32, -14], [96, -14]]), ...T(gR, K.x, [[0, 14, 'hold'], [18, 14, SINE], [32, 36], [96, 36]]),
      ...T(gL, K.op, [[0, 0, 'hold'], [18, 90, 'hold'], [32, 0, 'hold']]), ...T(gR, K.op, [[0, 0, 'hold'], [18, 90, 'hold'], [32, 0, 'hold']])]],
    // shaken while held: eyes go googly, body wobbles, then he shakes his head and steadies
    dizzy: [110, [...o(110, { r: [[0, 0], [10, 9], [22, -8], [34, 7], [46, -5], [58, 3], [70, 0], [76, -6], [81, 6], [86, -4], [91, 3], [96, 0], [110, 0]] }),
      ...T(E, K.x, [[0, 0], [8, 4], [16, -4], [24, 4], [32, -4], [40, 3], [48, -3], [60, 0], [110, 0]]), ...H(E, { y: -9 }),
      ...T(eL.id, K.y, [[0, 0], [8, -4], [16, 4], [24, -4], [32, 4], [40, -3], [48, 3], [60, 0], [110, 0]]), ...T(eR.id, K.y, [[0, 0], [8, 4], [16, -4], [24, 4], [32, -4], [40, 3], [48, -3], [60, 0], [110, 0]]),
      ...mouth(MOUTHS.confused, 0, 'hold'), ...mouth(MOUTHS.confused, 70, SINE), ...mouth(MOUTHS.smirk, 84, 'hold')]],
    // phone shaken: jiggle, then an annoyed stare
    shook: [56, [...o(56, wob(18)), ...focusLids(6, 46), ...mouth(MOUTHS.focus)]],
  };
  await anim('once/idle', 6, IDLE);
  for (const [n, [frames, keys]] of Object.entries(once)) await anim('once/' + n, frames, keys);
  save();

  // ---------- layers ----------
  let sm = await ae('queryStateMachine', {});
  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  if (!sm.layers.some(l => l.layerName === 'Play')) {
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [
      { name: 'Play', states: PLAY.map((n, i) => st('play/' + n, 220 + (i % 4) * 190, Math.floor(i / 4) * 90)),
        otherTransitions: [{ from: '{Entry State}', to: 'play/none' }, ...PLAY.map(n => ({ from: '{Any State}', to: 'play/' + n }))] },
      { name: 'PlayOnce', states: [st('once/idle', 200, 0), ...ONCE.map((n, i) => st('once/' + n, 440 + (i % 4) * 190, Math.floor(i / 4) * 90 - 90))],
        otherTransitions: [{ from: '{Entry State}', to: 'once/idle' }, ...ONCE.flatMap(n => [{ from: '{Any State}', to: 'once/' + n }, { from: 'once/' + n, to: 'once/idle' }])] }] });
    sm = await ae('queryStateMachine', {});
  }
  const enums = (await vme('listDataEnums', {})).dataEnums.find(e => e.name === 'DombiPlay');
  const pv = {}, conds = [];
  const IN_MS = { none: 180, held: 120, walk: 100, pet: 200, peek: 150, warm: 200, sleep: 400, wind: 120, highfive: 150, back: 0 };
  for (const L of sm.layers.filter(l => l.layerName === 'Play' || l.layerName === 'PlayOnce')) {
    const nm = {}; for (const s of L.states) nm[s.id] = s.name || s.type;
    for (const t of L.transitions) {
      const from = nm[t.fromStateId], to = nm[t.toStateId];
      if (from === 'entry') continue;
      if (L.layerName === 'Play') { const v = to.slice(5); pv[t.id] = { 152: F.enableEarlyExit, 158: IN_MS[v], 349: 2 };
        if (!t.conditions.length) conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop('play') }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: v } }] }); }
      else if (to === 'once/idle') pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage | F.enableEarlyExit, 160: 100, 158: 120, 349: 2 };   // interruptible, or a trigger fired during the blend is lost
      else { pv[t.id] = { 152: F.enableEarlyExit, 158: 40, 349: 2 }; if (!t.conditions.length) conds.push({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: prop(to.slice(5)) } }] }); }
    }
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('play ready ·', PLAY.length, 'poses ·', ONCE.length, 'one-shots ·', conds.length, 'conditions · enum', enums ? enums.values.length : '?');
}
main().catch(e => { console.log('FAIL', String(e.stack).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exit(1); });
