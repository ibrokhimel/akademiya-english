// node check-controls.js [dark]  -> captures/ctl-*.png
require('./check-lib')('controls.html', 'ctl', [
  ['click', '#dToggle .setrow:nth-child(2) .toggle'], ['wait', 90], ['shot', '#dToggle', 'toggle-mid'], ['wait', 300], ['shot', '#dToggle', 'toggle-on'],
  ['act', '#dField', 'right'], ['wait', 900], ['shot', '#dField', 'field-typed'], ['press', '#dField .check'], ['wait', 150], ['shot', '#dField', 'field-right'],
  ['act', '#dField', 'wrong'], ['wait', 900], ['press', '#dField .check'], ['wait', 120], ['shot', '#dField', 'field-wrong'],
  ['click', '#seg button:nth-of-type(3)'], ['wait', 90], ['shot', '#dSeg', 'seg-mid'], ['wait', 300], ['shot', '#dSeg', 'seg-done'],
  ['press', '#rating .rate:nth-child(4)'], ['wait', 350], ['shot', '#dForm', 'form-rated'], ['press', '#form .check'], ['wait', 260], ['shot', '#dForm', 'form-leaving'], ['wait', 500], ['shot', '#dForm', 'form-thanks'],
  ['shot', '#dWheel', 'wheel-0'], ['click', '#wheel .opt.on + .opt + .opt'], ['wait', 110], ['shot', '#dWheel', 'wheel-mid'], ['wait', 350], ['shot', '#dWheel', 'wheel-done'],
  ['act', '#dQuit', 'open'], ['wait', 150], ['shot', '#dQuit', 'quit-rising'], ['wait', 500], ['shot', '#dQuit', 'quit-open'], ['act', '#dQuit', 'close'], ['wait', 300],
  ['act', '#dDialog', 'open'], ['wait', 400], ['shot', '#dDialog', 'dialog-open'], ['press', '#dialog .danger'], ['wait', 330], ['shot', '#dDialog', 'dialog-collapsing'], ['wait', 700], ['shot', '#dDialog', 'dialog-done'],
  ['shot', '#dLoad', 'load-skeleton'], ['act', '#dLoad', 'load'], ['wait', 500], ['shot', '#dLoad', 'load-content'],
  ['act', '#dOffline', 'offline'], ['wait', 500], ['press', '#problem .btn'], ['wait', 500], ['shot', '#dOffline', 'offline-trying'], ['wait', 800], ['shot', '#dOffline', 'offline-failed'],
]).catch((e) => { console.log('FAIL', e.message); process.exit(1); });
