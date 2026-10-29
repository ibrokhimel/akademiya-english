// Dombi emotes, batch 5 (2026-10-30, the owner's "even more"): eighteen moves.
//   salute, fingerGuns, applause, headbang, sneeze, hiccup, yawn, shiver, phoneScroll, teaSip, kickBall, impatient, pointLaugh,
//   boo, headShake, slide, drumroll, gasp
// New props in the face group (face-local = 200-space - (100, 104)): a phone, a piyola (tea bowl), a football. A part's own x/y
// inside a prop group is lost at runtime, so any offset part sits in a small group of its own (see dombi_emotes4.js).
// Hands: handL / handR behind him (global = local + (62 | 138, 128)); the two front hands in front (global ≈ local + (100, 166)).
const fs = require('fs');
const path = require('path');
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { VISEMES } = require('../icons/dombi_visemes');
const { SINE, OUT, IN, T, H, mouth, anim, newAnim, wire, once, scale, bothEyes, bothEyesY, eyesAt, lidsY, allHandsOff, shut } = require('./dombi_redo');
const VIS = (n) => VISEMES.find((v) => v.name === n);
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });

const E = ids.eyes, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, FACE = ids.face;
const HLF = () => ids.handLFront;
const offLR = [...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 })], offFront = () => [...H(HF, { sx: 0, sy: 0 }), ...H(HLF(), { sx: 0, sy: 0 })];
const pop = (id, inF, outF, end, s = 100) => scale(id, [[0, 0, OUT], [inF, 0, OUT], [inF + 7, s * 1.12], [inF + 11, s], [outF, s, IN], [outF + 9, 0], [end, 0]]);
const hideProps = () => Object.values(ids.props).flatMap((id) => H(id, { op: 0 }));
const oneShot = (spec) => [...once(spec), ...hideProps()];
const show = (id, list) => T(id, 'op', list);
const JAW = { fill: { verts: [[89, 121], [113, 121], [101, 148]], c: [[89, 121], [113, 121], [116, 134], [109, 149], [93, 149], [86, 134]] } };
// alternate two mouths on a beat from a to b
const chatter = (m1, m2, a, b, every) => { const out = []; for (let f = a, i = 0; f < b; f += every, i++) out.push(...mouth(i % 2 ? m2 : m1, f, SINE)); return out; };

const outlined = (c) => [{ paintType: 'fill', color: c }, { paintType: 'stroke', color: '#ff17171f', width: 2 }];
async function group(name, parentId, x, y, op = 0) {
  const g = (await call('group_editor', { name, parentId })).group.id;
  await call('set_property_values', { propertyValues: { [g]: { 13: x, 14: y, 18: op } } });
  return g;
}
async function part(parentId, x, y, shape) {                   // a shape at (x, y) in its prop, through its own small group
  const at = x || y ? await group(shape.name + 'At', parentId, x, y, 100) : parentId;
  await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [{ parentId: at, x: 0, y: 0, ...shape }] } } });
}
async function makeProps() {
  if (ids.props.phone) return;
  const p = {};
  p.phone = await group('propPhone', FACE, 26, 44);
  await part(p.phone, 0, 0, { primitive: 'rectangle', name: 'phoneBody', width: 22, height: 36, cornerRadius: 5, paints: outlined('#ff17171f') });
  await part(p.phone, 0, 0, { primitive: 'rectangle', name: 'phoneScreen', width: 16, height: 27, cornerRadius: 2, paints: [{ paintType: 'fill', color: '#ff7b5cff' }] });
  p.cup = await group('propCup', FACE, 4, 42);
  await part(p.cup, 0, 0, { primitive: 'rectangle', name: 'piyola', width: 30, height: 15, cornerRadiusTL: 2, cornerRadiusTR: 2, cornerRadiusBL: 9, cornerRadiusBR: 9, paints: outlined('#ffffffff') });
  await part(p.cup, 0, -3, { primitive: 'rectangle', name: 'piyolaBand', width: 26, height: 3, cornerRadius: 1, paints: [{ paintType: 'fill', color: '#ff2e6fd8' }] });
  p.ball = await group('propBall', FACE, 44, 56);
  await part(p.ball, 0, 0, { primitive: 'ellipse', name: 'ball', width: 20, height: 20, paints: outlined('#ffffffff') });
  await part(p.ball, 0, 0, { primitive: 'polygon', name: 'ballPatch', width: 8, height: 8, points: 5, paints: [{ paintType: 'fill', color: '#ff17171f' }] });
  Object.assign(ids.props, p); fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  await call('animation_editor', { command: 'modifyKeyFrames', data: { modifyKeyFrames: { animationId: mids.anims['once/idle'], add: Object.values(p).map((id) => ({ objectId: id, propertyKey: 18, frame: 0, value: 0, interpolationType: 'hold' })) } } });
}

