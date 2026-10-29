// Dombi emotes, round 1 of the owner's "way more" batch (2026-10-30): nine moves with no new props.
//   shrug, headScratch, armsCrossed, fingerWag, flex, brushShoulders, stomp, bow (hand on chest, the Uzbek greeting), melt
// PlayOnce one-shots (Any --trigger--> once/<name> --> once/idle), each whole on its own. 60 fps.
// Hands: handL / handR are arm-local and sit BEHIND the body ((0, 0) = tucked away; global = local + (62 | 138, 128));
// handRFront is the one hand IN FRONT of him (global ≈ local + (100, 166): (0, -26) is his chest, (-18, -80) his forehead).
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const { MOUTHS } = require('../icons/dombi_rig');
const { SINE, OUT, IN, T, H, mouth, anim, newAnim, wire, once, scale, bothEyes, eyesAt, lidsY, allHandsOff, shut } = require('./dombi_redo');
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });

const E = ids.eyes, HL = ids.handL, HR = ids.handR, HF = ids.handRFront, AR = ids.armR;
const offLR = [...H(HL, { sx: 0, sy: 0 }), ...H(HR, { sx: 0, sy: 0 })], offF = H(HF, { sx: 0, sy: 0 });
const pop = (id, inF, outF, end, s = 100) => scale(id, [[0, 0, OUT], [inF, 0, OUT], [inF + 7, s * 1.12], [inF + 11, s], [outF, s, IN], [outF + 9, 0], [end, 0]]);

