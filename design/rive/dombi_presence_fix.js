// Presence fix: no opacity fade (a see-through body reveals the hands tucked behind it). Enter/exit now scale from/to
// zero at the feet; opacity only switches while he is at zero size.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const K = { y: 14, sx: 16, sy: 17, op: 18 };
const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 }, OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 }, IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const S = ids.stage;
const trk = (p, list) => list.map(([f, v, c]) => c === 'hold' ? { objectId: S, propertyKey: p, frame: f, value: v, interpolationType: 'hold' }
  : { objectId: S, propertyKey: p, frame: f, value: v, interpolationType: 'cubic', cubicParams: c || SINE });
const PLAN = {
  'present/hidden': [...trk(K.op, [[0, 0, 'hold']]), ...trk(K.sx, [[0, 0, 'hold']]), ...trk(K.sy, [[0, 0, 'hold']]), ...trk(K.y, [[0, 200, 'hold']])],
  'present/enter': [...trk(K.op, [[0, 100, 'hold'], [30, 100, 'hold']]), ...trk(K.y, [[0, 200, OUT], [12, 194], [18, 200], [30, 200]]),
    ...trk(K.sy, [[0, 0, OUT], [12, 110], [18, 94], [24, 102], [30, 100]]), ...trk(K.sx, [[0, 0, OUT], [12, 93], [18, 106], [24, 99], [30, 100]])],
  'present/exit': [...trk(K.op, [[0, 100, 'hold'], [17, 0, 'hold']]), ...trk(K.y, [[0, 200], [18, 200]]),
    ...trk(K.sy, [[0, 100], [5, 90, IN], [16, 0], [18, 0]]), ...trk(K.sx, [[0, 100], [5, 110, IN], [16, 0], [18, 0]])],
};
(async () => {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const idsA = Object.keys(PLAN).map(n => mids.anims[n]);
  const q = await ae('queryKeyFrames', { animationIds: idsA });
  for (const [n, add] of Object.entries(PLAN)) { const id = mids.anims[n];
    const old = (q.keyframes[id] || []).map(x => x.keyframeId); if (old.length) await ae('modifyKeyFrames', { animationId: id, delete: old });
    await ae('modifyKeyFrames', { animationId: id, add }); }
  await call('set_property_values', { propertyValues: { [S]: { 13: 130, 14: 200, 16: 100, 17: 100, 18: 100 } } });
  console.log('presence re-keyed');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
