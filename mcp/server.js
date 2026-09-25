#!/usr/bin/env node
// Game Art Studio MCP server: the agent is the artist, this server is its studio.
// ponytail: hand-rolled stdio JSON-RPC (tools only). Move to @modelcontextprotocol/sdk if HTTP transport, sampling or elicitation is needed.
import { createInterface } from 'node:readline';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureAsset, closeBrowser, contactSheet, offPalette, reviewSheet, spriteSheet } from './render.js';
import { readAssets, startStudio } from './http.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KNOWLEDGE = path.join(ROOT, 'knowledge');
const PROJECT = path.resolve(process.env.GAME_ART_PROJECT ?? 'game-art');
const ASSETS = path.join(PROJECT, 'assets');
const EXPORTS = path.join(PROJECT, 'exports');
const ART_BIBLE = path.join(PROJECT, 'STYLE.md');
const VERSION = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')).version;
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const studio = startStudio({ project: PROJECT, dist: path.join(ROOT, 'dist'), port: Number(process.env.GAME_ART_PORT) || 4477 }).catch((error) => {
  process.stderr.write(`studio unavailable: ${error.message}\n`);
  return null;
});

const INSTRUCTIONS = `Game Art Studio: you are the art team for this game; the user watches your work live in the studio.
Work like a professional game artist:
1. Call get_project first. With no art bible (STYLE.md), read_guide(["workflow", "art-bible"]) plus the closest styles/* pack, agree on the direction with the user, then write_art_bible.
2. Before each asset, read_guide its asset-types/* guide and the fundamentals you need. Follow STYLE.md exactly.
3. Write a complete SVG and call save_asset. It returns lint results and a review sheet (render, grayscale value check, 64/32px readability, animation frames).
4. Critique every review sheet with read_guide(["critique"]): score honestly, fix the weakest dimension, save again. Never stop at the first draft; finish only when every score is 4 or more.
5. For a set, view_assets to compare consistency. Call export_assets only once the user approves.
Assets are game-ready: transparent canvas, no presentation background, captions or watermarks; UI chrome is textless (the engine renders labels).`;

const text = (value) => ({ type: 'text', text: value });
const jpeg = (buffer) => ({ type: 'image', data: buffer.toString('base64'), mimeType: 'image/jpeg' });
// Models sometimes send a single string where the schema says array.
const listArg = (value) => [value ?? []].flat().filter((item) => item !== '' && item !== null && item !== undefined);
const readArtBible = () => readFile(ART_BIBLE, 'utf8').catch(() => '');

function assetFile(id) {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,79}$/.test(id) || id.includes('..')) {
    throw new Error('id must be lowercase letters, digits, ".", "_" or "-" (e.g. "btn-play" or "btn-play.pressed").');
  }
  return path.join(ASSETS, `${id}.svg`);
}

async function knowledgeTopics() {
  const files = await readdir(KNOWLEDGE, { recursive: true });
  return files.filter((file) => file.endsWith('.md') && file !== 'README.md').map((file) => file.slice(0, -3).split(path.sep).join('/')).sort();
}

const evenTimes = (duration, count) => Array.from({ length: count }, (_, index) => (duration * index) / count);

async function review(file, id) {
  const probe = await captureAsset(file, { id, times: [] });
  if (probe.report.fatal) return { fatal: probe.report.fatal };
  const { meta } = probe.report;
  const times = meta.animated && meta.duration ? evenTimes(meta.duration, 8) : [];
  const shot = await captureAsset(file, { id, fit: 440, times: [meta.duration * 0.25, ...times] });
  const [main, ...frames] = shot.frames;
  const sheet = await reviewSheet({ id, meta, main, scale: shot.scale, frames, times });
  return { report: probe.report, sheet };
}

function reportText(id, report, off) {
  const { meta, errors, warnings } = report;
  const lines = [`${id}: ${meta.type || 'untyped'} ${meta.width}x${meta.height}, ${meta.elements} elements${meta.animated ? `, animated ${meta.duration || '?'}s` : ''}${meta.nineSlice ? `, 9-slice ${meta.nineSlice.join(' ')}` : ''}.`];
  if (meta.bounds) lines.push(`Content margins (px) top ${meta.bounds.top}, right ${meta.bounds.right}, bottom ${meta.bounds.bottom}, left ${meta.bounds.left}; fills ${Math.round(meta.bounds.fill * 100)}% of the canvas.`);
  if (off.length) warnings.push(`Colors not in the STYLE.md palette: ${off.slice(0, 8).join(', ')}${off.length > 8 ? ` (+${off.length - 8} more)` : ''}. Use the art bible ramps.`);
  lines.push(...errors.map((error) => `ERROR: ${error}`), ...warnings.map((warning) => `WARN: ${warning}`));
  if (!errors.length && !warnings.length) lines.push('Lint clean.');
  return lines.join('\n');
}

