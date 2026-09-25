// End-to-end test against the production build: `npm run build && npm test` (needs Chrome, Edge or Chromium).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/gesso.mjs', import.meta.url));
const home = await mkdtemp(path.join(tmpdir(), 'gesso-test-'));
const projectDir = path.join(home, 'my-game', 'art');
const port = await new Promise((resolve) => {
  const probe = createServer().listen(0, '127.0.0.1', () => {
    const { port: free } = probe.address();
    probe.close(() => resolve(free));
  });
});
const env = { ...process.env, GESSO_HOME: home, GESSO_PORT: String(port), GESSO_ALLOW_ANY_PATH: '1', NODE_NO_WARNINGS: '1' };
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [bin], { env, stdio: ['ignore', 'ignore', 'inherit'] });

let nextId = 0;
async function rpc(method, params = {}, query = '') {
  const response = await fetch(`${base}/mcp${query}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++nextId, method, params }) });
  return response.json();
}
const call = async (name, args = {}) => (await rpc('tools/call', { name, arguments: args }, `?project=${encodeURIComponent(projectDir)}`)).result;
const textOf = (result) => result.content.filter((part) => part.type === 'text').map((part) => part.text).join('\n');
const api = async (url, init) => {
  const response = await fetch(`${base}${url}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  assert.ok(response.ok, `${url} -> ${response.status}`);
  return response.json();
};
const svg = (body, attributes = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" data-type="icon" ${attributes}>${body}</svg>`;

try {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await fetch(`${base}/api/health`).then((r) => r.ok, () => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  // security: foreign Host (DNS rebinding) and foreign Origin (CSRF) are rejected
  const rebinding = await new Promise((resolve) => request({ host: '127.0.0.1', port, path: '/api/projects', headers: { host: 'evil.example' } }, (res) => resolve(res.statusCode)).end());
  assert.equal(rebinding, 403);
  assert.equal((await fetch(`${base}/api/projects`, { headers: { origin: 'https://evil.example' } })).status, 403);

  // MCP handshake
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '0' } });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal(init.result.serverInfo.name, 'gesso');
  assert.equal((await fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) })).status, 202);
  assert.equal((await rpc('nope')).error.code, -32601);
  const { tools } = (await rpc('tools/list')).result;
  assert.ok(['get_project', 'save_asset', 'get_feedback', 'resolve_feedback', 'export_assets'].every((name) => tools.some((tool) => tool.name === name)));

  // project is created from the ?project= path
  assert.match(textOf(await call('get_project')), /None yet/);
  const [project] = await api('/api/projects');
  assert.equal(project.path, projectDir);

  assert.ok(textOf(await call('read_guide', { topics: 'workflow' })).includes('Production workflow'));
  await call('write_art_bible', { markdown: 'Palette: #2e1a0d #764a27 #a26c3c #6cbf45' });

  // save + review sheet + palette lint + critique stored
  const good = await call('save_asset', { id: 'orb', svg: svg('<circle id="orb-c" cx="32" cy="32" r="26" fill="#764a27" stroke="#ff00ff"/>'), note: 'first pass', critique: { scores: { readability: 4 }, notes: 'ok' } });
  assert.ok(!good.isError, textOf(good));
  assert.ok(good.content.some((part) => part.type === 'image' && part.mimeType === 'image/jpeg'));
  assert.match(textOf(good), /#ff00ff \(nearest/);

  // broken SMIL timing is an error; malformed XML and path traversal are rejected
  const blink = await call('save_asset', { id: 'blink', svg: svg('<circle id="blink-c" cx="32" cy="32" r="20" fill="#6cbf45"><animate attributeName="r" values="10;20" keyTimes="0;.5" dur="1s" repeatCount="indefinite"/></circle>', 'data-duration="1"') });
  assert.match(textOf(blink), /keyTimes must end at 1/);
  assert.ok((await call('save_asset', { id: 'bad', svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect></svg>' })).isError);
  assert.ok((await call('save_asset', { id: '../escape', svg: svg('') })).isError);

  // a direct file edit (agents with file tools) becomes revision 2
  await writeFile(path.join(projectDir, 'assets', 'orb.svg'), svg('<circle id="orb-c" cx="32" cy="32" r="28" fill="#a26c3c"/>'));
  let detail;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    detail = await api(`/api/projects/${project.id}/assets/orb`);
    if (detail.revisions.length === 2) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.equal(detail.revisions.length, 2);
  assert.equal(detail.revisions[1].critique.notes, 'ok');

  // feedback round trip: studio -> agent -> studio
  await api(`/api/projects/${project.id}/assets/orb/feedback`, { method: 'POST', body: JSON.stringify({ body: 'Make the rim brighter', x: 0.5, y: 0.1 }) });
  const feedback = textOf(await call('get_feedback'));
  assert.match(feedback, /#\d+ on orb .*at \(32, 6\) px: Make the rim brighter/);
  const id = Number(feedback.match(/#(\d+)/)[1]);
  await call('resolve_feedback', { feedback_id: id, reply: 'Brightened the rim' });
  detail = await api(`/api/projects/${project.id}/assets/orb`);
  assert.equal(detail.feedback[0].status, 'resolved');
  assert.equal(detail.status, 'changes');

  // restore makes a new revision with the old content
  await api(`/api/projects/${project.id}/assets/orb/restore`, { method: 'POST', body: JSON.stringify({ revision: 1 }) });
  const restored = await fetch(`${base}/files/${project.id}/assets/orb.svg`).then((r) => r.text());
  assert.match(restored, /stroke="#ff00ff"/);

  // animated export: sprite sheet atlas
  await call('save_asset', { id: 'pulse', svg: svg('<circle id="pulse-c" cx="32" cy="32" r="20" fill="#6cbf45"><animate attributeName="r" values="10;24;10" keyTimes="0;.5;1" dur="1s" repeatCount="indefinite"/></circle>', 'data-duration="1" data-frames="4"') });
  assert.ok(!(await call('export_assets', { ids: ['orb', 'pulse'], scales: [1, 2] })).isError);
  const atlas = JSON.parse(await readFile(path.join(projectDir, 'exports', 'pulse@2x.json'), 'utf8'));
  assert.deepEqual(atlas.meta.size, { w: 256, h: 256 });
  assert.deepEqual(atlas.frames.pulse_3.frame, { x: 128, y: 128, w: 128, h: 128 });

  // HTML assets on the Gesso Kit: CSS materials, silhouettes, and a scripted (defineAsset) frame
  const icons = textOf(await call('search_icons', { query: 'potion' }));
  assert.match(icons, /\/kit\/icons\/game-icons\/[a-z-]*potion[a-z-]*\.svg/);
  const kitCss = await fetch(`${base}/kit/gesso.css`);
  assert.equal(kitCss.status, 200);
  assert.equal(kitCss.headers.get('access-control-allow-origin'), '*');
  const htmlIcon = `<!doctype html><html data-type="icon" data-width="128" data-height="128"><head><link rel="stylesheet" href="/kit/gesso.css"></head><body>
    <div class="g-icon" style="--icon:url(/kit/icons/game-icons/health-potion.svg)"><i class="g-icon__base g-mat-lacquer"></i><i class="g-icon__shade"></i><i class="g-icon__rim"></i></div>
    <script type="module">import { defineAsset } from '/kit/gesso.mjs'; defineAsset({ render(t) { document.body.dataset.t = t; } });</script></body></html>`;
  const saved = await call('save_asset', { id: 'potion', svg: htmlIcon });
  assert.ok(!saved.isError, textOf(saved));
  assert.match(textOf(saved), /potion: icon 128x128/);
  assert.match(textOf(saved), /Lint clean/);
  assert.ok((await readFile(path.join(projectDir, 'assets', 'potion.html'), 'utf8')).includes('g-icon'));
  const thumb = await fetch(`${base}/api/projects/${project.id}/assets/potion/thumb`);
  assert.equal(thumb.headers.get('content-type'), 'image/png');
  const png = Buffer.from(await thumb.arrayBuffer());
  assert.ok(png.length > 1000, 'rendered thumbnail');
  const served = await fetch(`${base}/files/${project.id}/assets/potion.html`);
  assert.match(served.headers.get('content-security-policy'), /frame-ancestors 'self'/);
  assert.match(await served.text(), /\/kit\/player\.js/);

  // genre templates render as saved assets; the critique guide carries its anchor sheets
  assert.match(textOf(await call('get_template')), /- dark-fantasy: .*button.*panel/);
  const template = textOf(await call('get_template', { genre: 'sci-fi', part: 'button' }));
  assert.match(template, /^<!-- sci-fi\/button -->\n<!doctype html>/);
  assert.ok((await call('get_template', { genre: 'nope' })).isError);
  const fromTemplate = await call('save_asset', { id: 'btn-launch', svg: template.replace(/^<!--.*-->\n/, '') });
  assert.ok(!fromTemplate.isError, textOf(fromTemplate));
  assert.match(textOf(fromTemplate), /btn-launch: button 320x96/);
  const critique = await call('read_guide', { topics: ['critique'] });
  assert.equal(critique.content.filter((part) => part.type === 'image').length, 3);

  // a file removed on disk keeps its history and comes back with it
  const before = (await api(`/api/projects/${project.id}/assets/orb`)).revisions.length;
  const orbFile = path.join(projectDir, 'assets', 'orb.svg');
  const orbSource = await readFile(orbFile, 'utf8');
  await rm(orbFile);
  for (let attempt = 0; attempt < 20 && (await fetch(`${base}/api/projects/${project.id}/assets/orb`)).ok; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal((await fetch(`${base}/api/projects/${project.id}/assets/orb`)).status, 404);
  await writeFile(orbFile, orbSource);
  let revived;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    revived = await fetch(`${base}/api/projects/${project.id}/assets/orb`);
    if (revived.ok) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.equal((await revived.json()).revisions.length, before);

  // stdio bridge speaks the same protocol
  const bridge = spawn(process.execPath, [bin, 'mcp'], { env, stdio: ['pipe', 'pipe', 'inherit'] });
  const lines = [];
  bridge.stdout.on('data', (chunk) => lines.push(...chunk.toString().split('\n').filter(Boolean)));
  bridge.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })}\n`);
  bridge.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
  bridge.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })}\n`);
  bridge.stdin.end();
  await new Promise((resolve) => bridge.on('exit', resolve));
  assert.deepEqual(lines.map((line) => JSON.parse(line).id), [1, 2]);

  console.log('e2e ok');
} finally {
  server.kill();
  await rm(home, { recursive: true, force: true });
}
