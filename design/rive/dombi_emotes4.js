// Dombi emotes, round 3 of the owner's "way more" batch (2026-10-30): moves with props, plus the rest of the list.
//   micDrop, idea (lightbulb), steam, sweat, chefKiss, hideFace, laughHard, flop, whisper
// Props live in the face group (face-local = 200-space - (100, 104): (0, -66) is the top of his head, (4, 24) his mouth), so they
// move with his head; each starts hidden (opacity 0) and only its one-shot shows it; once/idle hides them all again.
// Hands as in dombi_emotes3.js: handL / handR behind him (global = local + (62 | 138, 128)), the two front hands in front
// (global ≈ local + (100, 166)). 60 fps.
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

const E = ids.eyes, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, AR = ids.armR;
const HLF = () => ids.handLFront;
const offLR = [...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 })];
const pop = (id, inF, outF, end, s = 100) => scale(id, [[0, 0, OUT], [inF, 0, OUT], [inF + 7, s * 1.12], [inF + 11, s], [outF, s, IN], [outF + 9, 0], [end, 0]]);
const P = () => ids.props;                                         // { mic, bulb, steam, sweat }: prop group ids
const show = (id, list) => T(id, 'op', list);
const hideProps = () => Object.values(P()).flatMap((id) => H(id, { op: 0 }));
const oneShot = (spec) => [...once(spec), ...hideProps()];          // a one-shot that hides every prop it doesn't key itself

async function group(name, parentId, x, y) {
  const r = await call('group_editor', { name, parentId });
  await call('set_property_values', { propertyValues: { [r.group.id]: { 13: x, 14: y, 18: 0 } } });
  return r.group.id;
}
const shapes = (parentId, list) => call('path_editor', { command: 'createParametricShapes', data: { createParametricShapes: { shapes: list.map((s) => ({ parentId, ...s })) } } });
const fill = (c) => [{ paintType: 'fill', color: c }], outlined = (c) => [{ paintType: 'fill', color: c }, { paintType: 'stroke', color: '#ff17171f', width: 2 }];

async function makeProps() {
  if (ids.props) return;
  const F = ids.face, p = {};
  p.mic = await group('propMic', F, 70, -40);                       // in his raised right hand
  await shapes(p.mic, [{ primitive: 'rectangle', name: 'micHandle', x: 0, y: 9, width: 7, height: 18, cornerRadius: 3, paints: outlined('#ff45455a') },
    { primitive: 'ellipse', name: 'micHead', x: 0, y: -4, width: 13, height: 13, paints: outlined('#ffc9ccd6') }]);
  p.bulb = await group('propBulb', F, 0, -86);                      // above his head
  await shapes(p.bulb, [{ primitive: 'rectangle', name: 'bulbBase', x: 0, y: 11, width: 9, height: 7, cornerRadius: 2, paints: outlined('#ff8a8fa3') },
    { primitive: 'ellipse', name: 'bulbGlass', x: 0, y: 0, width: 20, height: 20, paints: outlined('#ffffc93c') }]);
  p.steam = await group('propSteam', F, 0, -76);                    // puffs off the top of his head
  await shapes(p.steam, [{ primitive: 'ellipse', name: 'puffL', x: -18, y: 4, width: 13, height: 13, paints: outlined('#ff8a8fa3') },
    { primitive: 'ellipse', name: 'puffM', x: 0, y: -4, width: 16, height: 16, paints: outlined('#ff8a8fa3') },
    { primitive: 'ellipse', name: 'puffR', x: 18, y: 4, width: 12, height: 12, paints: outlined('#ff8a8fa3') }]);   // grey: near-white vanished on the light stage
  p.sweat = await group('propSweat', F, 50, -36);                   // a drop at his temple
  await shapes(p.sweat, [{ primitive: 'ellipse', name: 'sweatDrop', x: 0, y: 0, width: 8, height: 12, paints: outlined('#ff5ab4f0') }]);
  // a part's own x / y inside a prop group was lost at runtime (every part drew at the group's centre: one puff, a mic with
  // no handle), so each offset part gets a small group carrying the offset instead
  for (const gid of Object.values(p)) {
    const q = await call('query_objects', { objectIds: [gid], depth: 1 });
    for (const sh of (q.objects || JSON.parse(q.content).objects).filter((o) => o.types.includes('Shape'))) {
      const v = (await call('query_property_values', { propertyKeys: { [sh.id]: [13, 14] } })).values[sh.id]; if (!v[13] && !v[14]) continue;
      const g = (await call('group_editor', { name: sh.name + 'At', parentId: gid })).group.id;
      await call('reparent_objects', { operations: [{ objectId: sh.id, newParentId: g }] });
      await call('set_property_values', { propertyValues: { [g]: { 13: v[13], 14: v[14] }, [sh.id]: { 13: 0, 14: 0 } } });
    }
  }
  ids.props = p; fs.writeFileSync(path.join(__dirname, 'dombi_ids.json'), JSON.stringify(ids, null, 1));
  // once/idle (where every one-shot returns) hides them all
  await call('animation_editor', { command: 'modifyKeyFrames', data: { modifyKeyFrames: { animationId: mids.anims['once/idle'], add: Object.values(p).map((id) => ({ objectId: id, propertyKey: 18, frame: 0, value: 0, interpolationType: 'hold' })) } } });
}

