// node check-nav.js [dark]  -> captures/nav-*.png   (the Learn page, locked Path H)
const S = '.phonewrap', act = (a) => ['click', `.side [data-a="${a}"]`];
require('./check-lib')('nav.html', 'nav', [
  ['shot', S, '0-start'], ['press', '#path .node.cur'], ['wait', 450], ['shot', S, '1-sheet'], ['eval', () => { document.querySelector('#backdrop').click(); return 'closed'; }], ['wait', 400],
  ['click', '#tabs .tab:nth-child(2)'], ['wait', 110], ['shot', S, '2-tab-hop'], ['wait', 300], ['click', '#tabs .tab:nth-child(1)'], ['wait', 300],
  act('today'), ['wait', 200], act('finish'), ['wait', 130], ['shot', S, '3-finish-pop'], ['wait', 330], ['shot', S, '4-fly'], ['wait', 380], ['shot', S, '5-unlock'], ['wait', 900], ['shot', S, '6-done'],
  act('finish'), ['wait', 1700], act('finish'), ['wait', 1700], act('finish'), ['wait', 1700], ['shot', S, '7-four-done'], act('finish'), ['wait', 1100], ['shot', S, '8-trophy-ready'],
  ['press', '#path .trophyn'], ['wait', 600], ['shot', S, '9-checkpoint-sheet'],
  ['eval', () => ({ phrases: document.querySelector('#sPh span').textContent, streak: document.querySelector('#sSt span').textContent })],
], { width: 1240, height: 780 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
