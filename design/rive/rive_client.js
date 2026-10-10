// Tiny client for the local Rive editor MCP (http://127.0.0.1:9791/mcp). Session id cached next to this file.
const fs = require('fs');
const path = require('path');
const URL = 'http://127.0.0.1:9791/mcp';
const SESSION_FILE = path.join(__dirname, '.rive-session.txt');
let sid = fs.existsSync(SESSION_FILE) ? fs.readFileSync(SESSION_FILE, 'utf8').trim() : '';

async function rpc(body) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (sid) headers['mcp-session-id'] = sid;
  const res = await fetch(URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const s = res.headers.get('mcp-session-id'); if (s) sid = s;
  const text = await res.text();
  if (!text.trim()) return { status: res.status };
  const t = text.trim().startsWith('{') ? text : text.split('\n').filter(l => l.startsWith('data:')).pop().slice(5);
  return { status: res.status, json: JSON.parse(t) };
}
async function init() {
  const r = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'dombi-engine', version: '1' } } });
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
  fs.writeFileSync(SESSION_FILE, sid);
  return r;
}
async function call(name, args = {}) {
  let r = await rpc({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } });
  if (r.status === 404 || r.status === 400 || !r.json) { sid = ''; await init(); r = await rpc({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } }); }
  const j = r.json;
  if (j.error) throw new Error(`${name}: ${JSON.stringify(j.error)}`);
  const content = j.result.content || [];
  const txt = content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  if (j.result.isError) throw new Error(`${name}: ${txt}`);
  const img = content.find(c => c.type === 'image');
  if (img) return { image: img.data, text: txt };
  try { return JSON.parse(txt); } catch { return txt; }
}
module.exports = { call };
