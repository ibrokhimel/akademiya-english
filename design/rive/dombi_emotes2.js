// Dombi redo, 2026-10-30: the owner marked four idle breaks "redo" (nod, weight-shift, lean-back, the little hop). They only
// tilted the `lean` group a couple of degrees in the Idle layer, which sits under the face and eye layers, so nothing but a
// faint sway could ever show. They are now PlayOnce one-shots, where eyes, lids, mouth and hands can act too, fired by the same
// view-model triggers; the old Idle-layer trigger routes for them are removed (the rig's own random breaks, used only when
// `directed` is off, keep the old idle/* timelines). 60 fps; hands arm-local, (0, 0) tucked behind the body.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { SINE, OUT, IN, T, H, mouth, eL, eR, lL, lR, anim, newAnim, wire } = require('./dombi_redo');

const O = ids.once, E = ids.eyes, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, S = ids.shades;
const o = (spec) => ['x', 'y', 'r', 'sx', 'sy'].flatMap((p) => T(O, p, spec[p] || [[0, p[0] === 's' ? 100 : 0, 'hold']])).concat(H(S, { op: 0, y: -9 }), H(ids.spitDrop, { op: 0 }));
const scale = (id, list) => [...T(id, 'sx', list), ...T(id, 'sy', list)];
const both = (p, list) => [...T(eL.pathId, p, list), ...T(eR.pathId, p, list)];
const bothY = (list) => [...T(eL.id, 'y', list), ...T(eR.id, 'y', list)];
const eyeX = [...H(eL.id, { x: -25, r: 0, op: 100 }), ...H(eR.id, { x: 25, r: 0, op: 100 })];
const lids = (yList, rot = 0) => [...T(lL.id, 'y', yList), ...T(lR.id, 'y', yList), ...H(lL.id, { x: -25, r: rot, op: 100 }), ...H(lR.id, { x: 25, r: -rot, op: 100 }),
  ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 })];
const handsOff = [...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 }), ...H(HF, { sx: 0, sy: 0 })];

