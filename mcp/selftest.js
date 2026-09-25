// End-to-end check: talks to the MCP server over stdio like a real client. Run with `npm test`.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = await mkdtemp(path.join(tmpdir(), 'game-art-test-'));
const server = spawn(process.execPath, [fileURLToPath(new URL('./server.js', import.meta.url))], {
  env: { ...process.env, GAME_ART_PROJECT: project, GAME_ART_PORT: '4600' },
  stdio: ['pipe', 'pipe', 'inherit']
});
const pending = new Map();
let buffer = '';
let nextId = 0;
server.stdout.on('data', (chunk) => {
  buffer += chunk;
  for (let end = buffer.indexOf('\n'); end >= 0; end = buffer.indexOf('\n')) {
    const message = JSON.parse(buffer.slice(0, end));
    buffer = buffer.slice(end + 1);
    pending.get(message.id)?.(message);
  }
});
const rpc = (method, params = {}) => new Promise((resolve) => {
  const id = ++nextId;
  pending.set(id, resolve);
  server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
});
const call = async (name, args = {}) => (await rpc('tools/call', { name, arguments: args })).result;
const textOf = (result) => result.content.filter((part) => part.type === 'text').map((part) => part.text).join('\n');

const svg = (body, attributes = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" data-type="icon" ${attributes}>${body}</svg>`;

try {
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'selftest', version: '0' } });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.ok(init.result.instructions.includes('save_asset'));
  assert.equal((await rpc('nope')).error.code, -32601);
  const { tools } = (await rpc('tools/list')).result;
  assert.deepEqual(tools.map((tool) => tool.name), ['get_project', 'read_guide', 'write_art_bible', 'read_asset', 'save_asset', 'view_assets', 'export_assets']);

  assert.ok(textOf(await call('read_guide', { topics: 'workflow' })).includes('Production workflow'));
  await call('write_art_bible', { markdown: 'Palette: #2e1a0d #764a27 #a26c3c #6cbf45' });

  const good = await call('save_asset', { id: 'orb', svg: svg('<circle id="orb-c" cx="32" cy="32" r="26" fill="#764a27" stroke="#ff00ff"/>') });
  assert.ok(!good.isError, textOf(good));
  assert.ok(good.content.some((part) => part.type === 'image' && part.mimeType === 'image/jpeg'), 'review sheet image');
  assert.match(textOf(good), /#ff00ff \(nearest/);

  const brokenTiming = await call('save_asset', {
    id: 'blink',
    svg: svg('<circle id="blink-c" cx="32" cy="32" r="20" fill="#6cbf45"><animate attributeName="r" values="10;20" keyTimes="0;.5" dur="1s" repeatCount="indefinite"/></circle>', 'data-duration="1"')
  });
  assert.match(textOf(brokenTiming), /keyTimes must end at 1/);

  assert.ok((await call('save_asset', { id: 'bad', svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect></svg>' })).isError, 'parse errors are rejected');
  assert.ok((await call('save_asset', { id: '../escape', svg: svg('') })).isError, 'path traversal is rejected');

  const pulse = svg('<circle id="pulse-c" cx="32" cy="32" r="20" fill="#6cbf45"><animate attributeName="r" values="10;24;10" keyTimes="0;.5;1" dur="1s" repeatCount="indefinite"/></circle>', 'data-duration="1" data-frames="4"');
  assert.ok(!(await call('save_asset', { id: 'pulse', svg: pulse })).isError);
  assert.ok((await call('view_assets', { ids: 'orb' })).content[0].type === 'image');

  assert.ok(!(await call('export_assets', { ids: ['orb', 'pulse'], scales: [1, 2] })).isError);
  const manifest = JSON.parse(await readFile(path.join(project, 'exports', 'manifest.json'), 'utf8'));
  assert.equal(manifest.assets.pulse.frames, 4);
  const atlas = JSON.parse(await readFile(path.join(project, 'exports', 'pulse@2x.json'), 'utf8'));
  assert.deepEqual(atlas.meta.size, { w: 256, h: 256 });
  assert.deepEqual(atlas.frames.pulse_3.frame, { x: 128, y: 128, w: 128, h: 128 });
  assert.deepEqual(atlas.animations.pulse, ['pulse_0', 'pulse_1', 'pulse_2', 'pulse_3']);
  console.log('selftest ok');
} finally {
  server.stdin.end();
  await rm(project, { recursive: true, force: true });
}
