// node check-onboarding.js [dark]  -> captures/ob-*.png   (walks the whole flow with the buttons inside the phone)
const S = '.phonewrap', next = (sel = '#obstage .obscr:last-child .obbot .btn') => ['press', sel];
require('./check-lib')('onboarding.html', 'ob', [
  ['wait', 700], ['shot', S, '01-welcome'], next('#obstage .obscr:last-child .btn.primary'), ['wait', 330], ['shot', S, '02-to-meet-moving'], ['wait', 900], ['shot', S, '03-meet-talking'],
  ['wait', 900], next(), ['wait', 900], ['shot', S, '04-goal'], ['press', '#obstage .obscr:last-child .gopt:nth-child(3)'], ['wait', 500], ['shot', S, '05-goal-picked'],
  next(), ['wait', 900], ['shot', S, '06-level'], ['press', '#obstage .obscr:last-child .gopt:nth-child(1)'], ['wait', 400], next(), ['wait', 1300], ['shot', S, '07-achieve-dropping'], ['wait', 900],
  next(), ['wait', 900], ['press', '#obstage .obscr:last-child .gopt:nth-child(4)'], ['wait', 500], ['shot', S, '08-confidence'],
  next(), ['wait', 1300], ['shot', S, '09-mic'], next('#micOn'), ['wait', 1300], ['shot', S, '10-listen'], ['click', '#sayHello'], ['wait', 600], ['shot', S, '11-listening-voice'],
  ['wait', 1500], ['shot', S, '12-heard'], next(), ['wait', 1500], ['shot', S, '13-promise'], next('#obstage .obscr:last-child .btn.primary'), ['wait', 900], ['shot', S, '14-reminder'],
  ['click', '#obstage .obscr:last-child .wheel .opt.on + .opt'], ['wait', 450], ['shot', S, '15-reminder-picked'], next('#remOn'), ['wait', 2600], ['shot', S, '16-name'],
  ['click', '#obback'], ['wait', 330], ['shot', S, '17-back-moving'],
], { width: 1240, height: 760 }).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
