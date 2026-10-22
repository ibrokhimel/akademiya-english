const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../../.expo/visual-parity', process.argv[2] || 'before', 'android');
fs.mkdirSync(output, { recursive: true });
http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/layout') { res.writeHead(404).end(); return; }
  let body = '';
  req.on('data', data => { body += data; if (body.length > 2000000) req.destroy(); });
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      if (!/^[a-zA-Z0-9-]+$/.test(payload.id)) throw new Error('Invalid case');
      fs.writeFileSync(path.join(output, payload.id + (payload.dark ? '-dark' : '-light') + '.layout.json'), JSON.stringify(payload, null, 2));
      res.writeHead(200).end('ok');
    } catch { res.writeHead(400).end(); }
  });
}).listen(8792, '127.0.0.1', () => console.log('Audit layout receiver: 8792 -> ' + output));
