// Dombi redo, batch 2 (2026-10-29): the other 13 the owner marked "doesn't animate properly".
// What was wrong, by kind:
//   - built for the touch playground, so on their own they began from a pose that wasn't there (clap, wake, pet)
//   - a big grey front hand covering his face (poke3), a hand dot sliding out and hovering (correct)
//   - a frozen face held with nothing else moving (ahem, shook, wrong), an angry V for "focus"
//   - `celebrate` was never wired to anything; `blink` is the quick automatic blink, too small to read as an action
// Every one-shot here is whole on its own: anticipation -> action -> hold -> settle, eyes lead, hands late.
// Frames are 60 fps. Hands: arm-local, (0, 0) is tucked behind the body; global = local + (62 | 138, 128).
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES } = require('../icons/dombi_visemes');
const { K, SINE, OUT, IN, ae, T, H, mouth, eL, eR, lL, lR, eyes, lidsOff, zOff, anim } = require('./dombi_redo');
const VIS = (n) => VISEMES.find(v => v.name === n);
const F = { enableExitTime: 4, exitTimeIsPercentage: 8, enableEarlyExit: 32 };

const O = ids.once, E = ids.eyes, R = ids.react, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, AL = ids.armL, AR = ids.armR, S = ids.shades;
// PlayOnce owns `once`: every one-shot keys all five of its props (unlisted ones hold neutral) and hides the shades
const o = (spec) => ['x', 'y', 'r', 'sx', 'sy'].flatMap(p => T(O, p, spec[p] || [[0, p[0] === 's' ? 100 : 0, 'hold']])).concat(H(S, { op: 0, y: -9 }));
const both = (p, list) => [...T(eL.pathId, p, list), ...T(eR.pathId, p, list)];
const bothY = (list) => [...T(eL.id, 'y', list), ...T(eR.id, 'y', list)];
const eyeX = [...H(eL.id, { x: -25, r: 0, op: 100 }), ...H(eR.id, { x: 25, r: 0, op: 100 })];
const lids = (yList, rot = 0) => [...T(lL.id, 'y', yList), ...T(lR.id, 'y', yList), ...H(lL.id, { x: -25, r: rot, op: 100 }), ...H(lR.id, { x: 25, r: -rot, op: 100 }),
  ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 })];
const scale = (id, list) => [...T(id, 'sx', list), ...T(id, 'sy', list)];
const noFront = H(HF, { sx: 0, sy: 0 });

