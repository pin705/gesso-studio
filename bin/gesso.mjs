#!/usr/bin/env node
// gesso            start the studio (UI + API + MCP over HTTP at /mcp)
// gesso mcp        stdio MCP bridge for clients without HTTP support; starts the studio if needed
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverEntry = path.join(root, '.output', 'server', 'index.mjs');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const port = Number(flag('port', process.env.GESSO_PORT ?? 4477));
const baseUrl = (process.env.GESSO_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, '');
const log = (message) => process.stderr.write(`[gesso] ${message}\n`);

async function healthy() {
  try {
    const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.json()).app === 'gesso';
  } catch {
    return false;
  }
}

function requireBuild() {
  if (existsSync(serverEntry)) return;
  log('The studio is not built yet. Run `npm run build` in the Gesso folder first.');
  process.exit(1);
}

async function start() {
  requireBuild();
  if (await healthy()) {
    log(`Gesso is already running at ${baseUrl}`);
    return;
  }
  process.env.NITRO_HOST ??= process.env.GESSO_HOST ?? '127.0.0.1';
  process.env.NITRO_PORT ??= String(port);
  await import(pathToFileURL(serverEntry).href);
  log(`Studio ready at http://${process.env.NITRO_HOST}:${process.env.NITRO_PORT}  (MCP endpoint: /mcp)`);
}

async function bridge() {
  if (!(await healthy())) {
    requireBuild();
    const logs = path.join(process.env.GESSO_HOME ?? path.join(homedir(), '.gesso'), 'logs');
    mkdirSync(logs, { recursive: true });
    const out = openSync(path.join(logs, 'server.log'), 'a');
    spawn(process.execPath, [fileURLToPath(import.meta.url), '--port', String(port)], { detached: true, stdio: ['ignore', out, out] }).unref();
    for (let attempt = 0; attempt < 60 && !(await healthy()); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 250));
    if (!(await healthy())) {
      log(`Could not start the studio; see ${path.join(logs, 'server.log')}`);
      process.exit(1);
    }
  }
  const project = flag('project', process.env.GESSO_PROJECT);
  const endpoint = `${baseUrl}/mcp${project ? `?project=${encodeURIComponent(path.resolve(project))}` : ''}`;
  const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
  let queue = Promise.resolve();
  createInterface({ input: process.stdin })
    .on('line', (line) => {
      if (!line.trim()) return;
      // keep responses in request order, like a stdio server would
      queue = queue.then(async () => {
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
        }
        try {
          const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: line });
          if (response.status === 202) return;
          send(await response.json());
        } catch (error) {
          if (message.id !== undefined) send({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: `Gesso studio unreachable: ${error.message}` } });
        }
      });
    })
    .on('close', () => queue.then(() => process.exit(0)));
}

if (args[0] === 'mcp') await bridge();
else if (!args[0] || args[0] === 'start' || args[0].startsWith('--')) await start();
else {
  log('Usage: gesso [start] [--port 4477]  |  gesso mcp [--project <folder>]');
  process.exit(1);
}
