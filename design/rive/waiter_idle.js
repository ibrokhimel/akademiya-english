// Café waiters, stage 2: the "alive" idle. Run after waiter_rig.js:  node waiter_idle.js a|c
//   Body layer : 3.6 s breath (owns torso sx/sy, head y, tie y, hairBack y, cap y)
//   Eyes layer : random-length open holds, then a blink or a double blink (owns eyes-group sx/sy)
// All timings at 60 fps. Numbers from the rive-animation skill: breath inhale 40 % / exhale 60 %,
// blink close 67 ms / hold 33 / open 117, random 2.8-5.6 s apart, about 1 in 6 doubles.
const { all, save, call, K, PIV } = require('./waiter_rig');

const SINE = { x1: 0.37, y1: 0, x2: 0.63, y2: 1 };
const EASE_IN = { x1: 0.4, y1: 0, x2: 1, y2: 1 };
const EASE_OUT = { x1: 0, y1: 0, x2: 0.2, y2: 1 };
const F = { enableExitTime: 4, exitTimeIsPercentage: 8 };
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const key = (objectId, propertyKey, frame, value, cubic) =>
  ({ objectId, propertyKey, frame, value, interpolationType: cubic ? 'cubic' : 'hold', ...(cubic ? { cubicParams: cubic } : {}) });

async function main(k) {
  const ids = all[k];
  ids.anims = ids.anims || {};
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });

  async function anim(name, frames, loop, add) {
    let a = ids.anims[name];
    if (!a) {
      const r = await ae('createLinearAnimations', { linearAnimations: [{ name, duration: frames / 60 }] });
      a = ids.anims[name] = (r.linearAnimations || r.animations || r.created)[0].id;
    }
    await call('set_property_values', { propertyValues: { [a]: { 56: 60, 57: frames, 59: loop ? 1 : 0 } } });
    await ae('modifyKeyFrames', { animationId: a, add });
  }

  const la = await ae('listLinearAnimations', {});
  const t1 = la.linearAnimations.find(a => /^Timeline/.test(a.name));
  if (t1) { await ae('renameAnimations', { animations: [{ animationId: t1.id, name: 'body/breathe' }] }); ids.anims['body/breathe'] = t1.id; }

  // ---- breath: shoulders swell from the bottom edge, the head rides up a few frames late ----
  const headY = PIV.head[1] - PIV.root[1];
  const ride = (id, base, lift, lag) => [key(id, K.y, 0, base, SINE), key(id, K.y, lag, base, SINE), key(id, K.y, 86 + lag, base - lift, SINE), key(id, K.y, 216, base, SINE)];
  const add = [
    key(ids.torso, K.sx, 0, 100, SINE), key(ids.torso, K.sy, 0, 100, SINE),
    key(ids.torso, K.sx, 86, 99.2, SINE), key(ids.torso, K.sy, 86, 102, SINE),
    key(ids.torso, K.sx, 216, 100, SINE), key(ids.torso, K.sy, 216, 100, SINE),
    ...ride(ids.head, headY, 2.2, 6)];
  if (ids.tie) add.push(...ride(ids.tie, PIV.tie[1] - PIV.root[1], 1.1, 3));
  if (ids.hairBack) add.push(...ride(ids.hairBack, PIV.hairBack[1] - PIV.head[1], 0.7, 12));
  if (ids.cap) add.push(...ride(ids.cap, PIV.cap[1] - PIV.head[1], 0.6, 12));
  await anim('body/breathe', 216, true, add);

  // ---- eyes ----
  const OPEN = [['eyes/open-2.8s', 168], ['eyes/open-4.2s', 252], ['eyes/open-5.6s', 336]];
  for (const [n, f] of OPEN) await anim(n, f, false, [key(ids.eyes, K.sy, 0, 100), key(ids.eyes, K.sx, 0, 100)]);
  const blink = (o) => [
    key(ids.eyes, K.sy, o, 100, EASE_IN), key(ids.eyes, K.sy, o + 4, 12), key(ids.eyes, K.sy, o + 6, 12, EASE_OUT), key(ids.eyes, K.sy, o + 13, 100),
    key(ids.eyes, K.sx, o, 100, EASE_IN), key(ids.eyes, K.sx, o + 4, 108), key(ids.eyes, K.sx, o + 6, 108, EASE_OUT), key(ids.eyes, K.sx, o + 13, 100)];
  await anim('eyes/blink', 14, false, blink(0));
  await anim('eyes/double', 31, false, [...blink(0), ...blink(17)]);
  save();

  // ---- state machine ----
  let sm = await ae('queryStateMachine', {});
  await call('rename_objects', { renames: [{ id: sm.layers[0].layerId, name: 'Body' }, { id: sm.stateMachineId, name: 'Waiter' }] }).catch(() => {});
  if (!sm.layers.some(l => l.layerName === 'Eyes')) {
    const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
    const opens = OPEN.map(o => o[0]), blinks = ['eyes/blink', 'eyes/double'];
    await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [
      { name: 'Eyes', states: [...opens.map((n, i) => st(n, 200, i * 120 - 120)), st('eyes/blink', 480, -60), st('eyes/double', 480, 60)],
        otherTransitions: [{ from: '{Entry State}', to: 'eyes/open-2.8s' },
          ...opens.flatMap(o => blinks.map(b => ({ from: o, to: b }))), ...blinks.flatMap(b => opens.map(o => ({ from: b, to: o })))] }] });
    sm = await ae('queryStateMachine', {});
  }
  const pv = {};
  const eyes = sm.layers.find(l => l.layerName === 'Eyes');
  const name = {}; for (const s of eyes.states) name[s.id] = s.name;
  for (const s of eyes.states) if (s.type === 'animation') pv[s.id] = { 536: 1 };            // Randomize Exit
  for (const t of eyes.transitions) {
    const to = name[t.toStateId]; if (!to || !name[t.fromStateId]) continue;
    pv[t.id] = { 152: F.enableExitTime | F.exitTimeIsPercentage, 160: 100, 158: 0, 537: to === 'eyes/double' ? 1 : to === 'eyes/blink' ? 5 : 1 };
  }
  await call('set_property_values', { propertyValues: pv });
  ids.sm = sm.stateMachineId;
  save();
  console.log(ids.name, 'idle ready. layers:', sm.layers.map(l => l.layerName + '(' + l.states.length + ')').join(', '));
}
main(process.argv[2]).catch(e => { console.log('FAIL', e.message); process.exit(1); });
