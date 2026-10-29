// Dombi's first new emotes for the action engine (spec 2026-10-30-dombi-action-engine §4.6): spit, dance, facepalm, fists up,
// eye-roll. PlayOnce one-shots (Any --trigger--> once/<name> --> once/idle), each whole on its own. 60 fps.
// Hands: arm-local, (0, 0) is tucked behind the body (global = local + (62 | 138, 128)); the front hand (handRFront) sits
// over the face at about (0, -62). The spit drop is a small white pill in the face group, hidden unless spit plays.
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES } = require('../icons/dombi_visemes');
const { SINE, OUT, IN, T, H, mouth, eL, eR, lL, lR, anim, newAnim, wire } = require('./dombi_redo');
const VIS = (n) => VISEMES.find((v) => v.name === n);
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });

const O = ids.once, E = ids.eyes, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, AL = ids.armL, AR = ids.armR, S = ids.shades;
const o = (spec) => ['x', 'y', 'r', 'sx', 'sy'].flatMap((p) => T(O, p, spec[p] || [[0, p[0] === 's' ? 100 : 0, 'hold']])).concat(H(S, { op: 0, y: -9 }));
const scale = (id, list) => [...T(id, 'sx', list), ...T(id, 'sy', list)];
const both = (p, list) => [...T(eL.pathId, p, list), ...T(eR.pathId, p, list)];
const eyeX = [...H(eL.id, { x: -25, r: 0, op: 100 }), ...H(eR.id, { x: 25, r: 0, op: 100 })];
const lids = (yList, rot = 0) => [...T(lL.id, 'y', yList), ...T(lR.id, 'y', yList), ...H(lL.id, { x: -25, r: rot, op: 100 }), ...H(lR.id, { x: 25, r: -rot, op: 100 }),
  ...H(lL.pathId, { w: 30, h: 16, rad: 0 }), ...H(lR.pathId, { w: 30, h: 16, rad: 0 })];
const handsOff = [...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 }), ...H(HF, { sx: 0, sy: 0 })];
const drop = () => ids.spitDrop;

