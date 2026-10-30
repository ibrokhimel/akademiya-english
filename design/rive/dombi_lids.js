// Lids that never fade (2026-10-30): the original 13 faces and face/listen hid a lid by opacity 0, so every face switch faded a
// lid in or out over a white eye, a grey box for 150 ms. This parks unused lids above the eye at full opacity instead
// (y -32, op 100), so the switch slides them. The 10 newer faces are built that way by dombi_faces.js.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const [, , lL, lR] = ids.eyeShapes;
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
(async () => {
  const names = Object.keys(mids.anims).filter((n) => /^face\//.test(n));
  let changed = 0;
  for (const n of names) {
    const id = mids.anims[n], q = await ae('queryKeyFrames', { animationIds: [id] }), ks = q.keyframes[id] || [];
    const change = [];
    for (const lid of [lL.id, lR.id]) {
      const op = ks.filter((k) => k.objectId === lid && k.propertyKey === 18), y = ks.filter((k) => k.objectId === lid && k.propertyKey === 14);
      if (op.length && op.every((k) => k.value === 0)) { op.forEach((k) => change.push({ keyframeId: k.keyframeId, value: 100 })); y.forEach((k) => change.push({ keyframeId: k.keyframeId, value: -32 })); }
    }
    if (change.length) { await ae('modifyKeyFrames', { animationId: id, change }); changed++; console.log(n, change.length, 'keys'); }
  }
  console.log('faces with parked lids:', changed, 'of', names.length);
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
