// Retouch of the owner's hands/wave (2026-10-10), keeping their beats: hand out (0-13), three swings, put away.
// Their swings were straight diagonal x/y moves (reads as bobbing); a wave pivots. Now:
//   hand slides out from behind to beside the head (ease-out, small overshoot) -> armR rotates side to side around the
//   shoulder, each swing smaller (−14/+10/−14/+8/−8/0) -> short hold -> hand tucks back behind the body.
//   Body: act leans 3° toward the waving hand, starting 4 frames after the arm (overlap), back to 0 at the end.
// hands/wave-loop is reset to the new end pose (hand put away).
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const k = (part, p, frame, value, c = SINE) => ({ objectId: ids[part], propertyKey: K[p], frame, value, interpolationType: 'cubic', cubicParams: c });

function neutral(f) {   // every hands-owned property at rest
  return [k('armL', 'r', f, 0), k('armR', 'r', f, 0), k('act', 'x', f, 0), k('act', 'y', f, 0), k('act', 'r', f, 0), k('act', 'sx', f, 100), k('act', 'sy', f, 100),
    ...['handL', 'handR'].flatMap(h => [k(h, 'x', f, 0), k(h, 'y', f, 0), k(h, 'sx', f, 100), k(h, 'sy', f, 100)]),
    k('handRFront', 'x', f, 0), k('handRFront', 'y', f, 0), k('handRFront', 'sx', f, 0), k('handRFront', 'sy', f, 0)];
}

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const wave = mids.anims['hands/wave'], loop = mids.anims['hands/wave-loop'];
  const q = await ae('queryKeyFrames', { animationIds: [wave, loop] });
  for (const id of [wave, loop]) { const old = (q.keyframes[id] || []).map(x => x.keyframeId); if (old.length) await ae('modifyKeyFrames', { animationId: id, delete: old }); }

  const UP = { x: 38, y: -72 };   // hand up beside the head (from the shoulder)
  const add = neutral(0).filter(x => !(x.objectId === ids.handR && (x.propertyKey === K.x || x.propertyKey === K.y)) && !(x.objectId === ids.armR) && !(x.objectId === ids.act && x.propertyKey === K.r));
  add.push(
    // out from behind: fast, tiny overshoot, settle
    k('handR', 'x', 0, 0, OUT), k('handR', 'y', 0, 0, OUT), k('handR', 'x', 11, UP.x + 2), k('handR', 'y', 11, UP.y - 4), k('handR', 'x', 16, UP.x), k('handR', 'y', 16, UP.y),
    k('handR', 'x', 92, UP.x, IN), k('handR', 'y', 92, UP.y, IN), k('handR', 'x', 116, 0), k('handR', 'y', 116, 0),
    // the wave: rotation around the shoulder, decaying
    k('armR', 'r', 0, 0), k('armR', 'r', 16, 0), k('armR', 'r', 27, -14), k('armR', 'r', 39, 12), k('armR', 'r', 51, -14),
    k('armR', 'r', 63, 9), k('armR', 'r', 74, -6), k('armR', 'r', 84, 0), k('armR', 'r', 120, 0),
    // body leans toward the hand a beat later, then home
    k('act', 'r', 0, 0), k('act', 'r', 4, 0), k('act', 'r', 18, 2), k('act', 'r', 90, 2), k('act', 'r', 116, 0));
  await call('set_property_values', { propertyValues: { [wave]: { 57: 120 } } });
  await ae('modifyKeyFrames', { animationId: wave, add });
  await ae('modifyKeyFrames', { animationId: loop, add: [...neutral(0), ...neutral(60)] });
  console.log('wave rebuilt:', add.length, 'keys; loop reset');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
