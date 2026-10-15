// node check-states.js [dark]  -> captures/st-*.png
const S = '.phonewrap', pick = (n) => ['click', `#side [data-s="${n}"]`];
require('./check-lib')('states.html', 'st', [
  pick('grew'), ['wait', 1050], ['shot', S, 'grew-1-arrow'], ['wait', 500], ['shot', S, 'grew-2-rolling'], ['wait', 1300], ['shot', S, 'grew-3-done'],
  pick('blocked'), ['wait', 480], ['shot', S, 'blocked-1-rising'], ['wait', 600], ['shot', S, 'blocked-2-steps'], ['wait', 900], ['shot', S, 'blocked-3-done'],
  pick('error'), ['wait', 1200], ['shot', S, 'error-1'], ['press', '#screen .btn.primary'], ['wait', 600], ['shot', S, 'error-2-trying'], ['wait', 1100], ['shot', S, 'error-3-worked'],
  pick('fallback'), ['wait', 1300], ['shot', S, 'fallback-1'], ['wait', 1900], ['shot', S, 'fallback-2-swayed'],
], { width: 1240, height: 760 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
