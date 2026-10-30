// Dombi emotes, batch 6 (2026-10-30, the owner's "like 50 more"): thirty-five moves (the fifteen faces are in dombi_faces.js).
// Props in the face group (face-local = 200-space - (100, 104)): bubble gum, a book, a notepad + pencil, a trophy, a gift, a
// magnifying glass. Any part off its prop's centre sits in its own small group (a part's own x/y is lost at runtime).
// The once group pivots at his feet ((0, -66) is his centre); hands: handL / handR behind him (global = local + (62 | 138, 128)),
// the two front hands in front (global ≈ local + (100, 166)). 60 fps.
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
const [eL, eR] = ids.eyeShapes;
const offLR = [...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 })], offFront = () => [...H(HF, { sx: 0, sy: 0 }), ...H(HLF(), { sx: 0, sy: 0 })];
const pop = (id, inF, outF, end, s = 100) => scale(id, [[0, 0, OUT], [inF, 0, OUT], [inF + 7, s * 1.12], [inF + 11, s], [outF, s, IN], [outF + 9, 0], [end, 0]]);
const at = (id, x, y, inF, outF, end, s) => [...H(id, { x, y }), ...pop(id, inF, outF, end, s)];
const hideProps = () => Object.values(ids.props).flatMap((id) => H(id, { op: 0 }));
const oneShot = (spec) => [...once(spec), ...hideProps()];
const show = (id, list) => T(id, 'op', list);
const JAW = { fill: { verts: [[89, 121], [113, 121], [101, 148]], c: [[89, 121], [113, 121], [116, 134], [109, 149], [93, 149], [86, 134]] } };
const chatter = (m1, m2, a, b, every) => { const out = []; for (let f = a, i = 0; f < b; f += every, i++) out.push(...mouth(i % 2 ? m2 : m1, f, SINE)); return out; };
const squint = (a, b) => [...eyesAt, ...bothEyes('h', [[0, 34, OUT], [a, 34, OUT], [a + 5, 22], [b, 22, OUT], [b + 6, 34]]), ...bothEyesY([[0, 0], [a, 0, OUT], [a + 5, 3], [b, 3, OUT], [b + 6, 0]])];
const wide = (a, b) => [...eyesAt, ...bothEyes('h', [[0, 34, OUT], [a, 34, OUT], [a + 4, 42], [b, 42, OUT], [b + 6, 34]]), ...bothEyes('w', [[0, 18, OUT], [a, 18, OUT], [a + 4, 22], [b, 22, OUT], [b + 6, 18]])];
const wave = (a, b, every, lo, hi) => { const out = []; for (let f = a, i = 0; f < b; f += every, i++) out.push([f, i % 2 ? hi : lo, SINE]); return out; };
// spin round his own middle: the once group turns about his feet, so each sample also moves him back onto his centre
const LIN = { x1: 0, y1: 0, x2: 1, y2: 1 };   // a straight-line curve (the key helper takes 'hold' or cubic params)
function rollAbout({ frames, turns }) {                         // turns: [[frame, degrees, centreX]]
  const x = [], y = [], r = [];
  for (let f = 0; f <= frames; f += 3) {
    let i = 0; while (i < turns.length - 2 && f > turns[i + 1][0]) i++;
    const [f0, d0, c0] = turns[i], [f1, d1, c1] = turns[i + 1], t = f1 === f0 ? 1 : Math.min(1, Math.max(0, (f - f0) / (f1 - f0))), e = t * t * (3 - 2 * t);
    const deg = d0 + (d1 - d0) * e, cx = c0 + (c1 - c0) * e, th = (deg * Math.PI) / 180;
    x.push([f, +(cx - 66 * Math.sin(th)).toFixed(2), LIN]); y.push([f, +(-66 + 66 * Math.cos(th)).toFixed(2), LIN]); r.push([f, +deg.toFixed(2), LIN]);
  }
  return { x, y, r };
}
const lin = (list) => list.map(([f, v]) => [f, v, { x1: 0, y1: 0, x2: 1, y2: 1 }]);