const TOOLS = [
  {
    name: 'get_project',
    description: 'Start here. Returns the project folder, the studio URL the user is watching, the art bible (STYLE.md) and the asset list.',
    inputSchema: { type: 'object', properties: {} },
    async handler() {
      const [url, artBible, assets] = await Promise.all([studio, readArtBible(), readAssets(PROJECT)]);
      const list = assets.map((asset) => `- ${asset.id}: ${asset.type} ${asset.width}x${asset.height}${asset.duration ? ` animated ${asset.duration}s` : ''}`).join('\n');
      return [text(`Project: ${PROJECT}\nStudio: ${url ?? 'unavailable'}\n\n## Art bible (STYLE.md)\n${artBible || 'None yet. Create one first: read_guide(["workflow", "art-bible"]).'}\n\n## Assets (${assets.length})\n${list || 'None yet.'}`)];
    }
  },
  {
    name: 'read_guide',
    description: 'Read the game-art knowledge base: production workflow, critique rubric, art fundamentals, asset-type specs and genre style packs. Call with no topics for the index.',
    inputSchema: { type: 'object', properties: { topics: { type: 'array', items: { type: 'string' }, description: 'e.g. ["workflow", "asset-types/button", "styles/xianxia"]' } } },
    async handler({ topics }) {
      topics = listArg(topics);
      const available = await knowledgeTopics();
      if (!topics.length) return [text(`${await readFile(path.join(KNOWLEDGE, 'README.md'), 'utf8')}\n\nTopics: ${available.join(', ')}`)];
      const unknown = topics.filter((topic) => !available.includes(topic));
      if (unknown.length) throw new Error(`Unknown topic(s): ${unknown.join(', ')}. Available: ${available.join(', ')}`);
      return Promise.all(topics.map(async (topic) => text(await readFile(path.join(KNOWLEDGE, `${topic}.md`), 'utf8'))));
    }
  },
  {
    name: 'write_art_bible',
    description: "Create or replace the project's art bible (STYLE.md): the art direction every asset must follow. Hex codes listed in it become the palette that save_asset checks against.",
    inputSchema: { type: 'object', properties: { markdown: { type: 'string' } }, required: ['markdown'] },
    async handler({ markdown }) {
      if (typeof markdown !== 'string' || !markdown.trim()) throw new Error('markdown is required.');
      await mkdir(PROJECT, { recursive: true });
      await writeFile(ART_BIBLE, markdown);
      const palette = [...new Set(markdown.match(/#[0-9a-f]{6}\b/gi) ?? [])];
      return [text(`Saved ${ART_BIBLE}. Palette enforced by lint: ${palette.length ? palette.join(' ') : 'none (list hex codes to enable palette checks)'}.`)];
    }
  },
  {
    name: 'read_asset',
    description: 'Return the SVG source of an asset, to revise it or make variants (states, recolors, sizes).',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    async handler({ id }) {
      return [text(await readFile(assetFile(id), 'utf8'))];
    }
  },
  {
    name: 'save_asset',
    description: 'Create or overwrite an asset from a complete SVG document, then return lint results and a review sheet image to critique. Put metadata on the root <svg>: data-type (button|panel|frame|bar|icon|vfx|background|other), optional data-style, data-nine-slice="top right bottom left", and for animations data-duration="seconds" plus data-frames="count". Prefix every id with the asset id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'kebab-case file name without extension, e.g. "btn-play" or "btn-play.pressed"' },
        svg: { type: 'string', description: 'The complete SVG document' }
      },
      required: ['id', 'svg']
    },
    async handler({ id, svg }) {
      const file = assetFile(id);
      if (typeof svg !== 'string' || !svg.includes('<svg')) throw new Error('svg must be a complete SVG document.');
      await mkdir(ASSETS, { recursive: true });
      const draft = path.join(ASSETS, `.${id}.draft.svg`);
      await writeFile(draft, svg);
      try {
        const result = await review(draft, id);
        if (result.fatal) throw new Error(`Not saved: the SVG does not parse.\n${result.fatal}`);
        await rename(draft, file);
        const [url, artBible] = await Promise.all([studio, readArtBible()]);
        const summary = reportText(id, result.report, offPalette(svg, artBible));
        return [text(`Saved ${file}${url ? ` (studio: ${url}/#${id})` : ''}.\n${summary}\nNow critique the review sheet against read_guide(["critique"]) and iterate.`), jpeg(result.sheet)];
      } finally {
        await rm(draft, { force: true });
      }
    }
  },
  {
    name: 'view_assets',
    description: 'Render existing assets side by side in one image: use it to check a set for consistency, or to look at assets the user edited. Omit ids to view everything (max 24).',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } }, time: { type: 'number', description: 'seconds, for animated assets' } }
    },
    async handler({ ids, time = 0 }) {
      const list = listArg(ids).length ? listArg(ids) : (await readAssets(PROJECT)).map((asset) => asset.id);
      if (!list.length) throw new Error('No assets yet.');
      const items = [];
      for (const id of list.slice(0, 24)) {
        const shot = await captureAsset(assetFile(id), { id, fit: 204, times: [time] });
        if (shot.report.fatal) throw new Error(`${id}: ${shot.report.fatal}`);
        items.push({ id, meta: shot.report.meta, frame: shot.frames[0] });
      }
      return [jpeg(await contactSheet(items))];
    }
  },
  {
    name: 'export_assets',
    description: 'Export engine-ready files to exports/: transparent PNG per scale, sprite sheet + JSON (TexturePacker hash format, with Pixi/Phaser animations) for animated assets, and manifest.json with sizes, 9-slice insets and frame data. Omit ids to export everything.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        scales: { type: 'array', items: { type: 'number' }, description: 'default [1, 2]' }
      }
    },
    async handler({ ids, scales = [1, 2] }) {
      scales = listArg(scales).map(Number);
      if (!Array.isArray(scales) || !scales.length || scales.some((scale) => !(scale >= 0.25 && scale <= 4))) throw new Error('scales must be numbers between 0.25 and 4.');
      const list = listArg(ids).length ? listArg(ids) : (await readAssets(PROJECT)).map((asset) => asset.id);
      await mkdir(EXPORTS, { recursive: true });
      const manifestFile = path.join(EXPORTS, 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestFile, 'utf8').catch(() => '{"assets":{}}'));
      const written = [];
      for (const id of list) {
        const file = assetFile(id);
        const { report } = await captureAsset(file, { id, times: [] });
        if (report.fatal) throw new Error(`${id}: ${report.fatal}`);
        const { meta } = report;
        const frameCount = meta.animated && meta.duration ? meta.frames || 12 : 0;
        const entry = { type: meta.type, width: meta.width, height: meta.height, nineSlice: meta.nineSlice, files: {} };
        if (frameCount) Object.assign(entry, { duration: meta.duration, frames: frameCount, fps: Math.round((frameCount / meta.duration) * 100) / 100 });
        for (const scale of scales) {
          const name = `${id}${scale === 1 ? '' : `@${scale}x`}`;
          const times = frameCount ? evenTimes(meta.duration, frameCount) : [0];
          const shot = await captureAsset(file, { id, scale, times });
          if (!frameCount) {
            await writeFile(path.join(EXPORTS, `${name}.png`), shot.frames[0]);
            entry.files[scale] = `${name}.png`;
          } else {
            const [w, h] = [Math.ceil(meta.width * scale), Math.ceil(meta.height * scale)];
            const sheet = await spriteSheet(shot.frames, w, h);
            const frameNames = shot.frames.map((_, index) => `${id}_${index}`);
            const atlas = {
              frames: Object.fromEntries(frameNames.map((frameName, index) => [frameName, {
                frame: { x: (index % sheet.columns) * w, y: Math.floor(index / sheet.columns) * h, w, h },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w, h },
                sourceSize: { w, h },
                duration: Math.round((meta.duration / frameCount) * 1000)
              }])),
              animations: { [id]: frameNames },
              meta: { app: 'game-art-studio', version: VERSION, image: `${name}.png`, format: 'RGBA8888', size: { w: sheet.columns * w, h: sheet.rows * h }, scale: String(scale) }
            };
            await writeFile(path.join(EXPORTS, `${name}.png`), sheet.image);
            await writeFile(path.join(EXPORTS, `${name}.json`), JSON.stringify(atlas, null, 2));
            entry.files[scale] = { image: `${name}.png`, atlas: `${name}.json` };
          }
          written.push(name);
        }
        manifest.assets[id] = entry;
      }
      await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
      return [text(`Exported to ${EXPORTS}: ${written.join(', ')} (+ manifest.json).`)];
    }
  }
];

async function handle(method, params) {
  if (method === 'initialize') {
    return {
      protocolVersion: PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOLS[0],
      capabilities: { tools: {} },
      serverInfo: { name: 'game-art-studio', version: VERSION },
      instructions: INSTRUCTIONS
    };
  }
  if (method === 'ping') return {};
  if (method === 'tools/list') return { tools: TOOLS.map(({ handler, ...tool }) => tool) };
  if (method === 'tools/call') {
    const tool = TOOLS.find((candidate) => candidate.name === params.name);
    if (!tool) throw Object.assign(new Error(`Unknown tool: ${params.name}`), { code: -32602 });
    try {
      return { content: await tool.handler(params.arguments ?? {}) };
    } catch (error) {
      return { content: [text(error.message)], isError: true };
    }
  }
  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);

createInterface({ input: process.stdin })
  .on('line', async (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    if (message.id === undefined || message.id === null) return; // notification
    try {
      send({ jsonrpc: '2.0', id: message.id, result: await handle(message.method, message.params ?? {}) });
    } catch (error) {
      send({ jsonrpc: '2.0', id: message.id, error: { code: error.code ?? -32603, message: error.message } });
    }
  })
  .on('close', async () => {
    await closeBrowser();
    process.exit(0);
  });
