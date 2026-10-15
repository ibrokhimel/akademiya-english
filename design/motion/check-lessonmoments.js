// node check-lessonmoments.js [dark]  -> captures/lm-*.png
const S = '.phonewrap', pick = (n) => ['click', `#side [data-s="${n}"]`];
require('./check-lib')('lessonmoments.html', 'lm', [
  pick('mistakes'), ['wait', 420], ['shot', S, 'mist-1-arriving'], ['wait', 1300], ['shot', S, 'mist-2-done'],
  pick('streak'), ['wait', 300], ['shot', S, 'streak-1-pop'], ['wait', 420], ['shot', S, 'streak-2-flame'], ['wait', 330], ['shot', S, 'streak-3-flip'], ['wait', 1300], ['shot', S, 'streak-4-done'],
  pick('cpstart'), ['wait', 430], ['shot', S, 'cp-1-rising'], ['wait', 520], ['shot', S, 'cp-2-steps'], ['wait', 1200], ['shot', S, 'cp-3-done'],
  pick('player'), ['wait', 900], ['shot', S, 'pl-1-waiter-talks'], ['wait', 1100], ['shot', S, 'pl-2-your-turn'],
  ['click', '#side [data-a="speak"]'], ['wait', 2900], ['shot', S, 'pl-3-step-ticks'], ['wait', 1300], ['shot', S, 'pl-4-next-line'], ['wait', 1700], ['shot', S, 'pl-5-your-turn-again'],
], { width: 1240, height: 760 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
