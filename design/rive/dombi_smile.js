// Dombi's default face: the off-centre smirk becomes a plain centred smile (owner, 2026-10-15: "use a normal face").
// Wink and proud keep the smirk. Every timeline (except face/wink and face/proud) is searched for frames where the
// mouth holds the old smirk, and those keys are moved to the smile, so moods, reactions and plays all settle on it.
// Run once: node dombi_smile.js   (dry run: node dombi_smile.js --dry)
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const mids = require('./dombi_machine_ids.json');
const { MOUTHS, SMIRK_A } = require('../icons/dombi_rig');
const { shapeOf } = require('../icons/mouth_geo');
const { polar, VK } = require('./dombi_mouth');

const FACE = { x: 100, y: 104 };
const DRY = process.argv.includes('--dry');
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const local = (v) => ({ p: [v.p[0] - FACE.x, v.p[1] - FACE.y], in: [v.in[0] - FACE.x, v.in[1] - FACE.y], out: [v.out[0] - FACE.x, v.out[1] - FACE.y] });

const OLD = { line: SMIRK_A };
const REF = shapeOf(OLD).map(local).map(v => polar(v));
// vertexId -> propertyKey -> value
function valuesOf(m) {
  const out = {};
  shapeOf(m).map(local).forEach((v, i) => { const pv = polar(v, REF[i]); out[ids.mouthShape.verts[i]] = {};
    for (const [k, pk] of Object.entries(VK)) out[ids.mouthShape.verts[i]][pk] = +pv[k].toFixed(3); });
  return out;
}
const ANG = new Set([VK.inRot, VK.outRot]);
const same = (pk, a, b) => { const d = Math.abs(a - b); return ANG.has(pk) ? Math.min(d % 360, 360 - (d % 360)) < 0.5 : d < 0.5; };

async function main() {
  if (MOUTHS.smirk.line === SMIRK_A) throw new Error('dombi_rig.js still has the smirk as the default mouth');
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  const oldV = valuesOf(OLD), newV = valuesOf(MOUTHS.smirk), verts = new Set(ids.mouthShape.verts);
  const skip = new Set([mids.anims['face/wink'], mids.anims['face/proud']]);
  const anims = Object.entries(mids.anims).filter(([, id]) => !skip.has(id));
  const q = await ae('queryKeyFrames', { animationIds: anims.map(([, id]) => id) });
  let changed = 0;
  for (const [name, id] of anims) {
    const keys = (q.keyframes[id] || []).filter(k => verts.has(k.objectId) && oldV[k.objectId][k.propertyKey] !== undefined);
    const byFrame = {}; for (const k of keys) (byFrame[k.frame] = byFrame[k.frame] || []).push(k);
    const del = [], add = [];
    for (const [frame, ks] of Object.entries(byFrame)) {
      if (ks.length !== 18 || !ks.every(k => same(k.propertyKey, k.value, oldV[k.objectId][k.propertyKey]))) continue;
      for (const k of ks) { del.push(k.keyframeId);
        add.push({ objectId: k.objectId, propertyKey: k.propertyKey, frame: +frame, value: newV[k.objectId][k.propertyKey], interpolationType: k.interpolationType }); }
      console.log(`${name}: frame ${frame}`);
    }
    if (!del.length) continue;
    changed++;
    if (DRY) continue;
    await ae('modifyKeyFrames', { animationId: id, delete: del });
    await ae('modifyKeyFrames', { animationId: id, add });
  }
  if (!DRY) {   // design-view (setup) pose = the new default
    const base = {}; for (const [v, props] of Object.entries(newV)) base[v] = props;
    await call('set_property_values', { propertyValues: base });
  }
  console.log(DRY ? 'dry run:' : 'done:', changed, 'timelines', DRY ? 'would change' : 'changed');
}
main().catch(e => { console.log('FAIL', e.message); process.exit(1); });