const BATCH = {
  // the one big "yes!": squash, jump, both hands pop at the top, laugh face on landing, 80 ms hit-stop, rebound
  'once/celebrate': [84, [...o({ sy: [[0, 100, OUT], [8, 86], [16, 112], [22, 106], [30, 108, IN], [36, 82, 'hold'], [41, 82, OUT], [50, 105], [58, 98], [66, 100]],
      sx: [[0, 100, OUT], [8, 112], [16, 92], [22, 96], [30, 94, IN], [36, 118, 'hold'], [41, 118, OUT], [50, 97], [58, 101], [66, 100]],
      y: [[0, 0], [8, 0, OUT], [22, -36], [26, -37, IN], [36, 0], [84, 0]] }),
    ...T(E, 'sy', [[0, 100, OUT], [8, 70], [16, 108], [34, 108], [38, 100], [84, 100]]), ...eyeX,
    ...both('h', [[0, 34, 'hold'], [36, 12], [84, 12]]), ...both('w', [[0, 18, 'hold'], [36, 22], [84, 22]]), ...both('rad', [[0, 9, 'hold'], [36, 6], [84, 6]]), ...bothY([[0, 0, 'hold'], [36, 1], [84, 1]]),
    ...mouth(MOUTHS.happy), ...mouth(MOUTHS.laugh, 36), ...noFront,
    ...H(HL, { x: -32, y: -78 }), ...H(HR, { x: 32, y: -78 }), ...scale(HL, [[0, 0], [12, 0, OUT], [20, 115], [25, 100], [66, 100, IN], [76, 0], [84, 0]]),
    ...scale(HR, [[0, 0], [14, 0, OUT], [22, 115], [27, 100], [66, 100, IN], [76, 0], [84, 0]]),
    ...T(AL, 'r', [[0, 0], [26, 0], [30, -14], [36, 0], [44, 10], [50, 0], [84, 0]]), ...T(AR, 'r', [[0, 0], [28, 0], [32, 14], [38, 0], [46, -10], [52, 0], [84, 0]])]],
  // high-five: the hand shoots up, takes the hit (squash), happy squint, body bounce, hand tucks away
  'once/clap': [40, [...o({ sy: [[0, 100], [9, 100, OUT], [12, 95], [18, 103], [24, 100], [40, 100]], sx: [[0, 100], [9, 100, OUT], [12, 104], [18, 98], [24, 100], [40, 100]] }),
    ...T(HR, 'x', [[0, 0, OUT], [6, 34], [26, 34, IN], [36, 0], [40, 0]]), ...T(HR, 'y', [[0, 0, OUT], [6, -82], [10, -78], [26, -80, IN], [36, 0], [40, 0]]),
    ...T(HR, 'sx', [[0, 100], [9, 100, OUT], [11, 135], [15, 90], [20, 104], [24, 100], [40, 100]]), ...T(HR, 'sy', [[0, 100], [9, 100, OUT], [11, 75], [15, 108], [20, 98], [24, 100], [40, 100]]),
    ...T(AR, 'r', [[0, 0], [9, 0, OUT], [11, -14], [16, 6], [22, 0], [40, 0]]), ...noFront, ...eyeX,
    ...both('h', [[0, 34], [9, 34, OUT], [11, 22], [30, 22], [38, 34], [40, 34]]), ...bothY([[0, 0], [9, 0, OUT], [11, 3], [30, 3], [38, 0], [40, 0]]), ...mouth(MOUTHS.happy)]],
  // phone shaken: rattles side to side with googly eyes, wobbles out of it, then a flat annoyed stare and a huff
  'once/shook': [80, [...o({ x: [[0, 0], [3, 7], [6, -7], [9, 6], [12, -6], [15, 5], [18, -4], [21, 2], [24, 0], [80, 0]],
      r: [[0, 0], [3, -6], [6, 6], [9, -5], [12, 5], [15, -3], [18, 2], [24, 0], [80, 0]],
      sy: [[0, 100], [24, 100, OUT], [28, 90], [34, 106], [40, 97], [46, 101], [50, 100], [54, 98], [60, 100], [80, 100]],
      sx: [[0, 100], [24, 100, OUT], [28, 110], [34, 95], [40, 102], [46, 99], [50, 100], [54, 102], [60, 100], [80, 100]],
      y: [[0, 0], [50, 0], [54, 2], [60, 0], [80, 0]] }),
    ...T(E, 'x', [[0, 0], [4, 4], [8, -4], [12, 4], [16, -3], [20, 2], [24, 0], [80, 0]]), ...T(E, 'y', [[0, -9], [80, -9]]),
    ...T(eL.id, 'y', [[0, 0], [4, -4], [8, 4], [12, -4], [16, 3], [20, -2], [24, 0], [80, 0]]), ...T(eR.id, 'y', [[0, 0], [4, 4], [8, -4], [12, 4], [16, -3], [20, 2], [24, 0], [80, 0]]),
    ...lids([[0, -25], [28, -25, OUT], [34, -15], [68, -15, IN], [76, -25], [80, -25]], 10), ...mouth(MOUTHS.oops), ...mouth(MOUTHS.focus, 28), ...mouth(MOUTHS.smirk, 74)]],
  // after being petted: "that was nothing" - a snap upright, a look away, two little throat-clear bobs, back with a smug half-lid
  'once/ahem': [56, [...o({ sy: [[0, 100, OUT], [4, 95], [10, 104], [16, 100], [20, 100], [23, 97], [26, 101], [29, 97], [32, 101], [38, 100], [56, 100]],
      sx: [[0, 100, OUT], [4, 104], [10, 97], [16, 100], [56, 100]], y: [[0, 0], [4, 0, OUT], [10, -5], [16, 0], [56, 0]], r: [[0, 0], [6, -3], [40, -3], [52, 0], [56, 0]] }),
    ...T(E, 'x', [[0, 0, OUT], [5, -5], [34, -5], [42, 0], [56, 0]]), ...T(E, 'y', [[0, -9, OUT], [5, -11], [34, -11], [42, -9], [56, -9]]),
    ...lids([[0, -25], [34, -25, OUT], [40, -15], [56, -15]]), ...mouth(MOUTHS.focus), ...mouth(MOUTHS.smirk, 40)]],
  // waking up: shut eyes, one cracks open, both pop wide ("huh?"), a big yawn-stretch with both hands, back to normal
  'once/wake': [100, [...o({ sy: [[0, 96], [36, 96, OUT], [40, 106], [46, 99], [52, 100], [60, 100, OUT], [70, 112], [80, 112, IN], [88, 96], [94, 101], [100, 100]],
      sx: [[0, 104], [36, 104, OUT], [40, 95], [46, 101], [52, 100], [60, 100, OUT], [70, 92], [80, 92, IN], [88, 104], [94, 99], [100, 100]],
      y: [[0, 0], [36, 0, OUT], [40, -6], [48, 0], [100, 0]], r: [[0, -4], [30, -4], [40, 0], [100, 0]] }), ...eyeX,
    ...T(eL.pathId, 'h', [[0, 6], [36, 6, OUT], [42, 40], [58, 40, IN], [64, 6], [82, 6, OUT], [92, 34], [100, 34]]),
    ...T(eR.pathId, 'h', [[0, 6], [16, 6, OUT], [22, 18], [36, 18, OUT], [42, 40], [58, 40, IN], [64, 6], [82, 6, OUT], [92, 34], [100, 34]]),
    ...both('w', [[0, 22], [36, 22, OUT], [42, 22], [82, 22, OUT], [92, 18], [100, 18]]),
    ...T(eL.pathId, 'rad', [[0, 3], [36, 3, OUT], [42, 11], [58, 11, IN], [64, 3], [82, 3, OUT], [92, 9], [100, 9]]),
    ...T(eR.pathId, 'rad', [[0, 3], [16, 3, OUT], [22, 6], [36, 6, OUT], [42, 11], [58, 11, IN], [64, 3], [82, 3, OUT], [92, 9], [100, 9]]),
    ...T(eL.id, 'y', [[0, 6], [36, 6, OUT], [42, -2], [58, -2, IN], [64, 6], [82, 6, OUT], [92, 0], [100, 0]]),
    ...T(eR.id, 'y', [[0, 6], [16, 6, OUT], [22, 3], [36, 3, OUT], [42, -2], [58, -2, IN], [64, 6], [82, 6, OUT], [92, 0], [100, 0]]),
    ...lidsOff, ...mouth(MOUTHS.sleepy), ...mouth(MOUTHS.surprised, 38), ...mouth(VIS('AA'), 62, SINE), ...mouth(VIS('AA'), 80, SINE), ...mouth(MOUTHS.smirk, 90), ...noFront,
    ...H(HL, { x: -26, y: -84 }), ...H(HR, { x: 26, y: -84 }), ...scale(HL, [[0, 0], [60, 0, OUT], [68, 110], [72, 100], [80, 100, IN], [88, 0], [100, 0]]),
    ...scale(HR, [[0, 0], [61, 0, OUT], [69, 110], [73, 100], [80, 100, IN], [88, 0], [100, 0]])]],
  // outfit change: squash, hop, one fast flip at the top (the app swaps the outfit mid-flip), land, look down at himself, smug
  'once/dress': [64, [...o({ sy: [[0, 100, OUT], [6, 88], [12, 108], [30, 104, IN], [38, 86, 'hold'], [42, 86, OUT], [50, 103], [56, 99], [60, 100], [64, 100]],
      sx: [[0, 100, OUT], [6, 110], [12, 96, IN], [17, 0, OUT], [22, -96, IN], [26, 0, OUT], [30, 96], [38, 116, 'hold'], [42, 116, OUT], [50, 98], [56, 101], [60, 100], [64, 100]],
      y: [[0, 0], [6, 0, OUT], [18, -30], [26, -31, IN], [38, 0], [64, 0]] }),
    ...T(E, 'y', [[0, -9], [42, -9, OUT], [46, -3], [52, -3, OUT], [56, -10], [64, -10]]), ...T(E, 'x', [[0, 0], [64, 0]]),
    ...lids([[0, -25], [52, -25, OUT], [57, -15], [64, -15]]), ...mouth(MOUTHS.smirk)]],
  // second poke: "hey" - pushed back a little, one eye wider and one lid down (skeptical), held, then back
  'once/poke2': [48, [...o({ x: [[0, 0, OUT], [3, 6], [14, 4], [34, 4], [44, 0], [48, 0]], r: [[0, 0, OUT], [3, 6], [14, 4], [34, 4], [44, 0], [48, 0]],
      sx: [[0, 100, OUT], [3, 112], [9, 94], [15, 103], [21, 99], [27, 100], [48, 100]], sy: [[0, 100, OUT], [3, 88], [9, 105], [15, 98], [21, 101], [27, 100], [48, 100]] }),
    ...T(E, 'x', [[0, 0, OUT], [4, -4], [36, -4], [44, 0], [48, 0]]), ...T(E, 'y', [[0, -9], [48, -9]]), ...eyeX,
    ...T(eL.pathId, 'h', [[0, 34, OUT], [4, 39], [36, 39], [44, 34], [48, 34]]), ...T(eL.id, 'y', [[0, 0, OUT], [4, -3], [36, -3], [44, 0], [48, 0]]),
    ...T(lR.id, 'y', [[0, -25], [4, -25, OUT], [9, -13], [36, -13, IN], [42, -25], [48, -25]]), ...H(lR.id, { x: 25, r: 0, op: 100 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 }), ...H(lL.id, { op: 0 }),
    ...mouth(MOUTHS.focus), ...mouth(MOUTHS.smirk, 42)]],
  // third poke: annoyed - leans away and shoos your finger with his side hand, lids down, then lets it go
  'once/poke3': [56, [...o({ r: [[0, 0, OUT], [6, -6], [40, -6], [52, 0], [56, 0]], x: [[0, 0, OUT], [6, -6], [40, -6], [52, 0], [56, 0]] }), ...noFront,
    ...T(HR, 'x', [[0, 0], [6, 0, OUT], [12, 32], [16, 42], [20, 32], [24, 42], [28, 32], [40, 32, IN], [50, 0], [56, 0]]),
    ...T(HR, 'y', [[0, 0], [6, 0, OUT], [12, -10], [40, -10, IN], [50, 0], [56, 0]]), ...H(HR, { sx: 100, sy: 100 }), ...T(AR, 'r', [[0, 0], [56, 0]]),
    ...lids([[0, -25, OUT], [4, -15], [44, -15, IN], [52, -25], [56, -25]], 12), ...T(E, 'x', [[0, 0, OUT], [6, 4], [44, 4], [52, 0], [56, 0]]), ...T(E, 'y', [[0, -9], [56, -9]]),
    ...mouth(MOUTHS.focus), ...mouth(MOUTHS.smirk, 48)]],
  // being rubbed: leans into it, eyes half shut, content smile, slow sway (loop)
  'play/pet': [90, 1, [...H(ids.face, { sx: 100 }), ...H(ids.pose, { x: 0, y: 2, sy: 97, sx: 103 }), ...T(ids.pose, 'r', [[0, -3], [45, 3], [90, -3]]), ...zOff,
    ...eyes({ y: 2, w: 19, h: 30, rad: 9 }), ...lids([[0, -13], [90, -13]]), ...T(E, 'x', [[0, 0], [90, 0]]), ...T(E, 'y', [[0, -8], [90, -8]]), ...mouth(MOUTHS.happy),
    ...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 }), ...noFront, ...H(AL, { r: 0 }), ...H(AR, { r: 0 })]],
  // focus: determined, not angry - flat lids a third down, eyes a bit narrower, short straight mouth (Face layer: keys every face part)
  'face/focus': [6, 0, [...eyes({ y: 1, w: 18, h: 30, rad: 9 }), ...lids([[0, -15]], 4), ...mouth(MOUTHS.focus), ...zOff, ...H(ids.mouthShape.id, { op: 100 }), ...H(ids.face, { x: 0, y: -66, r: 0 })]],
  // the `blink` trigger: a slow, cool blink (125 / 200 / 170 ms) - the quick automatic blink stays as it was
  'eyes/slow-blink': [30, 0, [...T(E, 'sy', [[0, 100, IN], [8, 10], [20, 10, OUT], [30, 100]]), ...T(E, 'sx', [[0, 100, IN], [8, 107], [20, 107, OUT], [30, 100]])]],
  // correct (Reactions layer): same body pop; the hand now pumps a fist at his side instead of hovering, happy squint
  'react/correct': [72, 0, [...T(R, 'sy', [[0, 100], [5, 94, OUT], [11, 106], [16, 106, IN], [22, 98], [28, 101], [34, 100], [72, 100]]),
    ...T(R, 'sx', [[0, 100], [5, 106, OUT], [11, 95], [16, 95, IN], [22, 102], [28, 99.5], [34, 100], [72, 100]]),
    ...T(R, 'y', [[0, 0], [5, 0, OUT], [11, -6], [16, -6, IN], [22, 0], [72, 0]]), ...T(R, 'r', [[0, 0], [72, 0]]), ...T(R, 'x', [[0, 0], [72, 0]]),
    ...T(E, 'sy', [[0, 100, OUT], [3, 108], [16, 108], [30, 100], [72, 100]]), ...T(E, 'sx', [[0, 100, OUT], [3, 104], [16, 104], [30, 100], [72, 100]]), ...eyeX,
    ...both('h', [[0, 34], [14, 34, OUT], [18, 24], [58, 24], [68, 34], [72, 34]]), ...bothY([[0, 0], [14, 0, OUT], [18, 3], [58, 3], [68, 0], [72, 0]]),
    ...T(HR, 'x', [[0, 0], [14, 0, OUT], [20, 26], [56, 26, IN], [68, 0], [72, 0]]),
    ...T(HR, 'y', [[0, 0], [14, 0, OUT], [20, -62], [24, -54], [30, -61], [36, -55], [42, -58], [56, -58, IN], [68, 0], [72, 0]]), ...T(AR, 'r', [[0, 0], [72, 0]]),
    ...mouth(MOUTHS.happy)]],
  // wrong (Reactions layer): quick blink, glance away, small tilt + sink, "hm" mouth, a little shrug back up - under 0.9 s, never sad
  'react/wrong': [54, 0, [...T(R, 'sy', [[0, 100], [3, 100], [12, 97], [30, 97, OUT], [38, 104], [46, 99], [54, 100]]),
    ...T(R, 'sx', [[0, 100], [3, 100], [12, 103], [30, 103, OUT], [38, 97], [46, 101], [54, 100]]), ...T(R, 'x', [[0, 0], [54, 0]]), ...T(R, 'y', [[0, 0], [54, 0]]),
    ...T(R, 'r', [[0, 0], [3, 0, OUT], [12, 5], [30, 5], [46, 0], [54, 0]]),
    ...T(E, 'sy', [[0, 100, IN], [4, 10], [6, 10, OUT], [13, 100], [54, 100]]), ...T(E, 'sx', [[0, 100, IN], [4, 107], [6, 107, OUT], [13, 100], [54, 100]]),
    ...T(E, 'x', [[0, 0], [10, 0, OUT], [14, -4], [38, -4], [48, 0], [54, 0]]), ...mouth(MOUTHS.focus), ...mouth(MOUTHS.smirk, 44)]],
};

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

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const only = process.argv.slice(2);
  await newAnim('once/celebrate', 84); await newAnim('eyes/slow-blink', 30);
  for (const [name, spec] of Object.entries(BATCH)) {
    if (only.length && !only.includes(name)) continue;
    const [frames, a, b] = spec, loop = Array.isArray(a) ? 0 : a, keys = Array.isArray(a) ? a : b;
    await anim(name, frames, keys, loop);
  }
  if (!only.length || only.includes('once/celebrate')) await wire('PlayOnce', 'once/celebrate', 'celebrate', 'once/idle');
  if (!only.length || only.includes('eyes/slow-blink')) await wire('Eyes', 'eyes/slow-blink', 'blink', 'eyes/open-5s');
}
main().catch(e => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
