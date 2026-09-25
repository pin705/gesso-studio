// Serves the studio (a read-only viewer) plus the project files it displays.
// Used by the MCP server and, as middleware, by `npm run dev`.
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER = fileURLToPath(new URL('./server.js', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const cache = new Map();

async function assetMeta(file, mtime) {
  const cached = cache.get(file);
  if (cached?.mtime === mtime) return cached.meta;
  const tag = (await readFile(file, 'utf8')).match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const attr = (name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
  const viewBox = attr('viewBox')?.trim().split(/[\s,]+/).map(Number) ?? [];
  const slice = attr('data-nine-slice')?.trim().split(/[\s,]+/).map(Number);
  const meta = {
    type: attr('data-type') ?? 'other',
    style: attr('data-style') ?? '',
    width: Number.parseFloat(attr('width') ?? '') || viewBox[2] || 0,
    height: Number.parseFloat(attr('height') ?? '') || viewBox[3] || 0,
    duration: Number.parseFloat(attr('data-duration') ?? '') || 0,
    nineSlice: slice?.length ? [slice[0], slice[1] ?? slice[0], slice[2] ?? slice[0], slice[3] ?? slice[1] ?? slice[0]] : null
  };
  cache.set(file, { mtime, meta });
  return meta;
}

export async function readAssets(project) {
  const dir = path.join(project, 'assets');
  const names = await readdir(dir).catch(() => []);
  const assets = [];
  for (const name of names.sort()) {
    if (!name.endsWith('.svg') || name.startsWith('.')) continue;
    const file = path.join(dir, name);
    const mtime = Math.round((await stat(file)).mtimeMs);
    assets.push({ id: name.slice(0, -4), file: `assets/${name}`, mtime, ...(await assetMeta(file, mtime)) });
  }
  return assets;
}

export async function projectInfo(project) {
  return {
    name: path.basename(project),
    dir: project,
    server: SERVER,
    artBible: await readFile(path.join(project, 'STYLE.md'), 'utf8').catch(() => null),
    assets: await readAssets(project)
  };
}

function send(response, status, type, body, headers = {}) {
  response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', ...headers });
  response.end(body);
}

async function sendFile(response, base, relative, headers) {
  const root = path.resolve(base);
  const file = path.resolve(root, decodeURIComponent(relative));
  if (!file.startsWith(root + path.sep)) throw new Error('outside root');
  send(response, 200, TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', await readFile(file), headers);
}

/** Connect-style handler: `/api/project`, `/files/*` from the project, everything else from `dist` (or `next`). */
export function studioHandler({ project, dist }) {
  return async (request, response, next) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    try {
      if (pathname === '/api/project') return send(response, 200, TYPES['.json'], JSON.stringify(await projectInfo(project)));
      // Project files may come from anywhere; never let them run script in the studio origin.
      if (pathname.startsWith('/files/')) return await sendFile(response, project, pathname.slice(7), { 'content-security-policy': "script-src 'none'" });
      if (dist) return await sendFile(response, dist, pathname === '/' ? 'index.html' : pathname.slice(1));
    } catch {
      return send(response, 404, 'text/plain', pathname === '/' ? 'Studio UI is not built yet: run `npm run build`.' : 'Not found');
    }
    next();
  };
}

/** Start the studio on the first free port from `port`, bound to localhost only. */
export function startStudio({ project, dist, port = 4477 }) {
  const handler = studioHandler({ project, dist });
  return new Promise((resolve, reject) => {
    const listen = (candidate) => {
      const server = createServer((request, response) => handler(request, response, () => send(response, 404, 'text/plain', 'Not found')));
      server.once('error', (error) => (error.code === 'EADDRINUSE' && candidate < port + 20 ? listen(candidate + 1) : reject(error)));
      server.listen(candidate, '127.0.0.1', () => {
        server.unref();
        resolve(`http://127.0.0.1:${candidate}`);
      });
    };
    listen(port);
  });
}
