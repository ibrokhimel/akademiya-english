// node check-screens.js [dark]  -> captures/scr-*.png
const S = '.phonewrap', pick = (n) => ['click', `#side [data-s="${n}"]`];
require('./check-lib')('screens.html', 'scr', [
  pick('goal'), ['wait', 450], ['shot', S, 'goal-1-arriving'], ['wait', 1400], ['shot', S, 'goal-2-ready'], ['press', '.gopt:nth-child(3)'], ['wait', 160], ['shot', S, 'goal-3-picked'], ['wait', 700], ['shot', S, 'goal-4-done'],
  pick('cansay'), ['wait', 420], ['shot', S, 'cansay-1-pop'], ['wait', 900], ['shot', S, 'cansay-2'], ['wait', 1500], ['shot', S, 'cansay-3-settled'],
  pick('result'), ['wait', 600], ['shot', S, 'result-1-count'], ['wait', 650], ['shot', S, 'result-2-cheer'], ['wait', 1500], ['shot', S, 'result-3-done'],
  pick('perfect'), ['wait', 1000], ['shot', S, 'perfect-1-slam'], ['wait', 330], ['shot', S, 'perfect-2-rings'], ['wait', 700], ['shot', S, 'perfect-3-confetti'], ['wait', 2200], ['shot', S, 'perfect-4-settled'],
  pick('trophy'), ['wait', 330], ['shot', S, 'trophy-1-falling'], ['wait', 220], ['shot', S, 'trophy-2-landed'], ['wait', 700], ['shot', S, 'trophy-3-text'], ['wait', 1300], ['shot', S, 'trophy-4-done'],
  pick('level'), ['wait', 450], ['shot', S, 'level-1-badge'], ['wait', 420], ['shot', S, 'level-2-flip'], ['wait', 600], ['shot', S, 'level-3-list'], ['wait', 1500], ['shot', S, 'level-4-done'],
], { width: 1240, height: 760 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
