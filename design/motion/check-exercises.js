// node check-exercises.js [dark]  -> captures/ex-*.png
const S = '.phonewrap', ex = (n) => ['click', `#side [data-e="${n}"]`], say = (k) => ['click', `#side [data-s="${k}"]`];
require('./check-lib')('exercises.html', 'ex', [
  ['wait', 600], ['shot', S, 'e1-1-playing'], ['wait', 1700], ['shot', S, 'e1-2-your-turn'],
  ['click', '.textlink'], ['wait', 700], ['shot', S, 'e1-3-text-in-time'], ['wait', 1300],
  say('right'), ['wait', 900], ['shot', S, 'e1-4-listening'], ['wait', 1900], ['shot', S, 'e1-5-words'], ['wait', 1300], ['shot', S, 'e1-6-correct'],
  ex('e2'), ['wait', 600], ['shot', S, 'e2-1-arriving'], ['wait', 1300], ['shot', S, 'e2-2-hint'], say('silent'), ['wait', 2000], ['shot', S, 'e2-3-nothing-heard'],
  say('off'), ['wait', 3400], ['shot', S, 'e2-4-one-off'], ['wait', 900], ['shot', S, 'e2-5-answer'],
  ex('e9'), ['wait', 1050], ['shot', S, 'e9-1-waiter-talks'], ['wait', 400], ['shot', S, 'e9-2-second-word'], ['wait', 900], ['shot', S, 'e9-3-your-turn'],
  say('right'), ['wait', 3300], ['shot', S, 'e9-4-waiter-happy'], ['wait', 900], ['shot', S, 'e9-5-correct'],
], { width: 1240, height: 760 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