const outlined = (c) => [{ paintType: 'fill', color: c }, { paintType: 'stroke', color: '#ff17171f', width: 2 }];
async function group(name, parentId, x, y, op = 0) {
  const g = (await call('group_editor', { name, parentId })).group.id;
  await call('set_property_values', { propertyValues: { [g]: { 13: x, 14: y, 18: op } } });
  return g;
}
async function part(parentId, x, y, shape, r = 0) {
  const g = x || y || r ? await group(shape.name + 'At', parentId, x, y, 100) : parentId;
  if (r) await call('set_property_values', { propertyValues: { [g]: { 15: r } } });
  await call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: [{ parentId: g, x: 0, y: 0, ...shape }] } } });
}
async function makeProps() {
  if (ids.props.trophy) return;
  const p = {};
  p.gum = await group('propGum', FACE, 6, 26);
  await part(p.gum, 0, 0, { primitive: 'ellipse', name: 'gumBubble', width: 16, height: 16, paints: outlined('#ffff8fbf') });
  p.book = await group('propBook', FACE, 0, 46);
  await part(p.book, 0, 0, { primitive: 'rectangle', name: 'bookCover', width: 44, height: 28, cornerRadius: 3, paints: outlined('#ff2e6fd8') });
  await part(p.book, -10, 0, { primitive: 'rectangle', name: 'bookPageL', width: 18, height: 22, cornerRadius: 1, paints: [{ paintType: 'fill', color: '#ffffffff' }] });
  await part(p.book, 10, 0, { primitive: 'rectangle', name: 'bookPageR', width: 18, height: 22, cornerRadius: 1, paints: [{ paintType: 'fill', color: '#ffffffff' }] });
  p.note = await group('propNote', FACE, 20, 46);
  await part(p.note, 0, 0, { primitive: 'rectangle', name: 'notePad', width: 24, height: 30, cornerRadius: 2, paints: outlined('#ffffffff') });
  await part(p.note, 0, -6, { primitive: 'rectangle', name: 'noteLine1', width: 16, height: 2, paints: [{ paintType: 'fill', color: '#ff8a8fa3' }] });
  await part(p.note, 0, 0, { primitive: 'rectangle', name: 'noteLine2', width: 16, height: 2, paints: [{ paintType: 'fill', color: '#ff8a8fa3' }] });
  await part(p.note, 14, -12, { primitive: 'rectangle', name: 'pencil', width: 5, height: 24, cornerRadius: 1, paints: outlined('#ffffc93c') }, 30);
  p.trophy = await group('propTrophy', FACE, 0, -96);
  await part(p.trophy, 0, 0, { primitive: 'ellipse', name: 'trophyCup', width: 28, height: 24, paints: outlined('#ffffc93c') });
  await part(p.trophy, 0, 15, { primitive: 'rectangle', name: 'trophyStem', width: 7, height: 10, paints: outlined('#ffffc93c') });
  await part(p.trophy, 0, 21, { primitive: 'rectangle', name: 'trophyBase', width: 22, height: 6, cornerRadius: 2, paints: outlined('#ff8a8fa3') });
  p.gift = await group('propGift', FACE, 0, 46);
  await part(p.gift, 0, 0, { primitive: 'rectangle', name: 'giftBox', width: 30, height: 26, cornerRadius: 3, paints: outlined('#ffff6b5b') });
  await part(p.gift, 0, 0, { primitive: 'rectangle', name: 'giftRibbonV', width: 6, height: 26, paints: [{ paintType: 'fill', color: '#ffffc93c' }] });
  await part(p.gift, 0, 0, { primitive: 'rectangle', name: 'giftRibbonH', width: 30, height: 6, paints: [{ paintType: 'fill', color: '#ffffc93c' }] });
  p.glass = await group('propGlass', FACE, 30, -8);
  await part(p.glass, 12, 16, { primitive: 'rectangle', name: 'glassHandle', width: 6, height: 20, cornerRadius: 2, paints: outlined('#ff8a8fa3') }, -35);
  await part(p.glass, 0, 0, { primitive: 'ellipse', name: 'glassLens', width: 30, height: 30, paints: [{ paintType: 'fill', color: '#55dff3ff' }, { paintType: 'stroke', color: '#ff17171f', width: 4 }] });
  Object.assign(ids.props, p); fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  await call('animation_editor', { command: 'modifyKeyFrames', data: { modifyKeyFrames: { animationId: mids.anims['once/idle'], add: Object.values(p).map((id) => ({ objectId: id, propertyKey: 18, frame: 0, value: 0, interpolationType: 'hold' })) } } });
}