const EMOTES = {
  // spit: leans back puffing his cheeks, snaps forward with a "ptui", a little white drop flies off and fades, smug squint
  spit: () => [56, [...o({ r: [[0, 0, OUT], [10, -6], [14, 6, OUT], [22, 3], [44, 3], [56, 0]], x: [[0, 0], [10, -2], [14, 5, OUT], [44, 4], [56, 0]],
      sy: [[0, 100, OUT], [10, 104], [14, 95, OUT], [20, 101], [26, 100], [56, 100]], sx: [[0, 100, OUT], [10, 97], [14, 105, OUT], [20, 99], [26, 100], [56, 100]] }),
    ...mouth(MOUTHS.smirk), ...mouth(VIS('MBP'), 4, SINE), ...mouth(VIS('OO'), 12, 'hold'), ...mouth(MOUTHS.smirk, 20, SINE), ...handsOff,
    ...T(drop(), 'op', [[0, 0, 'hold'], [12, 100, 'hold'], [24, 100, SINE], [32, 0], [56, 0]]),
    ...T(drop(), 'x', [[0, 6, 'hold'], [12, 6, OUT], [28, 64], [56, 64]]), ...T(drop(), 'y', [[0, 24, 'hold'], [12, 24, OUT], [19, 14, IN], [30, 46], [56, 46]]),
    ...scale(drop(), [[0, 100, 'hold'], [12, 100], [30, 60], [56, 60]]),
    ...lids([[0, -25], [16, -25, OUT], [22, -15], [44, -15, IN], [52, -25], [56, -25]])]],
  // dance: a little groove on the beat (every 15 frames = 240 bpm halves): bounce, sway, squash on each landing, hands up in turn
  dance: () => {
    const beats = [0, 15, 30, 45, 60, 75, 90, 105], y = [], r = [], sy = [], sx = [];
    beats.forEach((b, i) => { y.push([b, 0, OUT], [b + 7, -10, IN]); r.push([b, i % 2 ? -8 : 8, SINE]); sy.push([b, 94, OUT], [b + 7, 104, IN]); sx.push([b, 106, OUT], [b + 7, 97, IN]); });
    y.push([120, 0]); r.push([120, 0]); sy.push([114, 100], [120, 100]); sx.push([114, 100], [120, 100]);
    return [120, [...o({ y, r, sy, sx }), ...eyeX, ...both('h', [[0, 34, OUT], [6, 22], [108, 22], [118, 34], [120, 34]]), ...T(eL.id, 'y', [[0, 0], [6, 3], [108, 3], [118, 0], [120, 0]]),
      ...T(eR.id, 'y', [[0, 0], [6, 3], [108, 3], [118, 0], [120, 0]]), ...mouth(MOUTHS.happy), ...H(HF, { sx: 0, sy: 0 }),
      ...H(HL, { x: -30, y: -72 }), ...H(HR, { x: 30, y: -72 }), ...scale(HL, [[0, 0, OUT], [8, 110], [12, 100], [104, 100, IN], [114, 0], [120, 0]]), ...scale(HR, [[0, 0, OUT], [10, 110], [14, 100], [104, 100, IN], [114, 0], [120, 0]]),
      ...T(AL, 'r', beats.map((b, i) => [b, i % 2 ? 18 : -10, SINE]).concat([[120, 0]])), ...T(AR, 'r', beats.map((b, i) => [b, i % 2 ? 10 : -18, SINE]).concat([[120, 0]]))]];
  },
  // facepalm: the front hand comes up over his eyes with a small slap, head drops, a slow "no" shake, hand comes away, flat look
  facepalm: () => [76, [...o({ sy: [[0, 100], [14, 100, OUT], [17, 95], [22, 98], [56, 98], [64, 100], [76, 100]], y: [[0, 0], [14, 0, OUT], [18, 3], [56, 3], [64, 0], [76, 0]],
      r: [[0, 0], [22, 0, SINE], [30, -3], [38, 3], [46, -2], [54, 0], [76, 0]] }),
    ...T(HF, 'x', [[0, 30, OUT], [14, -18], [52, -18, IN], [64, 30], [76, 30]]), ...T(HF, 'y', [[0, -10, OUT], [14, -80], [52, -80, IN], [64, -10], [76, -10]]),
    ...scale(HF, [[0, 0, OUT], [10, 140], [14, 162], [17, 152], [52, 152, IN], [64, 0], [76, 0]]), ...eyeX,
    ...T(eR.pathId, 'h', [[0, 34], [14, 34, OUT], [18, 6], [52, 6, OUT], [58, 34], [76, 34]]), ...T(eR.pathId, 'w', [[0, 18], [14, 18, OUT], [18, 22], [52, 22, OUT], [58, 18], [76, 18]]),
    ...T(eR.pathId, 'rad', [[0, 9], [14, 9, OUT], [18, 3], [52, 3, OUT], [58, 9], [76, 9]]), ...T(eR.id, 'y', [[0, 0], [14, 0, OUT], [18, 6], [52, 6, OUT], [58, 0], [76, 0]]), ...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 }),
    ...lids([[0, -25], [56, -25, OUT], [62, -15], [76, -15]]), ...mouth(MOUTHS.smirk), ...mouth(MOUTHS.focus, 14, 'hold')]],
  // fists up: "fight me" - crouches, both fists pop up at his sides in a guard, little alternating jabs, a cocky squint
  fistsUp: () => [70, [...o({ sy: [[0, 100, OUT], [6, 93], [12, 96], [58, 96, IN], [66, 100], [70, 100]], sx: [[0, 100, OUT], [6, 106], [12, 104], [58, 104, IN], [66, 100], [70, 100]],
      y: [[0, 0], [12, 0], [18, -3], [24, 0], [30, -3], [36, 0], [42, -3], [48, 0], [70, 0]] }), ...H(HF, { sx: 0, sy: 0 }),
    ...H(HL, { x: -28 }), ...H(HR, { x: 28 }), ...T(HL, 'y', [[0, -30], [16, -30, OUT], [19, -42], [24, -30], [36, -30, OUT], [39, -42], [44, -30], [70, -30]]),
    ...T(HR, 'y', [[0, -30], [26, -30, OUT], [29, -42], [34, -30], [46, -30, OUT], [49, -42], [54, -30], [70, -30]]),
    ...scale(HL, [[0, 0, OUT], [8, 115], [12, 100], [58, 100, IN], [66, 0], [70, 0]]), ...scale(HR, [[0, 0, OUT], [9, 115], [13, 100], [58, 100, IN], [66, 0], [70, 0]]),
    ...lids([[0, -25, OUT], [8, -16], [58, -16, IN], [66, -25], [70, -25]], 10), ...mouth(MOUTHS.smirk)]],
  // eye-roll: eyes go up and round (left -> top -> right), a long sigh (rise, sag), half lids, back to a flat smirk
  eyeRoll: () => [60, [...o({ sy: [[0, 100], [24, 100, SINE], [32, 103], [46, 97], [56, 100], [60, 100]], r: [[0, 0], [8, -2], [44, -2], [56, 0], [60, 0]] }), ...handsOff,
    ...T(E, 'x', [[0, 0, OUT], [6, -4], [14, 0], [22, 4], [28, 1], [40, 1, SINE], [50, 0], [60, 0]]), ...T(E, 'y', [[0, -9, OUT], [6, -13], [14, -16], [22, -13], [28, -15], [40, -15, SINE], [50, -9], [60, -9]]),
    ...lids([[0, -25], [26, -25, OUT], [32, -17], [48, -17, IN], [56, -25], [60, -25]]), ...mouth(MOUTHS.focus), ...mouth(MOUTHS.smirk, 50, SINE)]],
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  if (!ids.spitDrop) {
    const r = await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [{ primitive: 'ellipse', name: 'spitDrop', parentId: ids.face, x: 6, y: 24, width: 9, height: 7, paints: [{ paintType: 'fill', color: '#ffffffff' }, { paintType: 'stroke', color: '#ff17171f', width: 2 }] }] } } });   // outlined, so it shows on the light stage too
    ids.spitDrop = r.shapes[0].id;
    await call('set_property_values', { propertyValues: { [ids.spitDrop]: { 18: 0 } } });
    fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  }
  let vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi');
  const want = Object.keys(EMOTES).filter((n) => !vm.viewModelProperties.some((p) => p.name === n));
  if (want.length) await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: want.map((name) => ({ name, propertyType: 'trigger' })) }] });
  const only = process.argv.slice(2);
  for (const [name, make] of Object.entries(EMOTES)) {
    if (only.length && !only.includes(name)) continue;
    const [frames, keys] = make();
    await newAnim('once/' + name, frames); await anim('once/' + name, frames, keys);
    await wire('PlayOnce', 'once/' + name, name, 'once/idle');
  }
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
