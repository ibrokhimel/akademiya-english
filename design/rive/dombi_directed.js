// Dombi rig, 2026-10-30: the speak lab's living picker takes over his idle breaks (spec 2026-10-30-dombi-action-engine §4.3).
//   VM boolean `directed`: while true, the Idle layer's rest states no longer roll their own random break (the rest -> break
//   transitions need directed == false); breathing, sway, blinks and gaze keep running in their own layers.
//   VM triggers lookAround / weightShift / idleHop / leanBack / nod: Any -> that break, which then returns to a rest state
//   through its existing exits.
const { call } = require('./rive_client');
const ids = require('./dombi_ids.json');
const { ae, wire } = require('./dombi_redo');
const vme = (command, payload) => call('viewmodel_editor', { command, data: { [command]: payload } });
const BREAKS = { lookAround: 'idle/look-around', weightShift: 'idle/weight-shift', idleHop: 'idle/hop', leanBack: 'idle/lean-back', nod: 'idle/nod' };

async function main() {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: ids.artboard } } });
  let vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi');
  const want = [['directed', 'boolean'], ...Object.keys(BREAKS).map((n) => [n, 'trigger'])].filter(([n]) => !vm.viewModelProperties.some((p) => p.name === n));
  if (want.length) { await vme('addProperties', { viewModels: [{ viewModelId: vm.id, viewModelProperties: want.map(([name, propertyType]) => ({ name, propertyType })) }] });
    vm = (await vme('listViewModels', {})).viewModels.find((v) => v.name === 'Dombi'); }
  const directed = vm.viewModelProperties.find((p) => p.name === 'directed').id;

  // rest -> break only while not directed (each rest state's randomized exits keep their weights)
  const sm = await ae('queryStateMachine', {});
  const L = sm.layers.find((l) => l.layerName === 'Idle'), nm = {}; for (const s of L.states) nm[s.id] = s.name || s.type;
  const gated = L.transitions.filter((t) => /^idle\/rest-/.test(nm[t.fromStateId]) && Object.values(BREAKS).includes(nm[t.toStateId]));
  const add = gated.filter((t) => !(t.conditions || []).some((c) => (c.leftComparator || {}).viewModelPropertyName === 'directed'))
    .map((t) => ({ id: t.id, conditions: [{ leftComparator: { viewModelPropertyId: directed }, comparationOperation: 'equal', rightComparator: { valueType: 'constantValueType', value: false } }] }));
  if (add.length) await ae('createConditions', { transitions: add });
  console.log('gated', gated.length, 'rest -> break transitions,', add.length, 'new conditions');

  for (const [trigger, state] of Object.entries(BREAKS)) await wire('Idle', state, trigger, 'idle/rest-8s');
}
main().catch((e) => { console.log('FAIL', String(e.stack).split('\n').slice(0, 4).join(' | ')); process.exit(1); });