const MOVES = () => {
  const P = ids.props;
  const roll = rollAbout({ frames: 110, turns: [[0, 0, 0], [8, 0, 0], [44, 360, 44], [56, 360, 44], [92, 0, 0], [110, 0, 0]] });
  const hold = (list) => list.map(([f, v]) => [f, v, 'hold']);
  return {
    // bye-bye: both hands up waving opposite ways, a happy squint, a little sway
    byeBye: [90, [...oneShot({ r: [[0, 0], ...wave(6, 78, 12, -3, 3), [86, 0], [90, 0]] }), ...offFront(), ...at(HL, -38, -80, 2, 76, 90), ...at(HR, 38, -80, 2, 76, 90),
      ...T(HL, 'x', [[0, -38], ...wave(8, 76, 8, -44, -32), [80, -38]]), ...T(HR, 'x', [[0, 38], ...wave(8, 76, 8, 32, 44), [80, 38]]), ...squint(4, 80), ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 84, SINE)]],
    // a double jump: hop, then a bigger hop with hands up and a laugh at the top, squash landings
    doubleJump: [96, [...oneShot({ y: [[0, 0], [6, 0, OUT], [16, -22, IN], [26, 0], [32, 0, OUT], [46, -38, IN], [60, 0], [96, 0]],
        sy: [[0, 100, OUT], [6, 90], [14, 108], [24, 100], [27, 88, OUT], [32, 92], [44, 112], [58, 100], [61, 86, OUT], [70, 104], [78, 100], [96, 100]] }), ...offFront(),
      ...at(HL, -38, -80, 34, 64, 96), ...at(HR, 38, -80, 34, 64, 96), ...wide(36, 60), ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.laugh, 40, SINE), ...mouth(MOUTHS.smirk, 80, SINE)]],
    // rolling: he rolls over himself across the stage and back, like a ball
    roll: [110, [...oneShot({ x: roll.x, y: roll.y, r: roll.r }), ...allHandsOff, ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 100, SINE)]],
    // bouncing like a ball: three bounces, each lower, squash on every landing
    bounceBall: [100, [...oneShot({ y: [[0, 0, OUT], [14, -42, IN], [28, 0, OUT], [40, -24, IN], [52, 0, OUT], [60, -10, IN], [68, 0], [100, 0]],
        sy: [[0, 100], [2, 90, OUT], [10, 110], [24, 104], [28, 82, OUT], [34, 108], [48, 102], [52, 88, OUT], [58, 104], [68, 94], [74, 102], [80, 100], [100, 100]],
        sx: [[0, 100], [2, 110, OUT], [10, 92], [24, 97], [28, 118, OUT], [34, 94], [48, 99], [52, 112, OUT], [58, 97], [68, 106], [74, 99], [80, 100], [100, 100]] }), ...allHandsOff, ...wide(2, 60), ...mouth(MOUTHS.happy, 0, 'hold')]],
    // squashed flat like a pancake (eyes squeezed), held there, then pops back up with a wobble
    squash: [96, [...oneShot({ sy: [[0, 100, OUT], [6, 36], [44, 36, OUT], [52, 126], [60, 90], [68, 106], [76, 97], [84, 100], [96, 100]],
        sx: [[0, 100, OUT], [6, 152], [44, 152, OUT], [52, 84], [60, 108], [68, 96], [76, 102], [84, 100], [96, 100]] }), ...allHandsOff, ...shut(4, 46),
      ...mouth(MOUTHS.focus, 4, 'hold'), ...mouth(MOUTHS.oops, 50, SINE), ...mouth(MOUTHS.smirk, 82, SINE)]],
    // stretching super tall like taffy, eyes wide, a wobble at the top, then it snaps back
    stretchTall: [96, [...oneShot({ sy: [[0, 100, SINE], [26, 165], [32, 160], [38, 166], [50, 166, IN], [55, 82, OUT], [62, 110], [70, 96], [78, 102], [86, 100], [96, 100]],
        sx: [[0, 100, SINE], [26, 74], [32, 77], [38, 73], [50, 73, IN], [55, 118, OUT], [62, 92], [70, 103], [78, 99], [86, 100], [96, 100]] }), ...allHandsOff, ...wide(10, 52),
      ...mouth(VIS('OH'), 10, SINE), ...mouth(MOUTHS.oops, 56, SINE), ...mouth(MOUTHS.smirk, 84, SINE)]],
    // a jelly wobble that slowly dies out
    wobbleJelly: [96, [...oneShot({ sx: [[0, 100], [4, 118], [10, 86], [16, 113], [22, 90], [28, 109], [34, 93], [40, 106], [46, 96], [52, 103], [58, 98], [64, 101], [72, 100], [96, 100]].map(([f, v]) => [f, v, SINE]),
        sy: [[0, 100], [4, 84], [10, 115], [16, 89], [22, 111], [28, 92], [34, 107], [40, 95], [46, 104], [52, 97], [58, 102], [64, 99], [72, 100], [96, 100]].map(([f, v]) => [f, v, SINE]) }), ...allHandsOff,
      ...squint(2, 66), ...mouth(MOUTHS.laugh, 0, 'hold'), ...mouth(MOUTHS.smirk, 76, SINE)]],
    // peeking out to the side: leans way over to look at something, eyes on it, holds, comes back
    peekSide: [90, [...oneShot({ x: [[0, 0, OUT], [14, 22], [70, 22, SINE], [84, 0], [90, 0]], r: [[0, 0, OUT], [14, 20], [70, 20, SINE], [84, 0], [90, 0]] }), ...allHandsOff,
      ...T(E, 'x', [[0, 0, OUT], [10, 6], [70, 6], [80, 0], [90, 0]]), ...T(E, 'y', [[0, -9], [90, -9]]), ...mouth(MOUTHS.think, 0, 'hold'), ...mouth(MOUTHS.smirk, 82, SINE)]],
    // the sneaky look-around: crouched, half lids, eyes dart left, hold, right, hold, back
    sneakyLook: [110, [...oneShot({ sy: [[0, 100, OUT], [10, 94], [96, 94], [106, 100], [110, 100]], sx: [[0, 100, OUT], [10, 104], [96, 104], [106, 100], [110, 100]] }), ...allHandsOff,
      ...T(E, 'x', [[0, 0, OUT], [16, 0], [19, -7], [44, -7, OUT], [47, 7], [74, 7, OUT], [77, 0], [110, 0]]), ...T(E, 'y', [[0, -9], [110, -9]]),
      ...lidsY([[0, -25, OUT], [8, -17], [96, -17, IN], [104, -25], [110, -25]]), ...mouth(MOUTHS.listen, 0, 'hold'), ...mouth(MOUTHS.smirk, 100, SINE)]],
    // karate chop: a hand winds up high, chops down hard ("hiya!"), body squashes, fierce lids
    karate: [70, [...oneShot({ r: [[0, 0, OUT], [10, -6], [14, 4, 'hold'], [20, 4, OUT], [34, 0], [70, 0]], sy: [[0, 100], [10, 104], [14, 92, 'hold'], [20, 92, OUT], [30, 102], [38, 100], [70, 100]] }), ...offFront(),
      ...H(HL, { sx: 0, sy: 0 }), ...T(HR, 'x', [[0, 26], [10, 30, IN], [14, 30], [56, 30], [70, 30]]), ...T(HR, 'y', [[0, -40], [10, -96, IN], [14, -18], [50, -18, IN], [60, -40], [70, -40]]), ...pop(HR, 2, 52, 70, 110),
      ...lidsY([[0, -25, OUT], [6, -16], [50, -16, IN], [58, -25], [70, -25]], 14), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(VIS('AA'), 12, 'hold'), ...mouth(MOUTHS.smirk, 40, SINE)]],
    // boxing: fists up in front, jab jab with alternate hands, bobbing, fierce lids
    boxing: [96, [...oneShot({ y: [[0, 0], ...wave(6, 84, 8, 0, 3), [90, 0], [96, 0]], r: [[0, 0], [12, -4], [24, 4], [36, -4], [48, 4], [60, 0], [96, 0]] }), ...offLR,
      ...H(HF, { x: 18, y: -30 }), ...H(HLF(), { x: -18, y: -30 }),
      ...scale(HF, [[0, 0, OUT], [6, 105], [10, 95], [14, 95, OUT], [17, 150], [22, 95], [38, 95, OUT], [41, 150], [46, 95], [80, 95, IN], [88, 0], [96, 0]]),
      ...scale(HLF(), [[0, 0, OUT], [6, 105], [10, 95], [26, 95, OUT], [29, 150], [34, 95], [50, 95, OUT], [53, 150], [58, 95], [80, 95, IN], [88, 0], [96, 0]]),
      ...lidsY([[0, -25, OUT], [6, -16], [80, -16, IN], [88, -25], [96, -25]], 12), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 86, SINE)]],
    // the double flex: both arms up, pumping twice, puffed up, smug
    doubleFlex: [84, [...oneShot({ sx: [[0, 100, OUT], [10, 106], [64, 106, IN], [74, 100], [84, 100]], sy: [[0, 100, OUT], [10, 104], [64, 104, IN], [74, 100], [84, 100]] }), ...offFront(),
      ...H(HL, { x: -42, y: -62 }), ...H(HR, { x: 42, y: -62 }),
      ...[HL, HR].flatMap((h) => scale(h, [[0, 0, OUT], [8, 115], [12, 100], [22, 100, OUT], [26, 140], [34, 104], [40, 104, OUT], [44, 140], [52, 104], [64, 104, IN], [72, 0], [84, 0]])),
      ...lidsY([[0, -25], [10, -25, OUT], [16, -15], [64, -15, IN], [72, -25], [84, -25]]), ...mouth(MOUTHS.proud, 0, 'hold'), ...mouth(MOUTHS.smirk, 72, SINE)]],
    // "oh no": both hands on his cheeks, head shaking slowly, eyes wide, mouth a round "oh"
    ohNo: [96, [...oneShot({ sy: [[0, 100, OUT], [8, 96], [80, 96], [90, 100], [96, 100]] }), ...offLR, ...at(HF, 42, -52, 2, 78, 96, 110), ...at(HLF(), -42, -52, 2, 78, 96, 110),
      ...T(FACE, 'x', [[0, 0], ...wave(10, 74, 14, -4, 4), [80, 0], [96, 0]]), ...H(FACE, { y: -66, r: 0 }), ...wide(4, 82), ...mouth(VIS('OH'), 4, 'hold'), ...mouth(MOUTHS.smirk, 86, SINE)]],
    // cheering: both hands high, shaking like pom-poms, bouncing, laughing
    cheer: [96, [...oneShot({ y: [[0, 0], ...wave(6, 84, 8, 0, -5), [90, 0], [96, 0]] }), ...offFront(), ...at(HL, -40, -92, 2, 80, 96), ...at(HR, 40, -92, 2, 80, 96),
      ...T(HL, 'x', [[0, -40], ...wave(8, 80, 3, -44, -36), [82, -40]]), ...T(HR, 'x', [[0, 40], ...wave(8, 80, 3, 36, 44), [82, 40]]), ...squint(4, 84), ...mouth(MOUTHS.laugh, 0, 'hold'), ...mouth(MOUTHS.smirk, 88, SINE)]],
    // a wiggle dance: hips swinging side to side with a bounce, hands waving opposite, eyes shut happy
    wiggleDance: [120, [...oneShot({ x: [[0, 0], ...wave(6, 106, 10, -9, 9), [112, 0], [120, 0]], r: [[0, 0], ...wave(6, 106, 10, 6, -6), [112, 0], [120, 0]], sy: [[0, 100], ...wave(6, 106, 5, 97, 102), [112, 100], [120, 100]] }),
      ...offFront(), ...at(HL, -38, -34, 4, 104, 120), ...at(HR, 38, -34, 4, 104, 120), ...T(HL, 'y', [[0, -34], ...wave(8, 104, 10, -44, -28), [108, -34]]), ...T(HR, 'y', [[0, -34], ...wave(8, 104, 10, -28, -44), [108, -34]]),
      ...shut(4, 108), ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 112, SINE)]],
    // the robot: stiff snaps from pose to pose (no easing), flat eyes, a flat mouth
    robotDance: [120, [...oneShot({ r: hold([[0, 0], [10, 12], [22, 0], [34, -12], [46, 0], [58, 12], [70, -12], [82, 0], [96, 0], [120, 0]]), y: hold([[0, 0], [10, -4], [22, 0], [34, -4], [46, 0], [58, -4], [70, 0], [96, 0]]) }),
      ...offFront(), ...H(HL, { sx: 100, sy: 100 }), ...H(HR, { sx: 100, sy: 100 }),
      ...T(HL, 'x', hold([[0, 0], [10, -40], [34, -30], [58, -40], [82, -30], [100, 0]])), ...T(HL, 'y', hold([[0, 0], [10, -60], [34, -20], [58, -60], [82, -20], [100, 0]])),
      ...T(HR, 'x', hold([[0, 0], [10, 30], [34, 40], [58, 30], [82, 40], [100, 0]])), ...T(HR, 'y', hold([[0, 0], [10, -20], [34, -60], [58, -20], [82, -60], [100, 0]])),
      ...eyesAt, ...bothEyes('h', hold([[0, 34], [4, 18], [100, 18], [106, 34]])), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 106, 'hold')]],
    // scheming: rubbing his chin, eyes slid aside, a sly grin under slanted lids
    chinRub: [100, [...oneShot({ r: [[0, 0, OUT], [10, 4], [84, 4], [94, 0], [100, 0]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }), ...H(HF, { y: -24 }),
      ...T(HF, 'x', [[0, 16], ...wave(10, 80, 6, 12, 20), [84, 16]]), ...pop(HF, 4, 84, 100, 95), ...T(E, 'x', [[0, 0, OUT], [8, 5], [86, 5], [94, 0], [100, 0]]), ...T(E, 'y', [[0, -9], [100, -9]]),
      ...lidsY([[0, -25, OUT], [8, -16], [86, -16, IN], [94, -25], [100, -25]], 10), ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 92, SINE)]],
    // "call me": a hand at his ear like a phone, mouthing, then a wink
    callMe: [86, [...oneShot({ r: [[0, 0, OUT], [8, 6], [70, 6], [80, 0], [86, 0]] }), ...offFront(), ...H(HL, { sx: 0, sy: 0 }), ...at(HR, 22, -72, 2, 70, 86),
      ...eyesAt, ...T(eL.pathId, 'h', [[0, 34], [54, 34, OUT], [58, 6], [70, 6, OUT], [76, 34], [86, 34]]), ...T(eL.id, 'y', [[0, 0], [54, 0, OUT], [58, 5], [70, 5, OUT], [76, 0], [86, 0]]),
      ...chatter(VIS('EH'), MOUTHS.smirk, 8, 50, 6), ...mouth(MOUTHS.proud, 54, SINE), ...mouth(MOUTHS.smirk, 80, SINE)]],
    // "huh?": a hand cupped at his ear, leaning in, squinting, a round mouth
    cantHear: [86, [...oneShot({ r: [[0, 0, OUT], [10, 9], [70, 9], [80, 0], [86, 0]], x: [[0, 0, OUT], [10, 5], [70, 5], [80, 0], [86, 0]] }), ...offFront(), ...H(HL, { sx: 0, sy: 0 }),
      ...at(HR, 28, -62, 2, 70, 86, 112), ...squint(6, 72), ...mouth(VIS('OH'), 6, SINE), ...mouth(MOUTHS.smirk, 78, SINE)]],
    // "shh": a finger up to his lips, leaning in a little, half lids, a hushing mouth
    shush: [86, [...oneShot({ r: [[0, 0, OUT], [10, 4], [70, 4], [80, 0], [86, 0]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }), ...H(HF, { x: 4, y: -34 }),
      ...T(HF, 'sx', [[0, 0, OUT], [6, 0], [12, 70], [70, 70, IN], [78, 0], [86, 0]]), ...T(HF, 'sy', [[0, 0, OUT], [6, 0], [12, 135], [70, 135, IN], [78, 0], [86, 0]]),
      ...lidsY([[0, -25, OUT], [8, -16], [70, -16, IN], [78, -25], [86, -25]]), ...mouth(VIS('SH_R'), 0, 'hold'), ...mouth(MOUTHS.smirk, 78, SINE)]],
    // "yes yes yes": four quick nods, happy squint
    yesYes: [60, [...oneShot({ y: [[0, 0], ...wave(4, 40, 4, 4, 0), [44, 0], [60, 0]], sy: [[0, 100], ...wave(4, 40, 4, 96, 100), [44, 100], [60, 100]] }), ...allHandsOff,
      ...squint(2, 46), ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 50, SINE)]],
    // rolling on the floor laughing: tips over, lies there shaking with laughter, kicks back up
    rofl: [150, [...oneShot({ r: [[0, 0], [12, 0, IN], [26, -86, 'hold'], [30, -84], [34, -88], [38, -84], [42, -88], [46, -84], [50, -88], [54, -84], [58, -88], [62, -84], [66, -88], [70, -84], [74, -88], [78, -84], [82, -88], [86, -84], [100, -86, OUT], [116, 4], [124, -2], [130, 0], [150, 0]],
        y: [[0, 0], [12, 0, IN], [26, -60, 'hold'], [100, -60, OUT], [116, 0], [150, 0]], x: [[0, 0], [12, 0, IN], [26, 34, 'hold'], [100, 34, OUT], [116, 0], [150, 0]] }), ...allHandsOff,
      ...eyesAt, ...bothEyes('h', [[0, 34, OUT], [10, 6], [104, 6], [112, 34], [150, 34]]), ...bothEyes('w', [[0, 18, OUT], [10, 22], [104, 22], [112, 18], [150, 18]]), ...bothEyes('rad', [[0, 9, OUT], [10, 3], [104, 3], [112, 9], [150, 9]]),
      ...chatter(MOUTHS.laugh, VIS('EH'), 8, 100, 5), ...mouth(MOUTHS.happy, 104, SINE), ...mouth(MOUTHS.smirk, 140, SINE)]],
    // fainting: sways, eyes roll shut, then he melts down into a puddle, and pops back up dazed
    faint: [120, [...oneShot({ r: [[0, 0, SINE], [10, -5], [20, 5], [30, -4], [38, 0], [120, 0]], sy: [[0, 100], [38, 100, IN], [50, 40], [80, 40, OUT], [90, 114], [98, 94], [106, 102], [114, 100], [120, 100]],
        sx: [[0, 100], [38, 100, IN], [50, 160], [80, 160, OUT], [90, 90], [98, 104], [106, 99], [114, 100], [120, 100]] }), ...allHandsOff,
      ...lidsY([[0, -25, SINE], [30, -10], [86, -10, OUT], [92, -25], [120, -25]]), ...mouth(VIS('OH'), 4, SINE), ...mouth(MOUTHS.sleepy, 36, SINE), ...mouth(MOUTHS.confused, 92, SINE), ...mouth(MOUTHS.smirk, 112, SINE)]],
    // running away: dashes off screen, a beat, peeks back in, then runs back to his spot
    runAway: [140, [...oneShot({ x: [[0, 0], [6, 4, IN], [30, -230, 'hold'], [62, -230, OUT], [74, -150], [92, -150, IN], [120, 0], [140, 0]],
        r: [[0, 0], [6, -4], [12, 12], [30, 12, 'hold'], [62, 0, OUT], [74, -16], [92, -16], [104, -10], [120, 0], [140, 0]], sy: [[0, 100], [6, 92], [14, 104], [24, 100], [140, 100]] }), ...allHandsOff,
      ...wide(2, 30), ...T(E, 'x', [[0, 0], [62, 0], [74, 7], [92, 7], [104, 0], [140, 0]]), ...T(E, 'y', [[0, -9], [140, -9]]),
      ...mouth(JAW, 2, 'hold'), ...mouth(MOUTHS.think, 62, 'hold'), ...mouth(MOUTHS.smirk, 120, SINE)]],
    // startled: jumps high in fright, hands flung out, eyes huge, jaw dropped, lands and recovers
    startled: [76, [...oneShot({ y: [[0, 0, OUT], [8, -42], [16, -40, IN], [26, 0], [76, 0]], sy: [[0, 100, OUT], [4, 112], [16, 106, IN], [26, 86, OUT], [34, 104], [42, 100], [76, 100]],
        sx: [[0, 100, OUT], [4, 92], [16, 96, IN], [26, 112, OUT], [34, 97], [42, 100], [76, 100]] }), ...offFront(), ...at(HL, -44, -56, 0, 50, 76, 105), ...at(HR, 44, -56, 0, 50, 76, 105),
      ...wide(0, 56), ...mouth(JAW, 2, 'hold'), ...mouth(MOUTHS.oops, 40, SINE), ...mouth(MOUTHS.smirk, 66, SINE)]],
    // bubble gum: a pink bubble grows from his lips, wobbles, gets huge - POP - he blinks, then smug
    bubbleGum: [130, [...oneShot({ sy: [[0, 100], [86, 100, OUT], [90, 95], [96, 101], [102, 100], [130, 100]] }), ...allHandsOff,
      ...show(P.gum, [[0, 0, 'hold'], [10, 100, 'hold'], [86, 0, 'hold'], [130, 0]]),
      ...scale(P.gum, [[0, 0], [10, 30, SINE], [40, 260], [46, 245], [52, 290], [58, 278], [80, 420, IN], [86, 470], [130, 470]]), ...T(P.gum, 'y', [[0, 26], [10, 26, SINE], [80, 34], [86, 34], [130, 34]]),
      ...shut(84, 96), ...mouth(VIS('OO'), 0, 'hold'), ...mouth(MOUTHS.oops, 86, 'hold'), ...mouth(MOUTHS.proud, 104, SINE), ...mouth(MOUTHS.smirk, 124, SINE)]],
    // reading a book: holds it low in both hands, eyes running along the lines, turns a page, keeps reading
    readBook: [140, [...oneShot({ r: [[0, 0, OUT], [10, 2], [124, 2], [134, 0], [140, 0]] }), ...offLR, ...at(HF, 24, -14, 4, 124, 140, 95), ...at(HLF(), -24, -14, 4, 124, 140, 95),
      ...show(P.book, [[0, 0, 'hold'], [6, 100, 'hold'], [128, 0, 'hold'], [140, 0]]), ...scale(P.book, [[0, 0, OUT], [6, 0], [12, 110], [16, 100], [66, 100, IN], [70, 0], [74, 100, OUT], [124, 100, IN], [130, 0], [140, 0]].map(([f, v, c]) => [f, v, c])),
      ...T(E, 'x', [[0, 0, OUT], [10, -4], [30, 4], [34, -4], [56, 4], [60, -4], [80, -4], [100, 4], [104, -4], [124, 4], [132, 0], [140, 0]]), ...T(E, 'y', [[0, -9, OUT], [10, -3], [126, -3], [134, -9], [140, -9]]),
      ...mouth(MOUTHS.listen, 0, 'hold'), ...mouth(MOUTHS.think, 80, SINE), ...mouth(MOUTHS.smirk, 132, SINE)]],
    // writing a note: a notepad in front, his hand scribbling with the pencil, eyes down on it
    writeNote: [124, [...oneShot({ r: [[0, 0, OUT], [10, 3], [108, 3], [118, 0], [124, 0]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }),
      ...show(P.note, [[0, 0, 'hold'], [6, 100, 'hold'], [112, 0, 'hold'], [124, 0]]), ...scale(P.note, [[0, 0, OUT], [6, 0], [12, 140], [16, 130], [106, 130, IN], [112, 0], [124, 0]]),
      ...H(HF, { y: -16 }), ...T(HF, 'x', [[0, 34], ...wave(14, 100, 4, 30, 38), [104, 34]]), ...pop(HF, 6, 104, 124, 80),
      ...T(E, 'x', [[0, 0, OUT], [8, 4], [108, 4], [116, 0], [124, 0]]), ...T(E, 'y', [[0, -9, OUT], [8, -3], [108, -3], [116, -9], [124, -9]]),
      ...mouth(MOUTHS.think, 0, 'hold'), ...mouth(MOUTHS.smirk, 114, SINE)]],
    // the trophy: lifts a gold trophy high over his head with both hands, stretches up proud, laughing
    trophy: [110, [...oneShot({ sy: [[0, 100, OUT], [12, 108], [90, 108, IN], [100, 100], [110, 100]], sx: [[0, 100, OUT], [12, 95], [90, 95, IN], [100, 100], [110, 100]], y: [[0, 0], ...wave(16, 88, 12, 0, -4), [92, 0], [110, 0]] }),
      ...offFront(), ...at(HL, -22, -102, 4, 90, 110), ...at(HR, 22, -102, 4, 90, 110),
      ...show(P.trophy, [[0, 0, 'hold'], [6, 100, 'hold'], [96, 0, 'hold'], [110, 0]]), ...scale(P.trophy, [[0, 0, OUT], [6, 0], [14, 160], [18, 145], [90, 145, IN], [96, 0], [110, 0]]),
      ...squint(10, 92), ...mouth(MOUTHS.laugh, 0, 'hold'), ...mouth(MOUTHS.smirk, 100, SINE)]],
    // a gift: holds out a wrapped box to you with both hands, a small bow of the head, a warm smile
    gift: [110, [...oneShot({ r: [[0, 0, OUT], [10, 4], [90, 4], [100, 0], [110, 0]], y: [[0, 0], [30, 0, SINE], [40, 3], [50, 0], [110, 0]] }), ...offLR, ...at(HF, 26, -12, 4, 90, 110, 95), ...at(HLF(), -26, -12, 4, 90, 110, 95),
      ...show(P.gift, [[0, 0, 'hold'], [6, 100, 'hold'], [96, 0, 'hold'], [110, 0]]), ...scale(P.gift, [[0, 0, OUT], [6, 0], [14, 150], [18, 135], [90, 135, IN], [96, 0], [110, 0]]),
      ...squint(8, 92), ...mouth(MOUTHS.happy, 0, 'hold'), ...mouth(MOUTHS.smirk, 100, SINE)]],
    // the magnifying glass: a detective's lens moves over his face, one eye huge behind it, he hums
    magnify: [124, [...oneShot({ r: [[0, 0, OUT], [10, 4], [108, 4], [118, 0], [124, 0]] }), ...offLR, ...H(HLF(), { sx: 0, sy: 0 }),
      ...show(P.glass, [[0, 0, 'hold'], [6, 100, 'hold'], [112, 0, 'hold'], [124, 0]]), ...scale(P.glass, [[0, 0, OUT], [6, 0], [12, 130], [16, 120], [106, 120, IN], [112, 0], [124, 0]]),
      ...T(P.glass, 'x', [[0, 25], [16, 25, SINE], [50, 30], [80, 18], [106, 25], [124, 25]]), ...T(P.glass, 'y', [[0, -10], [16, -10, SINE], [50, -4], [80, -12], [106, -10], [124, -10]]),
      ...H(HF, { x: 52, y: -40 }), ...pop(HF, 6, 106, 124, 85), ...eyesAt, ...T(eR.pathId, 'h', [[0, 34, OUT], [10, 46], [106, 46], [114, 34], [124, 34]]), ...T(eR.pathId, 'w', [[0, 18, OUT], [10, 26], [106, 26], [114, 18], [124, 18]]),
      ...T(eR.pathId, 'rad', [[0, 9, OUT], [10, 13], [106, 13], [114, 9], [124, 9]]), ...mouth(MOUTHS.think, 0, 'hold'), ...mouth(MOUTHS.smirk, 116, SINE)]],
    // dozing off: lids sink, head drops, a nod or two - then he jolts awake, eyes wide, shakes it off
    dozeOff: [130, [...oneShot({ y: [[0, 0, SINE], [60, 4], [64, 2], [70, 5], [86, 5, OUT], [90, -8], [96, 0], [130, 0]], sy: [[0, 100], [86, 100, OUT], [90, 108], [98, 96], [104, 101], [110, 100], [130, 100]] }), ...allHandsOff,
      ...lidsY([[0, -25, SINE], [60, -8], [86, -8, 'hold'], [87, -25], [130, -25]]), ...T(FACE, 'r', [[0, 0], [100, 0, SINE], [104, -6], [108, 6], [112, -4], [116, 0], [130, 0]]), ...H(FACE, { x: 0, y: -66 }),
      ...eyesAt, ...bothEyes('h', [[0, 34], [86, 34, OUT], [88, 42], [100, 42], [108, 34], [130, 34]]), ...mouth(MOUTHS.sleepy, 0, 'hold'), ...mouth(MOUTHS.oops, 88, 'hold'), ...mouth(MOUTHS.smirk, 116, SINE)]],
    // a big stretch: both arms up high, tall and thin, leaning one way then the other, eyes shut, a yawny mouth
    bigStretch: [110, [...oneShot({ sy: [[0, 100, SINE], [20, 112], [80, 112, SINE], [96, 100], [110, 100]], sx: [[0, 100, SINE], [20, 92], [80, 92, SINE], [96, 100], [110, 100]], r: [[0, 0, SINE], [36, -9], [60, 9], [80, 0], [110, 0]] }),
      ...offFront(), ...at(HL, -20, -104, 6, 82, 110), ...at(HR, 20, -104, 6, 82, 110), ...shut(6, 86), ...mouth(VIS('OH'), 10, SINE), ...mouth(MOUTHS.happy, 84, SINE), ...mouth(MOUTHS.smirk, 104, SINE)]],
    // air guitar: one hand strumming low, the other up on the neck, rocking, eyes shut, singing
    airGuitar: [120, [...oneShot({ r: [[0, 0], ...wave(6, 104, 12, -5, 5), [110, 0], [120, 0]], y: [[0, 0], ...wave(6, 104, 6, 0, 2), [110, 0], [120, 0]] }), ...offLR,
      ...H(HF, { x: 30 }), ...T(HF, 'y', [[0, -10], ...wave(8, 100, 4, -18, -4), [104, -10]]), ...pop(HF, 2, 104, 120, 95), ...at(HLF(), -44, -46, 2, 104, 120, 95),
      ...shut(4, 108), ...chatter(VIS('OH'), VIS('EH'), 8, 100, 10), ...mouth(MOUTHS.smirk, 110, SINE)]],
    // mind blown: hands to his temples, eyes huge - BOOM - puffs burst off the top of his head, he stretches up then flops back
    mindBlown: [110, [...oneShot({ sy: [[0, 100], [30, 100, OUT], [34, 116], [44, 108], [52, 94], [60, 102], [68, 100], [110, 100]], sx: [[0, 100], [30, 100, OUT], [34, 90], [44, 95], [52, 105], [60, 99], [68, 100], [110, 100]] }),
      ...offLR, ...at(HF, 44, -60, 2, 30, 110, 105), ...at(HLF(), -44, -60, 2, 30, 110, 105), ...wide(2, 96),
      ...show(ids.props.steam, [[0, 0, 'hold'], [30, 100, 'hold'], [56, 100, SINE], [70, 0], [110, 0]]), ...T(ids.props.steam, 'y', [[0, -70], [30, -70, OUT], [60, -96], [110, -96]]),
      ...scale(ids.props.steam, [[0, 0], [30, 0, OUT], [36, 230], [60, 260], [110, 260]]),
      ...mouth(VIS('OH'), 2, 'hold'), ...mouth(JAW, 30, 'hold'), ...mouth(MOUTHS.oops, 70, SINE), ...mouth(MOUTHS.smirk, 100, SINE)]],
  };
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  await makeProps();
  const moves = MOVES(), only = process.argv.slice(2);
  const vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi');
  // a move's name must be a new trigger: reusing another control's name (the rig's number 'stretch') wired a condition that was always true
  const clash = Object.keys(moves).filter((n) => vm.viewModelProperties.some((p) => p.name === n && p.propertyType !== 'trigger'));
  if (clash.length) throw new Error('names already used by non-trigger controls: ' + clash.join(', '));
  const want = Object.keys(moves).filter((n) => !vm.viewModelProperties.some((p) => p.name === n));
  if (want.length) await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: want.map((name) => ({ name, propertyType: 'trigger' })) }] });
  for (const [name, [frames, keys]] of Object.entries(moves)) {
    if (only.length && !only.includes(name)) continue;
    await newAnim('once/' + name, frames); await anim('once/' + name, frames, keys); await wire('PlayOnce', 'once/' + name, name, 'once/idle');
  }
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
