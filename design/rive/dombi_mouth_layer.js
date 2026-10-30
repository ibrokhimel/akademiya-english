// Dombi in sync (docs/superpowers/specs/2026-10-30-dombi-in-sync-design.md §4.3): the Mouth layer becomes the LAST layer,
// so while he talks his lip-sync mouth wins over every move and face that keys the mouth (a move used to freeze it).
// mouth/off keys nothing, so when he is quiet faces and moves still show their own mouths.
// The editor cannot reorder layers, so the layer is built again at the end with the same states, conditions and pacing
// (dombi_talk.js + dombi_mouth2.js), then the old one is deleted. Safe to run again: it stops if Mouth is already last.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
const VISEMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  let sm = await ae('queryStateMachine', {});
  const at = sm.layers.findIndex((l) => l.layerName === 'Mouth');
  if (at === sm.layers.length - 1) { console.log('Mouth is already the last layer'); return; }
  const old = sm.layers[at].layerId;

  const st = (n, x, y) => ({ name: n, x, y, linearAnimationName: n });
  await ae('createStateMachineLayers', { stateMachineId: sm.stateMachineId, layers: [{ name: 'Mouth',
    states: [st('mouth/off', 200, 0), ...VISEMES.map((v, i) => st(`mouth/v${v}`, 420 + (i % 4) * 170, Math.floor(i / 4) * 90 - 90))],
    otherTransitions: [{ from: '{Entry State}', to: 'mouth/off' }, { from: '{Any State}', to: 'mouth/off' },
      ...VISEMES.map((v) => ({ from: '{Any State}', to: `mouth/v${v}` }))] }] });
  await call('delete_objects', { objectIds: [old] });

  sm = await ae('queryStateMachine', {});
  const Lm = sm.layers[sm.layers.length - 1];
  if (Lm.layerName !== 'Mouth' || sm.layers.filter((l) => l.layerName === 'Mouth').length !== 1) throw new Error('layers now: ' + sm.layers.map((l) => l.layerName).join(', '));
  const vm = (await call('viewmodel_editor', { command: 'listViewModels', data: { listViewModels: {} } })).viewModels.find((v) => v.name === 'Dombi');
  const prop = (n) => vm.viewModelProperties.find((p) => p.name === n).id;
  const is = (n, value) => ({ leftComparator: { viewModelPropertyId: prop(n) }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value } });
  const name = {}; for (const s of Lm.states) name[s.id] = s.name || s.type;
  const pv = {}, conds = [];
  for (const t of Lm.transitions) {
    if (t.fromStateId !== Lm.anyStateId || (t.conditions || []).length) continue;
    const to = name[t.toStateId];
    // pacing as before: back to the mood 120 ms, into closed lips (MBP, FV) 50 ms, other shapes 75 ms
    pv[t.id] = { 152: 32, 349: 2, 158: to === 'mouth/off' ? 120 : to === 'mouth/v1' || to === 'mouth/v2' ? 50 : 75 };
    conds.push({ id: t.id, conditions: to === 'mouth/off' ? [is('talking', false)] : [is('talking', true), is('viseme', +to.slice(7))] });
  }
  await call('set_property_values', { propertyValues: pv });
  if (conds.length) await ae('createConditions', { transitions: conds });
  console.log('Mouth layer rebuilt last:', sm.layers.map((l) => l.layerName).join(' > '), '·', conds.length, 'conditioned transitions');
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 3).join(' | ')); process.exit(1); });
