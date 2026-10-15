// node check-profile.js [dark]  -> captures/pf-*.png
const S = '.phonewrap', act = (a) => ['click', `.side [data-a="${a}"]`];
require('./check-lib')('profile.html', 'pf', [
  act('open'), ['wait', 200], ['shot', S, '1-opening'], ['wait', 1200], ['shot', S, '2-open'],
  ['press', '#addf'], ['wait', 600], ['shot', S, '3-friend-sent'],
  ['eval', () => { document.querySelector('#scroll').scrollTop = 330; return 'scrolled'; }], ['wait', 420], ['shot', S, '4-scrolled-counting'], ['wait', 900],
  ['eval', () => { document.querySelector('#scroll').scrollTop = 760; return 'scrolled'; }], ['wait', 900], ['shot', S, '5-records-awards'],
  act('award'), ['wait', 1000], ['shot', S, '6-new-award'], ['wait', 900], ['shot', S, '7-award-done'],
], { width: 1240, height: 760 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
