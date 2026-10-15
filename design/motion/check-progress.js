// node check-progress.js [dark]  -> captures/prg-*.png
require('./check-lib')('progress.html', 'prg', [
  ['shot', '#dStreak', 'streak-0'], ['act', '#dStreak', 'done'], ['wait', 420], ['shot', '#dStreak', 'streak-1-embers'], ['wait', 900], ['shot', '#dStreak', 'streak-2-done'],
  ['act', '#dStreak', 'freeze'], ['wait', 680], ['shot', '#dStreak', 'streak-3-frost'], ['wait', 900], ['shot', '#dStreak', 'streak-4-frozen'],
  ['act', '#dStreak', 'cal'], ['wait', 330], ['shot', '#dStreak', 'cal-1-drawing'], ['wait', 1100], ['shot', '#dStreak', 'cal-2-open'],
  ['act', '#dNumbers', 'open'], ['wait', 260], ['shot', '#dNumbers', 'num-1-rolling'], ['wait', 1200], ['shot', '#dNumbers', 'num-2-done'], ['act', '#dNumbers', 'more'], ['wait', 900], ['shot', '#dNumbers', 'num-3-more'],
  ['act', '#dPhrases', 'new'], ['wait', 450], ['shot', '#dPhrases', 'phr-1-new'], ['click', '#plist .pcard:nth-of-type(2) .pchip.a'], ['wait', 300], ['click', '#plist .pcard:nth-of-type(2) .pchip.m'], ['wait', 150], ['shot', '#dPhrases', 'phr-2-play-star'],
  ['shot', '#dFriend', 'fr-0-add'], ['press', '#fbtn'], ['wait', 160], ['shot', '#dFriend', 'fr-1-morph'], ['wait', 400], ['shot', '#dFriend', 'fr-2-sent'],
  ['act', '#dFriend', 'incoming'], ['wait', 500], ['shot', '#dFriend', 'fr-3-accept'], ['press', '#fbtn'], ['wait', 420], ['shot', '#dFriend', 'fr-4-friends'],
]).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