const BREAKS = {
  // nod: "mhm, yeah" - two clear nods (dip and squash), eyes soften on each, a small pleased smile, eyes on you
  nod: [56, [...o({ y: [[0, 0, OUT], [6, 6], [13, 0, OUT], [19, 5], [26, 0], [56, 0]], sy: [[0, 100, OUT], [6, 94], [13, 101, OUT], [19, 95], [26, 100], [56, 100]],
      sx: [[0, 100, OUT], [6, 105], [13, 99.5, OUT], [19, 104], [26, 100], [56, 100]], r: [[0, 0], [6, 2], [13, 0], [19, 1.5], [26, 0], [56, 0]] }), ...handsOff, ...eyeX,
    ...both('h', [[0, 34, OUT], [6, 26], [13, 34, OUT], [19, 27], [26, 34], [56, 34]]), ...bothY([[0, 0, OUT], [6, 3], [13, 0, OUT], [19, 3], [26, 0], [56, 0]]),
    ...T(E, 'x', [[0, 0], [56, 0]]), ...T(E, 'y', [[0, -9, OUT], [4, -7], [40, -7], [52, -9], [56, -9]]),
    ...mouth(MOUTHS.smirk), ...mouth(MOUTHS.happy, 6, SINE), ...mouth(MOUTHS.happy, 34, SINE), ...mouth(MOUTHS.smirk, 46, SINE)]],
  // weight-shift: rocks onto one side, then the other, a small dip each time, eyes drift the other way, back to centre
  weightShift: [80, [...o({ x: [[0, 0, SINE], [18, -8], [36, -8, SINE], [56, 7], [70, 0], [80, 0]], r: [[0, 0, SINE], [18, -5], [36, -5, SINE], [56, 4], [70, 0], [80, 0]],
      sy: [[0, 100, SINE], [9, 96], [18, 100], [45, 96], [56, 100], [80, 100]], sx: [[0, 100, SINE], [9, 104], [18, 100], [45, 104], [56, 100], [80, 100]] }), ...handsOff,
    ...T(E, 'x', [[0, 0, SINE], [18, 4], [36, 4, SINE], [56, -4], [70, 0], [80, 0]]), ...T(E, 'y', [[0, -9], [80, -9]]), ...mouth(MOUTHS.smirk)]],
  // lean-back: leans back, hands up behind his head, half-lidded and smug, holds it, comes back
  leanBack: [110, [...o({ r: [[0, 0, OUT], [14, -9], [80, -9, SINE], [96, 0], [110, 0]], y: [[0, 0, OUT], [14, 2], [80, 2], [96, 0], [110, 0]],
      sy: [[0, 100, OUT], [14, 104], [80, 104, SINE], [96, 100], [110, 100]], sx: [[0, 100, OUT], [14, 97], [80, 97, SINE], [96, 100], [110, 100]] }), ...H(HF, { sx: 0, sy: 0 }),
    ...H(HL, { x: -34, y: -78 }), ...H(HR, { x: 34, y: -78 }), ...scale(HL, [[0, 0, OUT], [12, 0], [20, 105], [24, 100], [80, 100, IN], [92, 0], [110, 0]]),
    ...scale(HR, [[0, 0, OUT], [13, 0], [21, 105], [25, 100], [80, 100, IN], [92, 0], [110, 0]]),
    ...lids([[0, -25], [16, -25, OUT], [22, -14], [80, -14, IN], [90, -25], [110, -25]]), ...mouth(MOUTHS.smirk), ...mouth(MOUTHS.proud, 18, SINE), ...mouth(MOUTHS.smirk, 90, SINE)]],
  // little hop: squash, a real jump with a stretch, wide eyes at the top, a squash landing with a short hold, a happy squint
  idleHop: [60, [...o({ sy: [[0, 100, OUT], [8, 88], [16, 112], [20, 106], [28, 108, IN], [32, 86, 'hold'], [36, 86, OUT], [44, 104], [50, 99], [56, 100], [60, 100]],
      sx: [[0, 100, OUT], [8, 110], [16, 92], [20, 96], [28, 95, IN], [32, 114, 'hold'], [36, 114, OUT], [44, 97], [50, 101], [56, 100], [60, 100]],
      y: [[0, 0], [8, 0, OUT], [20, -26], [23, -27, IN], [32, 0], [60, 0]] }), ...handsOff, ...eyeX,
    ...both('h', [[0, 34, OUT], [8, 28], [18, 38], [30, 38], [33, 22], [48, 22], [56, 34], [60, 34]]), ...bothY([[0, 0], [33, 0], [34, 3], [48, 3], [56, 0], [60, 0]]),
    ...mouth(MOUTHS.smirk), ...mouth(MOUTHS.happy, 32, 'hold'), ...mouth(MOUTHS.smirk, 54, SINE)]],
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  for (const [trigger, [frames, keys]] of Object.entries(BREAKS)) {
    const name = 'once/' + trigger;
    await newAnim(name, frames); await anim(name, frames, keys); await wire('PlayOnce', name, trigger, 'once/idle');
  }
  // the old routes: Any --trigger--> idle/<break> in the Idle layer; drop them so each trigger plays only the new one-shot
  const sm = await call('animation_editor', { command: 'queryStateMachine', data: { queryStateMachine: {} } });
  const L = sm.layers.find((l) => l.layerName === 'Idle'), any = L.states.find((s) => s.type === 'any');
  const old = L.transitions.filter((t) => t.fromStateId === any.id && (t.conditions || []).some((c) => Object.keys(BREAKS).includes((c.leftComparator || {}).viewModelPropertyName)));
  if (old.length) await call('delete_objects', { objectIds: old.map((t) => t.id) });
  console.log('removed', old.length, 'old Idle-layer trigger routes');
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