const MOVES = {
  // shrug: "I dunno" - shoulders up, palms out at both sides, head tilt, eyes aside, flat crooked mouth, then drop
  shrug: [60, [...once({ sy: [[0, 100, OUT], [8, 105], [40, 105, IN], [48, 99], [54, 100], [60, 100]], sx: [[0, 100, OUT], [8, 97], [40, 97, IN], [48, 101], [54, 100], [60, 100]],
      r: [[0, 0, OUT], [8, 5], [40, 5], [52, 0], [60, 0]] }), ...offF,
    ...H(HL, { x: -38, y: -40 }), ...H(HR, { x: 38, y: -40 }), ...pop(HL, 2, 42, 60), ...pop(HR, 3, 42, 60),
    ...eyesAt, ...bothEyes('h', [[0, 34, OUT], [6, 38], [42, 38], [50, 34], [60, 34]]), ...T(E, 'x', [[0, 0, OUT], [6, -4], [42, -4], [52, 0], [60, 0]]), ...T(E, 'y', [[0, -9, OUT], [6, -12], [42, -12], [52, -9], [60, -9]]),
    ...mouth(MOUTHS.confused, 0, 'hold'), ...mouth(MOUTHS.smirk, 50, SINE)]],
  // head scratch: a hand up at the top of his head scratching, head tipped, eyes up and to the side, a thinking mouth
  headScratch: [84, [...once({ r: [[0, 0, OUT], [10, -5], [64, -5, SINE], [76, 0], [84, 0]] }), ...offF, ...H(HL, { sx: 0, sy: 0 }),
    ...T(HR, 'x', [[0, 12], [16, 12], [20, 6], [24, 13], [28, 6], [32, 13], [36, 6], [40, 13], [44, 6], [48, 12], [84, 12]]), ...H(HR, { y: -88 }), ...pop(HR, 2, 62, 84),
    ...T(E, 'x', [[0, 0, OUT], [8, -4], [64, -4], [74, 0], [84, 0]]), ...T(E, 'y', [[0, -9, OUT], [8, -14], [64, -14], [74, -9], [84, -9]]),
    ...mouth(MOUTHS.think, 0, 'hold'), ...mouth(MOUTHS.smirk, 72, SINE)]],
  // arms crossed: the front hand becomes a bar across his chest, elbows peek out at the sides, chin up, half lids, flat mouth
  armsCrossed: [96, [...once({ r: [[0, 0, OUT], [10, -2], [76, -2, SINE], [88, 0], [96, 0]], sy: [[0, 100, OUT], [10, 102], [76, 102], [88, 100], [96, 100]] }),
    ...H(HF, { x: 0, y: -10 }), ...T(HF, 'sx', [[0, 0, OUT], [6, 0], [13, 320], [17, 300], [76, 300, IN], [86, 0], [96, 0]]), ...T(HF, 'sy', [[0, 0, OUT], [6, 0], [13, 66], [17, 58], [76, 58, IN], [86, 0], [96, 0]]),
    ...H(HL, { x: -14, y: 28 }), ...H(HR, { x: 14, y: 28 }), ...pop(HL, 4, 76, 96, 90), ...pop(HR, 4, 76, 96, 90),
    ...lidsY([[0, -25], [10, -25, OUT], [16, -16], [76, -16, IN], [86, -25], [96, -25]]), ...T(E, 'y', [[0, -9], [96, -9]]), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 84, SINE)]],
  // finger-wag: "no no no" - a hand up by his face wagging, head shaking the other way, firm lids, flat mouth
  fingerWag: [70, [...once({ r: [[0, 0], [10, 0], [16, -3], [22, 3], [28, -3], [34, 3], [40, -3], [46, 0], [70, 0]] }), ...offLR,
    ...H(HF, { y: -82 }), ...T(HF, 'x', [[0, 76], [12, 76], [16, 86], [22, 72], [28, 86], [34, 72], [40, 86], [46, 78], [70, 78]]), ...pop(HF, 2, 52, 70, 95),
    ...lidsY([[0, -25], [8, -25, OUT], [14, -16], [52, -16, IN], [60, -25], [70, -25]], 8), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 58, SINE)]],
  // flex: one hand up at his side like a bicep, it pumps twice, he puffs up, smug lids, proud mouth
  flex: [80, [...once({ sx: [[0, 100, OUT], [10, 104], [60, 104, IN], [70, 100], [80, 100]], sy: [[0, 100, OUT], [10, 104], [60, 104, IN], [70, 100], [80, 100]], r: [[0, 0], [10, 3], [60, 3], [70, 0], [80, 0]] }),
    ...offF, ...H(HL, { sx: 0, sy: 0 }), ...H(HR, { x: 40, y: -62 }),
    ...scale(HR, [[0, 0, OUT], [8, 115], [12, 100], [20, 100, OUT], [24, 140], [32, 104], [38, 104, OUT], [42, 140], [50, 104], [62, 104, IN], [70, 0], [80, 0]]),
    ...T(AR, 'r', [[0, 0], [20, 0, OUT], [24, -12], [32, 0], [38, 0, OUT], [42, -12], [50, 0], [80, 0]]),
    ...lidsY([[0, -25], [10, -25, OUT], [16, -15], [62, -15, IN], [70, -25], [80, -25]]), ...mouth(MOUTHS.proud, 0, 'hold'), ...mouth(MOUTHS.smirk, 68, SINE)]],
  // brushing his shoulders off: the front hand flicks dirt off one shoulder twice, then the other, chin up, smug
  brushShoulders: [96, [...once({ r: [[0, 0, OUT], [8, 3], [40, 3, SINE], [48, -3], [80, -3], [90, 0], [96, 0]] }), ...offLR,
    ...T(HF, 'x', [[0, 46], [12, 46, OUT], [16, 64], [20, 48], [24, 64], [28, 48], [40, 48, SINE], [48, -48], [52, -64], [56, -48], [60, -64], [64, -48], [96, -48]]),
    ...T(HF, 'y', [[0, -98], [12, -98, OUT], [16, -88], [20, -98], [24, -88], [28, -98], [40, -98], [52, -88], [56, -98], [60, -88], [64, -98], [96, -98]]), ...pop(HF, 2, 74, 96, 90),
    ...lidsY([[0, -25], [8, -25, OUT], [14, -15], [80, -15, IN], [88, -25], [96, -25]]), ...mouth(MOUTHS.proud, 0, 'hold'), ...mouth(MOUTHS.smirk, 84, SINE)]],
  // stomp: rises on his toes, slams down (a hard squash, held a beat), rattles from the impact, fists at his sides, angry lids
  stomp: [60, [...once({ y: [[0, 0, OUT], [10, -12], [13, 0, 'hold'], [60, 0]], sy: [[0, 100, OUT], [10, 108], [13, 82, 'hold'], [18, 82, OUT], [26, 104], [34, 98], [42, 100], [60, 100]],
      sx: [[0, 100, OUT], [10, 95], [13, 118, 'hold'], [18, 118, OUT], [26, 97], [34, 101], [42, 100], [60, 100]], x: [[0, 0], [18, 0], [20, 3], [22, -3], [24, 2], [26, -2], [28, 0], [60, 0]] }), ...offF,
    ...H(HL, { x: -34, y: -22 }), ...H(HR, { x: 34, y: -22 }), ...pop(HL, 2, 44, 60, 95), ...pop(HR, 2, 44, 60, 95),
    ...lidsY([[0, -25, OUT], [6, -15], [46, -15, IN], [54, -25], [60, -25]], 12), ...mouth(MOUTHS.focus, 0, 'hold'), ...mouth(MOUTHS.smirk, 52, SINE)]],
  // bow: the Uzbek greeting - hand on his chest, a slow bow (down and squashed), eyes shut, a warm smile, back up
  bow: [96, [...once({ sy: [[0, 100, SINE], [14, 100], [34, 92], [62, 92, SINE], [80, 100], [96, 100]], sx: [[0, 100, SINE], [14, 100], [34, 105], [62, 105, SINE], [80, 100], [96, 100]],
      y: [[0, 0], [14, 0, SINE], [34, 3], [62, 3, SINE], [80, 0], [96, 0]] }), ...offLR,
    ...H(HF, { x: -14, y: -24 }), ...pop(HF, 2, 78, 96, 95), ...shut(24, 64), ...mouth(MOUTHS.smirk, 0, 'hold'), ...mouth(MOUTHS.happy, 22, SINE), ...mouth(MOUTHS.smirk, 82, SINE)]],
  // melt: bored, he sinks slowly into a puddle (eyes droop shut), lies there with a little ripple, then pops back up
  melt: [160, [...once({ sy: [[0, 100, SINE], [56, 38], [100, 38, SINE], [104, 40], [108, 38], [114, 38, OUT], [124, 114], [132, 94], [140, 103], [148, 100], [160, 100]],
      sx: [[0, 100, SINE], [56, 168], [100, 168, SINE], [104, 164], [108, 168], [114, 168, OUT], [124, 90], [132, 104], [140, 98], [148, 100], [160, 100]] }), ...allHandsOff,
    ...shut(20, 112), ...mouth(MOUTHS.sleepy, 0, 'hold'), ...mouth(MOUTHS.oops, 116, 'hold'), ...mouth(MOUTHS.smirk, 132, SINE)]],
};

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const only = process.argv.slice(2);
  const vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi');
  const want = Object.keys(MOVES).filter((n) => !vm.viewModelProperties.some((p) => p.name === n));
  if (want.length) await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: want.map((name) => ({ name, propertyType: 'trigger' })) }] });
  for (const [name, [frames, keys]] of Object.entries(MOVES)) {
    if (only.length && !only.includes(name)) continue;
    await newAnim('once/' + name, frames); await anim('once/' + name, frames, keys); await wire('PlayOnce', 'once/' + name, name, 'once/idle');
  }
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
