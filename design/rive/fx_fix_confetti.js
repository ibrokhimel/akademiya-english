// one-off: give FX Confetti an idle default state and wire the triggers (keys are already baked)
const { call } = require('./rive_client');
const fx = require('./fx_ids.json');
const ae = (command, payload) => call('animation_editor', { command, data: { [command]: payload } });
(async () => {
  await call('open_file_editor', { command: 'focusArtboard', data: { focusArtboard: { artboardId: fx.confetti.ab } } });
  const la = await ae('listLinearAnimations', {}); console.log('timelines:', la.linearAnimations.map(a => a.name).join(', '));
  const sm = await ae('queryStateMachine', {}); const L = sm.layers[0]; const nm = {}; for (const s of L.states) nm[s.id] = s.name || s.type;
  console.log('states:', L.states.map(s => s.name || s.type).join(', ')); console.log('transitions:', L.transitions.map(t => nm[t.fromStateId] + '>' + nm[t.toStateId]).join('  '));
})();
