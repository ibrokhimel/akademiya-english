// Does the browser's real speech recogniser hear a lesson line? Real Chrome is given one of the lesson's own clips as its microphone.
//   node hear-real.js [headed]     (opens Chrome; needs the lab's server and an internet connection: Chrome sends the sound to its own service)
const path = require('path');
const { chromium } = require('playwright');
const CLIPS = [['aziz/a-coffee-please', 'A coffee, please.'], ['malika/can-i-have-a-sandwich', 'Can I have a sandwich?'], ['waiter/its-ten-thousand-som', "It's ten thousand som."], ['aziz/im-aziz', "I'm Aziz."]];
(async () => {
  for (const [file, text] of CLIPS) {
    const wav = path.join(__dirname, '..', '..', 'content', 'audio', 'uk', file + '.slow.wav');
    const b = await chromium.launch({ channel: 'chrome', headless: process.argv[2] !== 'headed', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`] });
    const p = await b.newPage(); await p.goto('http://127.0.0.1:8791/src/web/checks/blank.html');
    const got = await p.evaluate(async (text) => { const { listen, canHear } = await import('/src/web/hear.js'), { judge } = await import('/src/core/text.js'); if (!canHear()) return 'this browser has no recogniser';
      const rec = listen(); setTimeout(() => rec.stop(), 6000); const alts = await rec.done; return alts === null ? 'the recogniser cannot be used here' : JSON.stringify(alts.slice(0, 3)) + ' -> ' + (alts.some((a) => judge(text, a, ['Aziz', 'som']).right) ? 'right' : 'not right'); }, text).catch((e) => 'error: ' + e.message.slice(0, 120));
    console.log(text.padEnd(26), got); await b.close();
  }
})().catch((e) => { console.log('FAIL', e.message.slice(0, 300)); process.exit(1); });