const MOVES = () => {
  const P = ids.props;
  return {
    // salute: stands tall, a hand snaps to his brow, determined lids, holds, drops
    salute: [70, [...oneShot({ sy: [[0, 100, OUT], [8, 105], [52, 105, IN], [62, 100], [70, 100]], sx: [[0, 100, OUT], [8, 97], [52, 97, IN], [62, 100], [70, 100]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }),
      ...H(HF, { x: 48, y: -108 }), ...pop(HF, 4, 52, 70, 95), ...lidsY([[0, -25, OUT], [8, -17], [52, -17, IN], [60, -25], [70, -25]]), ...mouth(MOUTHS.proud, 0, 'hold'), ...mouth(MOUTHS.smirk, 60, SINE)]],
    // finger guns: both hands out front at you, "pew pew" recoil one then the other, a wink, a grin
    fingerGuns: [76, [...oneShot({ r: [[0, 0], [8, 3], [60, 3], [70, 0], [76, 0]] }), ...offFront(),
      ...H(HL, { x: -32, y: -34 }), ...H(HR, { x: 32, y: -34 }),
      ...scale(HL, [[0, 0, OUT], [6, 110], [10, 100], [30, 100, OUT], [32, 125], [38, 100], [58, 100, IN], [66, 0], [76, 0]]),
      ...scale(HR, [[0, 0, OUT], [6, 110], [10, 100], [18, 100, OUT], [20, 125], [26, 100], [58, 100, IN], [66, 0], [76, 0]]), ...eyesAt,
      ...T(ids.eyeShapes[0].pathId, 'h', [[0, 34], [16, 34, OUT], [20, 6], [44, 6, OUT], [50, 34], [76, 34]]), ...T(ids.eyeShapes[0].id, 'y', [[0, 0], [16, 0, OUT], [20, 5], [44, 5, OUT], [50, 0], [76, 0]]),
      ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 66, SINE)]],
    // applause: both front hands clapping in front of him, happy squint, a small bounce on each clap
    applause: (() => { const xs = [], xl = [], sy = []; for (let f = 8; f < 72; f += 8) { xs.push([f, 14, IN], [f + 4, 3, OUT]); xl.push([f, -14, IN], [f + 4, -3, OUT]); sy.push([f, 100], [f + 4, 97]); }
      xs.push([80, 14], [96, 14]); xl.push([80, -14], [96, -14]); sy.push([80, 100], [96, 100]);
      return [96, [...oneShot({ sy: [[0, 100], ...sy] }), ...offLR, ...T(HF, 'x', [[0, 14], ...xs]), ...T(HLF(), 'x', [[0, -14], ...xl]), ...H(HF, { y: -22 }), ...H(HLF(), { y: -22 }),
        ...pop(HF, 2, 80, 96, 95), ...pop(HLF(), 2, 80, 96, 95), ...eyesAt, ...bothEyes('h', [[0, 34, OUT], [6, 22], [80, 22], [88, 34], [96, 34]]), ...bothEyesY([[0, 0, OUT], [6, 3], [80, 3], [88, 0], [96, 0]]),
        ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 86, SINE)]]; })(),
    // headbang: rocking to the beat - head and body nod hard forward and back, eyes shut, mouth open, one fist pumping
    headbang: (() => { const r = [], y = [], hy = []; for (let f = 6; f < 90; f += 10) { r.push([f, -9, IN], [f + 5, 7, OUT]); y.push([f, 0, IN], [f + 5, 3, OUT]); hy.push([f, -78, IN], [f + 5, -64, OUT]); }
      r.push([96, 0], [104, 0]); y.push([96, 0], [104, 0]); hy.push([96, -70], [104, -70]);
      return [104, [...oneShot({ r: [[0, 0], ...r], y: [[0, 0], ...y] }), ...offFront(), ...H(HL, { sx: 0, sy: 0 }), ...H(HR, { x: 36 }), ...T(HR, 'y', [[0, -70], ...hy]), ...pop(HR, 2, 92, 104),
        ...shut(4, 94), ...mouth(VIS('OH'), 4, SINE), ...mouth(MOUTHS.smirk, 98, SINE)]]; })(),
    // sneeze: "ah... ah..." head tipping back, eyes half shut, mouth opening wider - "CHOO!" snaps forward, then sheepish
    sneeze: [80, [...oneShot({ r: [[0, 0, SINE], [28, -9], [31, 9, 'hold'], [36, 9, OUT], [50, 0], [80, 0]], sy: [[0, 100, SINE], [28, 107], [31, 90, 'hold'], [36, 90, OUT], [46, 102], [54, 100], [80, 100]],
        x: [[0, 0], [28, -2], [31, 5, 'hold'], [36, 5, OUT], [50, 0], [80, 0]] }), ...allHandsOff,
      ...lidsY([[0, -25, SINE], [24, -14], [30, -14, 'hold'], [31, -25], [80, -25]]), ...shut(30, 44),
      ...mouth(MOUTHS.smirk, 0, 'hold'), ...mouth(VIS('EH'), 10, SINE), ...mouth(VIS('AA'), 26, 'hold'), ...mouth(VIS('MBP'), 31, 'hold'), ...mouth(MOUTHS.oops, 46, SINE), ...mouth(MOUTHS.smirk, 72, SINE)]],
    // hiccups: three little jumps, eyes popping wide each time, an annoyed flat mouth in between
    hiccup: [86, [...oneShot({ y: [[0, 0], [10, 0, OUT], [13, -9, IN], [18, 0], [36, 0, OUT], [39, -9, IN], [44, 0], [62, 0, OUT], [65, -9, IN], [70, 0], [86, 0]],
        sy: [[0, 100], [10, 100, OUT], [13, 107, IN], [18, 97], [22, 100], [36, 100, OUT], [39, 107, IN], [44, 97], [48, 100], [62, 100, OUT], [65, 107, IN], [70, 97], [74, 100], [86, 100]] }), ...allHandsOff, ...eyesAt,
      ...bothEyes('h', [[0, 34], [10, 34, OUT], [13, 42], [20, 34], [36, 34, OUT], [39, 42], [46, 34], [62, 34, OUT], [65, 42], [72, 34], [86, 34]]),
      ...mouth(MOUTHS.listen, 0, 'hold'), ...mouth(VIS('OO'), 12, 'hold'), ...mouth(MOUTHS.focus, 20, SINE), ...mouth(VIS('OO'), 38, 'hold'), ...mouth(MOUTHS.focus, 46, SINE),
      ...mouth(VIS('OO'), 64, 'hold'), ...mouth(MOUTHS.focus, 72, SINE), ...mouth(MOUTHS.smirk, 82, SINE)]],
    // a big yawn: stretches tall, eyes shut, the mouth opens huge, a hand comes up over it, then a sleepy blink
    yawn: [110, [...oneShot({ sy: [[0, 100, SINE], [40, 111], [70, 111, SINE], [86, 98], [96, 100], [110, 100]], sx: [[0, 100, SINE], [40, 93], [70, 93, SINE], [86, 101], [96, 100], [110, 100]],
        r: [[0, 0, SINE], [40, -4], [70, -4, SINE], [86, 0], [110, 0]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }),
      ...H(HF, { x: 4, y: -40 }), ...pop(HF, 30, 70, 110, 105), ...shut(10, 84),
      ...mouth(MOUTHS.smirk, 0, 'hold'), ...mouth(VIS('OH'), 14, SINE), ...mouth(JAW, 34, SINE), ...mouth(JAW, 68, SINE), ...mouth(MOUTHS.sleepy, 84, SINE), ...mouth(MOUTHS.smirk, 104, SINE)]],
    // shivering: hugging himself, a fast tremble, hunched, eyes squeezed, teeth chattering
    shiver: (() => { const x = []; for (let f = 6; f < 84; f += 2) x.push([f, (f / 2) % 2 ? 2 : -2, 'hold']); x.push([84, 0], [96, 0]);
      return [96, [...oneShot({ x: [[0, 0], ...x], sy: [[0, 100, OUT], [8, 95], [84, 95], [92, 100], [96, 100]], sx: [[0, 100, OUT], [8, 105], [84, 105], [92, 100], [96, 100]] }), ...offLR,
        ...H(HF, { x: 26, y: -24 }), ...H(HLF(), { x: -26, y: -24 }), ...pop(HF, 2, 84, 96), ...pop(HLF(), 2, 84, 96), ...eyesAt,
        ...bothEyes('h', [[0, 34, OUT], [6, 12], [84, 12], [90, 34], [96, 34]]), ...bothEyes('w', [[0, 18, OUT], [6, 22], [84, 22], [90, 18], [96, 18]]), ...bothEyes('rad', [[0, 9, OUT], [6, 6], [84, 6], [90, 9], [96, 9]]),
        ...chatter(VIS('TEETH'), VIS('MBP'), 6, 84, 4), ...mouth(MOUTHS.smirk, 88, SINE)]]; })(),
    // scrolling his phone: the phone comes up in his hand, eyes down on it, thumb flicking, a snort at something, phone away
    phoneScroll: [130, [...oneShot({ r: [[0, 0, OUT], [10, 4], [110, 4, SINE], [122, 0], [130, 0]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }),
      ...show(P.phone, [[0, 0, 'hold'], [8, 100, 'hold'], [112, 0, 'hold'], [130, 0]]), ...scale(P.phone, [[0, 0, OUT], [8, 0], [14, 155], [18, 140], [106, 140, IN], [112, 0], [130, 0]]),
      ...H(HF, { x: 30 }), ...T(HF, 'y', [[0, -20], [30, -20, OUT], [33, -26], [37, -20], [56, -20, OUT], [59, -26], [63, -20], [90, -20, OUT], [93, -26], [97, -20], [130, -20]]), ...pop(HF, 6, 104, 130, 85),
      ...T(E, 'x', [[0, 0, OUT], [8, 4], [110, 4], [118, 0], [130, 0]]), ...T(E, 'y', [[0, -9, OUT], [8, -3], [110, -3], [118, -9], [130, -9]]),
      ...mouth(MOUTHS.listen, 0, 'hold'), ...mouth(MOUTHS.happy, 66, SINE), ...mouth(VIS('EH'), 70, SINE), ...mouth(MOUTHS.happy, 74, SINE), ...mouth(MOUTHS.listen, 88, SINE), ...mouth(MOUTHS.smirk, 118, SINE)]],
    // tea: the piyola comes up to his mouth, he tips it and sips with his eyes shut, lowers it - "ahh" - and it's gone
    teaSip: [124, [...oneShot({ sy: [[0, 100], [86, 100, OUT], [92, 97], [100, 101], [108, 100], [124, 100]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }),
      ...show(P.cup, [[0, 0, 'hold'], [6, 100, 'hold'], [112, 0, 'hold'], [124, 0]]),
      ...T(P.cup, 'y', [[0, 42], [6, 42, OUT], [24, 28], [74, 28, IN], [90, 42], [124, 42]]), ...T(P.cup, 'r', [[0, 0], [30, 0, SINE], [44, -22], [64, -22, SINE], [76, 0], [124, 0]]),
      ...scale(P.cup, [[0, 0, OUT], [6, 0], [12, 105], [16, 100], [104, 100, IN], [112, 0], [124, 0]]),
      ...H(HF, { x: 18 }), ...T(HF, 'y', [[0, -14], [6, -14, OUT], [24, -28], [74, -28, IN], [90, -14], [124, -14]]), ...pop(HF, 4, 104, 124, 85),
      ...shut(28, 82), ...mouth(MOUTHS.smirk, 0, 'hold'), ...mouth(VIS('OO'), 26, SINE), ...mouth(MOUTHS.happy, 88, SINE), ...mouth(VIS('AA'), 92, SINE), ...mouth(MOUTHS.happy, 100, SINE), ...mouth(MOUTHS.smirk, 116, SINE)]],
    // a football kick: the ball appears at his feet, he winds up, kicks - it flies off spinning - eyes follow it, "goal!" hop
    kickBall: [100, [...oneShot({ r: [[0, 0, OUT], [12, -7], [16, 9, OUT], [28, 2], [40, 0], [100, 0]], x: [[0, 0], [12, -3], [16, 5, OUT], [30, 0], [100, 0]],
        y: [[0, 0], [52, 0, OUT], [60, -14, IN], [68, 0], [100, 0]], sy: [[0, 100], [52, 100, OUT], [58, 108], [68, 92], [74, 102], [80, 100], [100, 100]] }), ...allHandsOff,
      ...show(P.ball, [[0, 0, 'hold'], [2, 100, 'hold'], [40, 0, 'hold'], [100, 0]]), ...T(P.ball, 'x', [[0, 44], [16, 44, OUT], [40, 150], [100, 150]]),
      ...T(P.ball, 'y', [[0, 56], [16, 56, OUT], [28, -10, IN], [40, -40], [100, -40]]), ...T(P.ball, 'r', [[0, 0], [16, 0], [40, 540], [100, 540]]),
      ...T(E, 'x', [[0, 0, OUT], [4, 4], [18, 4, OUT], [26, 6], [44, 6], [56, 0], [100, 0]]), ...T(E, 'y', [[0, -9, OUT], [4, -4], [18, -4, OUT], [26, -15], [44, -15], [56, -9], [100, -9]]),
      ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(VIS('AA'), 40, SINE), ...mouth(MOUTHS.happy, 60, SINE), ...mouth(MOUTHS.smirk, 92, SINE)]],
    // impatient: tapping his foot (quick small bounces), eyes rolled up, half lids, a flat mouth - "come on"
    impatient: (() => { const y = [], sy = []; for (let f = 8; f < 92; f += 7) { y.push([f, 0, OUT], [f + 3, -3, IN]); sy.push([f, 100, OUT], [f + 3, 102, IN]); } y.push([100, 0]); sy.push([100, 100]);
      return [100, [...oneShot({ y: [[0, 0], ...y], sy: [[0, 100], ...sy] }), ...allHandsOff, ...T(E, 'y', [[0, -9, OUT], [8, -14], [90, -14], [98, -9], [100, -9]]), ...T(E, 'x', [[0, 0, OUT], [8, -3], [90, -3], [98, 0], [100, 0]]),
        ...lidsY([[0, -25, OUT], [8, -19], [90, -19, IN], [98, -25], [100, -25]]), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 96, SINE)]]; })(),
    // pointing and laughing: a hand points right at you, he leans back laughing, bouncing
    pointLaugh: (() => { const y = [], m = []; for (let f = 10; f < 80; f += 10) { y.push([f, 0, OUT], [f + 5, -5, IN]); m.push(...mouth(MOUTHS.laugh, f, SINE), ...mouth(VIS('EH'), f + 5, SINE)); } y.push([88, 0], [100, 0]);
      return [100, [...oneShot({ y: [[0, 0], ...y], r: [[0, 0, OUT], [8, -6], [80, -6, SINE], [92, 0], [100, 0]] }), ...offFront(), ...H(HL, { sx: 0, sy: 0 }),
        ...H(HR, { x: 28, y: -38 }), ...scale(HR, [[0, 0, OUT], [6, 125], [10, 112], [80, 112, IN], [90, 0], [100, 0]]), ...eyesAt,
        ...bothEyes('h', [[0, 34, OUT], [8, 6], [82, 6], [90, 34], [100, 34]]), ...bothEyes('w', [[0, 18, OUT], [8, 22], [82, 22], [90, 18], [100, 18]]), ...bothEyes('rad', [[0, 9, OUT], [8, 3], [82, 3], [90, 9], [100, 9]]),
        ...bothEyesY([[0, 0, OUT], [8, 3], [82, 3], [90, 0], [100, 0]]), ...m, ...mouth(MOUTHS.smirk, 90, SINE)]]; })(),
    // boo: ducks down out of sight, a beat, then pops up tall with both hands up and a wide "BOO", then grins
    boo: [110, [...oneShot({ y: [[0, 0, IN], [14, 150, 'hold'], [44, 150, OUT], [52, -14], [58, 0], [110, 0]], sy: [[0, 100, OUT], [6, 94], [14, 104, 'hold'], [44, 104, OUT], [52, 120], [58, 94], [64, 103], [70, 100], [110, 100]],
        sx: [[0, 100, OUT], [6, 105], [14, 97, 'hold'], [44, 97, OUT], [52, 88], [58, 106], [64, 98], [70, 100], [110, 100]] }), ...offFront(),
      ...H(HL, { x: -38, y: -84 }), ...H(HR, { x: 38, y: -84 }), ...pop(HL, 46, 80, 110, 105), ...pop(HR, 46, 80, 110, 105), ...eyesAt,
      ...bothEyes('h', [[0, 34], [46, 34, OUT], [52, 42], [80, 42], [88, 34], [110, 34]]), ...bothEyes('w', [[0, 18], [46, 18, OUT], [52, 22], [80, 22], [88, 18], [110, 18]]),
      ...mouth(MOUTHS.smirk, 0, 'hold'), ...mouth(JAW, 50, 'hold'), ...mouth(MOUTHS.happy, 80, SINE), ...mouth(MOUTHS.smirk, 104, SINE)]],
    // a firm "no": his head shakes three times (the face turns side to side), flat lids, flat mouth
    headShake: [60, [...oneShot({}), ...allHandsOff, ...T(FACE, 'x', [[0, 0], [6, -5], [14, 5], [22, -5], [30, 5], [38, -3], [46, 0], [60, 0]]),
      ...T(FACE, 'r', [[0, 0], [6, -5], [14, 5], [22, -5], [30, 5], [38, -3], [46, 0], [60, 0]]), ...H(FACE, { y: -66 }),
      ...lidsY([[0, -25, OUT], [6, -16], [46, -16, IN], [54, -25], [60, -25]]), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 54, SINE)]],
    // the smooth slide: glides to one side, then all the way to the other, eyes shut, cool smirk, back to centre
    slide: [110, [...oneShot({ x: [[0, 0, SINE], [30, -28], [36, -28, SINE], [76, 28], [82, 28, SINE], [104, 0], [110, 0]], r: [[0, 0, SINE], [30, 6], [36, 6, SINE], [56, -6], [76, -6, SINE], [92, 4], [104, 0], [110, 0]] }),
      ...allHandsOff, ...shut(8, 100), ...mouth(MOUTHS.proud, 0, 'hold'), ...mouth(MOUTHS.smirk, 100, SINE)]],
    // drumroll: both front hands drumming fast in front of him, squinting with suspense - then "ta-da!": hands up, eyes wide, hop
    drumroll: (() => { const yr = [], yl = []; for (let f = 6; f < 60; f += 4) { yr.push([f, f % 8 ? -6 : -14, 'hold']); yl.push([f, f % 8 ? -14 : -6, 'hold']); } yr.push([60, -10]); yl.push([60, -10]);
      return [110, [...oneShot({ y: [[0, 0], [60, 0, OUT], [66, -12, IN], [74, 0], [110, 0]], sy: [[0, 100], [60, 100, OUT], [64, 108], [74, 94], [80, 102], [86, 100], [110, 100]] }),
        ...H(HF, { x: 16 }), ...H(HLF(), { x: -16 }), ...T(HF, 'y', [[0, -10], ...yr]), ...T(HLF(), 'y', [[0, -10], ...yl]), ...pop(HF, 2, 58, 110, 85), ...pop(HLF(), 2, 58, 110, 85),
        ...H(HL, { x: -40, y: -76 }), ...H(HR, { x: 40, y: -76 }), ...pop(HL, 58, 96, 110), ...pop(HR, 58, 96, 110), ...eyesAt,
        ...bothEyes('h', [[0, 34, OUT], [6, 20], [58, 20, OUT], [62, 42], [92, 42], [100, 34], [110, 34]]), ...lidsY([[0, -25], [110, -25]]),
        ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.laugh, 60, SINE), ...mouth(MOUTHS.smirk, 100, SINE)]]; })(),
    // gasp: jerks back, eyes huge, mouth a round "oh", a hand to his chest, holds it, recovers
    gasp: [70, [...oneShot({ y: [[0, 0, OUT], [5, -4], [40, -4, SINE], [54, 0], [70, 0]], sy: [[0, 100, OUT], [5, 106], [40, 106, SINE], [54, 100], [70, 100]], r: [[0, 0, OUT], [5, -4], [40, -4], [54, 0], [70, 0]] }),
      ...offLR, ...H(HLF(), { sx: 0, sy: 0 }), ...H(HF, { x: -14, y: -24 }), ...pop(HF, 2, 50, 70, 95), ...eyesAt,
      ...bothEyes('h', [[0, 34, OUT], [4, 44], [44, 44], [54, 34], [70, 34]]), ...bothEyes('w', [[0, 18, OUT], [4, 22], [44, 22], [54, 18], [70, 18]]), ...bothEyes('rad', [[0, 9, OUT], [4, 11], [44, 11], [54, 9], [70, 9]]),
      ...mouth(VIS('OH'), 2, 'hold'), ...mouth(MOUTHS.smirk, 54, SINE)]],
  };
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  await makeProps();
  const moves = MOVES(), only = process.argv.slice(2);
  const vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi');
  const want = Object.keys(moves).filter((n) => !vm.viewModelProperties.some((p) => p.name === n));
  if (want.length) await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: want.map((name) => ({ name, propertyType: 'trigger' })) }] });
  for (const [name, [frames, keys]] of Object.entries(moves)) {
    if (only.length && !only.includes(name)) continue;
    await newAnim('once/' + name, frames); await anim('once/' + name, frames, keys); await wire('PlayOnce', 'once/' + name, name, 'once/idle');
  }
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
