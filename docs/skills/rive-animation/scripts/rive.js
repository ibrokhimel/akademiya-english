// Minimal MCP client for the Rive editor's local server.
// Usage: node rive.js list | node rive.js call <tool> '<json args>' | node rive.js call <tool> @args.json
const fs = require('fs');
const path = require('path');
const URL = 'http://127.0.0.1:9791/mcp';
const SESSION_FILE = path.join(__dirname, 'rive-session.txt');

async function rpc(body, session) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (session) headers['mcp-session-id'] = session;
  const res = await fetch(URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const sid = res.headers.get('mcp-session-id');
  const text = await res.text();
  let json = null;
  if (text.trim().startsWith('{')) json = JSON.parse(text);
  else {
    const lines = text.split('\n').filter(l => l.startsWith('data:'));
    if (lines.length) json = JSON.parse(lines[lines.length - 1].slice(5));
  }
  return { sid, json, status: res.status };
}

async function session() {
  if (fs.existsSync(SESSION_FILE)) return fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'claude-code-direct', version: '1' } } });
  const sid = init.sid || '';
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
  fs.writeFileSync(SESSION_FILE, sid);
  return sid;
}

(async () => {
  const [cmd, tool, argStr] = process.argv.slice(2);
  let sid = await session();
  const send = async (body) => {
    let r = await rpc(body, sid);
    if (r.status === 404 || r.status === 400) { fs.rmSync(SESSION_FILE, { force: true }); sid = await session(); r = await rpc(body, sid); }
    return r.json;
  };
  if (cmd === 'list') {
    const r = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    for (const t of r.result.tools) console.log(`- ${t.name}: ${(t.description || '').split('\n')[0].slice(0, 160)}`);
  } else if (cmd === 'schema') {
    const r = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const t = r.result.tools.find(t => t.name === tool);
    console.log(JSON.stringify(t, null, 1));
  } else if (cmd === 'call') {
    const args = argStr ? (argStr.startsWith('@') ? JSON.parse(fs.readFileSync(argStr.slice(1), 'utf8')) : JSON.parse(argStr)) : {};
    const r = await send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: tool, arguments: args } });
    if (r.error) { console.log('ERROR', JSON.stringify(r.error)); return; }
    for (const c of r.result.content || []) {
      if (c.type === 'text') console.log(c.text.slice(0, process.env.FULL ? 1e9 : 4000));
      else if (c.type === 'image') { const f = path.join(__dirname, `rive-${Date.now()}.png`); fs.writeFileSync(f, Buffer.from(c.data, 'base64')); console.log('IMAGE', f); }
    }
    if (r.result.isError) console.log('(isError)');
  }
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
