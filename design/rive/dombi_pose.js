// Pose -> Rive property values for every rig part (full pose, so nothing leaks between states).
// Keys: x 13, y 14, rotation 15, scaleX 16, scaleY 17, opacity 18 (percent units); rect path width 20, height 21, radius 31.
const { pose } = require('../icons/dombi_rig');
const K = { x: 13, y: 14, r: 15, sx: 16, sy: 17, op: 18, w: 20, h: 21, rad: 31 };

// Which layer owns which parts (each property has exactly one owner).
function faceValues(ids, P) {
  const v = {};
  const shape = (s, p, oy) => {   // s = {id, pathId}; oy = parent origin y in the 200 space
    v[s.id] = { [K.x]: p.cx - 100, [K.y]: p.cy - oy, [K.r]: p.rot || 0, [K.op]: (p.op ?? 1) * 100 };
    v[s.pathId] = { [K.w]: p.w, [K.h]: p.h, [K.rad]: p.r };
  };
  const [eL, eR, lL, lR] = ids.eyeShapes;
  shape(eL, P.eyeL, 95); shape(eR, P.eyeR, 95); shape(lL, P.lidL, 95); shape(lR, P.lidR, 95);
  const [m, tR, tL, mO] = ids.mouthShapes;
  shape(m, P.mouth, 104); shape(tR, P.tickR, 104); shape(tL, P.tickL, 104); shape(mO, P.mouthO, 104);
  v[ids.face] = { [K.x]: P.face.dx, [K.y]: -66 + P.face.dy, [K.r]: P.face.rot };
  for (const z of ['z1', 'z2']) v[ids[z]] = { [K.sx]: P[z].s * 100, [K.sy]: P[z].s * 100, [K.op]: P[z].op * 100 };
  return v;
}
function handValues(ids, P) {
  const v = {};
  for (const h of ['handL', 'handR']) v[ids[h]] = { [K.x]: P[h].cx - 100, [K.y]: P[h].cy - 170, [K.sx]: P[h].s * 100, [K.sy]: P[h].s * 100 };
  return v;
}
function bodyValues(ids, P) {
  // artboard 260x230 since 2026-10-10: root at (130,200)
  return { [ids.root]: { [K.y]: 200 + P.root.dy, [K.r]: 0 }, [ids.squash]: { [K.sx]: P.root.sx * 100, [K.sy]: P.root.sy * 100 } };
}
const allValues = (ids, name) => { const P = pose(name); return { ...faceValues(ids, P), ...handValues(ids, P), ...bodyValues(ids, P) }; };
module.exports = { K, pose, faceValues, handValues, bodyValues, allValues };