const MOVES = () => ({
  // mic drop: a mic in his raised hand, a beat, he lets go - it drops past his side and is gone - smug, eyes shut
  micDrop: [84, [...oneShot({ r: [[0, 0], [8, 3], [60, 3], [72, 0], [84, 0]] }), ...H(HF, { sx: 0, sy: 0 }), ...H(HL, { sx: 0, sy: 0 }),
    ...H(HR, { x: 34, y: -62 }), ...scale(HR, [[0, 0, OUT], [8, 112], [12, 100], [30, 100, OUT], [33, 120], [37, 100], [62, 100, IN], [72, 0], [84, 0]]),
    ...show(P().mic, [[0, 0, 'hold'], [8, 100, 'hold'], [52, 100, IN], [58, 0], [84, 0]]), ...T(P().mic, 'y', [[0, -40], [33, -40, IN], [56, 40], [84, 40]]),
    ...T(P().mic, 'r', [[0, 0], [33, 0, IN], [56, 70], [84, 70]]), ...H(P().mic, { x: 70, sx: 175, sy: 175 }),
    ...shut(34, 66), ...mouth(MOUTHS.proud, 0, 'hold'), ...mouth(MOUTHS.smirk, 72, SINE)]],
  // idea: eyes up, a pause, the bulb pops in above his head (spring), he lights up (wide eyes, smile, a little hop), bulb fades
  idea: [84, [...oneShot({ y: [[0, 0], [20, 0, OUT], [26, -8], [34, 0], [84, 0]], sy: [[0, 100], [20, 100, OUT], [24, 94], [28, 106], [36, 100], [84, 100]] }), ...allHandsOff,
    ...show(P().bulb, [[0, 0, 'hold'], [18, 100, 'hold'], [68, 100, SINE], [80, 0], [84, 0]]), ...scale(P().bulb, [[0, 0], [18, 0, OUT], [24, 165], [29, 125], [34, 138], [40, 135], [84, 135]]),
    ...T(E, 'y', [[0, -9, OUT], [6, -15], [18, -15], [22, -9], [84, -9]]), ...T(E, 'x', [[0, 0], [84, 0]]), ...eyesAt,
    ...bothEyes('h', [[0, 34], [18, 34, OUT], [23, 40], [60, 40], [70, 34], [84, 34]]), ...mouth(MOUTHS.think, 0, 'hold'), ...mouth(MOUTHS.happy, 20, SINE), ...mouth(MOUTHS.smirk, 72, SINE)]],
  // steam: fuming - puffs rise off his head twice, he shakes with rage (small fast jitter), angry lids, flat mouth
  steam: [96, [...oneShot({ x: [[0, 0], [10, 0], [12, 2], [14, -2], [16, 2], [18, -2], [20, 0], [50, 0], [52, 2], [54, -2], [56, 2], [58, -2], [60, 0], [96, 0]],
      sy: [[0, 100, OUT], [8, 103], [80, 103], [90, 100], [96, 100]] }), ...allHandsOff,
    ...show(P().steam, [[0, 0, 'hold'], [10, 100, 'hold'], [34, 100, SINE], [44, 0, 'hold'], [48, 100, 'hold'], [72, 100, SINE], [84, 0], [96, 0]]),
    ...T(P().steam, 'y', [[0, -76], [10, -76, OUT], [44, -100, 'hold'], [48, -76, OUT], [84, -100], [96, -100]]),
    ...scale(P().steam, [[0, 90], [10, 90, OUT], [44, 170, 'hold'], [48, 90, OUT], [84, 170], [96, 170]]),
    ...lidsY([[0, -25, OUT], [6, -15], [84, -15, IN], [92, -25], [96, -25]], 14), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 90, SINE)]],
  // sweat: nervous - a drop beads at his temple and slides down, eyes dart aside, a tight awkward mouth, a small gulp
  sweat: [90, [...oneShot({ sy: [[0, 100], [40, 100, OUT], [44, 97], [50, 101], [56, 100], [90, 100]] }), ...allHandsOff,
    ...show(P().sweat, [[0, 0, 'hold'], [8, 100, 'hold'], [64, 100, SINE], [74, 0], [90, 0]]), ...T(P().sweat, 'y', [[0, -40], [8, -40, SINE], [70, -6], [90, -6]]),
    ...scale(P().sweat, [[0, 0], [8, 0, OUT], [16, 190], [22, 170], [90, 170]]),
    ...T(E, 'x', [[0, 0, OUT], [6, -5], [30, -5, OUT], [34, 5], [60, 5, SINE], [72, 0], [90, 0]]), ...T(E, 'y', [[0, -9], [90, -9]]),
    ...mouth(MOUTHS.listen, 0, 'hold'), ...mouth(VIS('MBP'), 42, SINE), ...mouth(MOUTHS.listen, 50, SINE), ...mouth(MOUTHS.smirk, 80, SINE)]],
  // chef's kiss: the front hand to his lips (a kiss mouth, eyes shut), then flung out and open - "perfection"
  chefKiss: [72, [...oneShot({ r: [[0, 0], [10, -3], [30, -3, OUT], [36, 4], [56, 4], [66, 0], [72, 0]] }), ...offLR,
    ...T(HF, 'x', [[0, 30, OUT], [10, 4], [28, 4, OUT], [36, 46], [72, 46]]), ...T(HF, 'y', [[0, -10, OUT], [10, -40], [28, -40, OUT], [36, -78], [72, -78]]),
    ...scale(HF, [[0, 0, OUT], [8, 90], [28, 90, OUT], [33, 140], [38, 120], [56, 120, IN], [64, 0], [72, 0]]),
    ...shut(10, 50), ...mouth(MOUTHS.smirk, 0, 'hold'), ...mouth(VIS('OO'), 10, SINE), ...mouth(VIS('OO'), 28, OUT), ...mouth(MOUTHS.happy, 34, SINE), ...mouth(MOUTHS.smirk, 64, SINE)]],
  // hiding his face: both front hands cover his eyes, he shrinks a little, one hand slides down to peek, back, then hands away
  hideFace: [100, [...oneShot({ sy: [[0, 100, OUT], [10, 95], [84, 95, SINE], [94, 100], [100, 100]], sx: [[0, 100, OUT], [10, 104], [84, 104, SINE], [94, 100], [100, 100]] }), ...offLR,
    ...H(HF, { x: 22 }), ...H(HLF(), { x: -22 }), ...T(HF, 'y', [[0, -70], [44, -70, OUT], [52, -48], [66, -48, IN], [72, -70], [100, -70]]), ...H(HLF(), { y: -70 }),
    ...scale(HF, [[0, 0, OUT], [8, 150], [12, 140], [82, 140, IN], [92, 0], [100, 0]]), ...scale(HLF(), [[0, 0, OUT], [6, 150], [10, 140], [82, 140, IN], [92, 0], [100, 0]]),
    ...T(E, 'x', [[0, 0], [44, 0, OUT], [52, 3], [66, 3], [72, 0], [100, 0]]), ...T(E, 'y', [[0, -9], [100, -9]]), ...mouth(MOUTHS.listen, 0, 'hold'), ...mouth(MOUTHS.smirk, 90, SINE)]],
  // laughing hard: bouncing with each "ha", head thrown back, a hand on his belly, eyes squeezed, mouth wide open
  laughHard: (() => {
    const y = [], sy = [], m = [];
    for (let b = 6; b < 90; b += 10) { y.push([b, 0, OUT], [b + 5, -6, IN]); sy.push([b, 96, OUT], [b + 5, 103, IN]); m.push(...mouth(MOUTHS.laugh, b, SINE), ...mouth(VIS('EH'), b + 5, SINE)); }
    y.push([96, 0], [110, 0]); sy.push([96, 100], [110, 100]);
    return [110, [...oneShot({ y: [[0, 0], ...y], sy: [[0, 100], ...sy], r: [[0, 0, OUT], [8, -6], [90, -6, SINE], [102, 0], [110, 0]] }), ...offLR,
      ...H(HF, { x: 6, y: -14 }), ...pop(HF, 2, 92, 110, 110), ...eyesAt,
      ...bothEyes('w', [[0, 18, OUT], [6, 22], [96, 22], [104, 18], [110, 18]]), ...bothEyes('h', [[0, 34, OUT], [6, 6], [96, 6], [104, 34], [110, 34]]),
      ...bothEyes('rad', [[0, 9, OUT], [6, 3], [96, 3], [104, 9], [110, 9]]), ...bothEyesY([[0, 0, OUT], [6, 3], [96, 3], [104, 0], [110, 0]]),
      ...m, ...mouth(MOUTHS.smirk, 100, SINE)]];
  })(),
  // the dramatic flop: a gasp, he tips over sideways onto the floor (eyes shut), lies there a beat, then springs back up
  flop: [130, [...oneShot({ r: [[0, 0], [12, 0, IN], [30, -86, 'hold'], [33, -82], [36, -86], [84, -86, OUT], [100, 6], [108, -3], [114, 0], [130, 0]],
      y: [[0, 0], [12, 0, IN], [30, -60, 'hold'], [84, -60, OUT], [100, 0], [130, 0]], x: [[0, 0], [12, 0, IN], [30, 34, 'hold'], [84, 34, OUT], [100, 0], [130, 0]],
      sy: [[0, 100, OUT], [8, 106], [12, 104, IN], [30, 92], [36, 100], [84, 100, OUT], [96, 108], [104, 96], [112, 100], [130, 100]] }), ...allHandsOff,
    ...shut(22, 88), ...mouth(VIS('OH'), 4, SINE), ...mouth(MOUTHS.sleepy, 24, SINE), ...mouth(MOUTHS.oops, 92, SINE), ...mouth(MOUTHS.smirk, 112, SINE)]],
  // whisper: leans in close, a hand up beside his mouth, eyes narrowed and on you, mouth in a small "shh" shape
  whisper: [90, [...oneShot({ x: [[0, 0, OUT], [12, 6], [70, 6, SINE], [84, 0], [90, 0]], r: [[0, 0, OUT], [12, 7], [70, 7, SINE], [84, 0], [90, 0]],
      sy: [[0, 100, OUT], [12, 97], [70, 97], [84, 100], [90, 100]] }), ...offLR,
    ...H(HF, { x: 36, y: -40 }), ...pop(HF, 6, 70, 90, 95), ...lidsY([[0, -25, OUT], [10, -16], [70, -16, IN], [80, -25], [90, -25]]),
    ...T(E, 'x', [[0, 0, OUT], [10, 3], [70, 3], [80, 0], [90, 0]]), ...T(E, 'y', [[0, -9], [90, -9]]),
    ...mouth(VIS('SH_R'), 0, 'hold'), ...mouth(VIS('EH'), 30, SINE), ...mouth(VIS('SH_R'), 40, SINE), ...mouth(VIS('EH'), 50, SINE), ...mouth(MOUTHS.smirk, 80, SINE)]],
});

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
