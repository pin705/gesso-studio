// Gesso MCP: the agent is the artist, these tools are its studio.
// ponytail: hand-rolled stateless JSON-RPC (tools only). Move to @modelcontextprotocol/sdk if sessions, sampling or elicitation are needed.
import path from 'node:path';

const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export const INSTRUCTIONS = `Gesso: you are the art team for this game; the user watches and reviews your work live in the Gesso studio.
Work like a professional game artist:
1. Call get_project first (it also lists open feedback). With no art bible (STYLE.md), read_guide(["workflow", "art-bible"]) plus the closest styles/* pack, agree on the direction with the user, then write_art_bible.
2. Before each asset, read_guide its asset-types/* guide and the fundamentals you need. Follow STYLE.md exactly.
3. Write a complete SVG and call save_asset with a one-line note of what changed. It returns lint results and a review sheet (render, grayscale value check, 64/32px readability, animation frames).
4. Critique every review sheet with read_guide(["critique"]); pass your scores in save_asset's critique field. Fix the weakest dimension and save again. Finish only when every score is 4 or more.
5. The user leaves feedback in the studio. Check get_feedback before and after each round, address it, then resolve_feedback with a one-line reply.
6. For a set, view_assets to compare consistency. Call export_assets only once the user approves.
Assets are game-ready: transparent canvas, no presentation background, captions or watermarks; UI chrome is textless (the engine renders labels).`;

type Content = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };
interface Context {
  project?: string;
  origin: string;
}
interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler(args: Record<string, any>, context: Context): Promise<Content[]>;
}

const text = (value: string): Content => ({ type: 'text', text: value });
const jpeg = (buffer: Buffer): Content => ({ type: 'image', data: buffer.toString('base64'), mimeType: 'image/jpeg' });
// Models sometimes send a single string where the schema says array.
const listArg = (value: unknown): any[] => [value ?? []].flat().filter((item) => item !== '' && item !== null && item !== undefined);

async function resolveProject(context: Context): Promise<Project> {
  if (context.project) {
    const known = findProject(context.project);
    if (known) return known;
    if (context.project.includes('/') || context.project.includes('\\')) return addProject(context.project);
    throw new Error(`Unknown project "${context.project}". Call list_projects or open_project.`);
  }
  const active = activeProject();
  if (!active) throw new Error('No project yet. Call open_project with a folder path (e.g. the game repo\'s art folder).');
  return active;
}

const studioUrl = (context: Context, project: Project, key?: string) => `${context.origin}/p/${project.id}${key ? `/a/${encodeURIComponent(key)}` : ''}`;

function feedbackText(items: ReturnType<typeof openFeedback>): string {
  if (!items.length) return 'No open feedback.';
  return items
    .map((item) => `- #${item.id} on ${item.asset} (rev ${item.revision})${item.x !== null && item.y !== null ? ` at (${Math.round(item.x * item.width)}, ${Math.round(item.y * item.height)}) px` : ''}: ${item.body}`)
    .join('\n');
}

const TOOLS: Tool[] = [
  {
    name: 'get_project',
    description: 'Start here. Returns the project folder, the studio URL the user is watching, the art bible (STYLE.md), the asset list with review status, and open feedback from the user.',
    inputSchema: { type: 'object', properties: {} },
    async handler(_, context) {
      const project = await resolveProject(context);
      touchProject(project);
      const [bible, assets] = [await readBible(project), listAssets(project)];
      const list = assets.map((asset) => `- ${asset.key}: ${asset.type} ${asset.width}x${asset.height}, rev ${asset.revision}, ${asset.status}${asset.open_feedback ? `, ${asset.open_feedback} open feedback` : ''}`).join('\n');
      return [text(`Project: ${project.name} (${project.path})\nStudio: ${studioUrl(context, project)}\n\n## Art bible (STYLE.md)\n${bible || 'None yet. Create one first: read_guide(["workflow", "art-bible"]).'}\n\n## Assets (${assets.length})\n${list || 'None yet.'}\n\n## Open feedback\n${feedbackText(openFeedback(project))}`)];
    }
  },
  {
    name: 'list_projects',
    description: 'List the Gesso projects on this machine.',
    inputSchema: { type: 'object', properties: {} },
    async handler() {
      const projects = listProjects();
      return [text(projects.length ? projects.map((project) => `- ${project.name} [${project.id}]: ${project.path}`).join('\n') : 'No projects yet. Call open_project.')];
    }
  },
  {
    name: 'open_project',
    description: 'Open (or create) a project folder and make it the target of the following calls. Use the art folder of the game the user is working on.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Absolute folder path, e.g. /home/me/my-game/art' }, name: { type: 'string' } }, required: ['path'] },
    async handler({ path: folder, name }, context) {
      if (typeof folder !== 'string' || !path.isAbsolute(folder.replace(/^~/, '/'))) throw new Error('path must be an absolute folder path.');
      const project = touchProject(await addProject(folder, name));
      return [text(`Opened ${project.name} (${project.path}). Studio: ${studioUrl(context, project)}`)];
    }
  },
  {
    name: 'read_guide',
    description: 'Read the game-art knowledge base: production workflow, critique rubric, art fundamentals, asset-type specs and genre style packs. Call with no topics for the index.',
    inputSchema: { type: 'object', properties: { topics: { type: 'array', items: { type: 'string' }, description: 'e.g. ["workflow", "asset-types/button", "styles/xianxia"]' } } },
    async handler({ topics }) {
      const wanted = listArg(topics);
      const available = await knowledgeTopics();
      if (!wanted.length) return [text(`${await readTopic('README')}\n\nTopics: ${available.join(', ')}`)];
      const unknown = wanted.filter((topic) => !available.includes(topic));
      if (unknown.length) throw new Error(`Unknown topic(s): ${unknown.join(', ')}. Available: ${available.join(', ')}`);
      return Promise.all(wanted.map(async (topic) => text(await readTopic(topic))));
    }
  },
  {
    name: 'write_art_bible',
    description: "Create or replace the project's art bible (STYLE.md): the art direction every asset must follow. Hex codes listed in it become the palette that save_asset checks against.",
    inputSchema: { type: 'object', properties: { markdown: { type: 'string' } }, required: ['markdown'] },
    async handler({ markdown }, context) {
      if (typeof markdown !== 'string' || !markdown.trim()) throw new Error('markdown is required.');
      const project = await resolveProject(context);
      await writeBible(project, markdown, 'ai');
      const palette = [...new Set(markdown.match(/#[0-9a-f]{6}\b/gi) ?? [])];
      return [text(`Saved STYLE.md. Palette enforced by lint: ${palette.length ? palette.join(' ') : 'none (list hex codes to enable palette checks)'}.`)];
    }
  },
  {
    name: 'read_asset',
    description: 'Return the SVG source of an asset (latest, or a given revision) to revise it or make variants such as states, recolors and sizes.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, revision: { type: 'number' } }, required: ['id'] },
    async handler({ id, revision }, context) {
      const project = await resolveProject(context);
      const row = requireAsset(project, id);
      const number = revision ?? (useDb().prepare('SELECT MAX(number) AS n FROM revisions WHERE asset_id = ?').get(row.id) as { n: number }).n;
      return [text(revisionSvg(project, id, number))];
    }
  },
  {
    name: 'save_asset',
    description: 'Create or update an asset from a complete SVG document; returns lint results and a review sheet image to critique. Put metadata on the root <svg>: data-type (button|panel|frame|bar|icon|vfx|background|mockup|other), optional data-style, data-bleed (deliberate full-bleed art such as skill icons), data-nine-slice="top right bottom left", and for animations data-duration="seconds" plus data-frames="count". Prefix every id with the asset id. States are separate ids: "btn-play.pressed". A mockup composes other assets with <image href="other-id.svg"> to judge the set in context.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'kebab-case asset id, e.g. "btn-play" or "btn-play.pressed"' },
        svg: { type: 'string', description: 'The complete SVG document' },
        note: { type: 'string', description: 'One line: what changed in this revision' },
        critique: {
          type: 'object',
          description: 'Your rubric scores (1-5) for the previous review sheet, shown to the user',
          properties: {
            scores: { type: 'object', additionalProperties: { type: 'number' } },
            notes: { type: 'string' }
          }
        }
      },
      required: ['id', 'svg']
    },
    async handler({ id, svg, note, critique }, context) {
      const project = await resolveProject(context);
      const key = assertKey(id);
      const result = await saveReviewed(project, key, svg, { source: 'ai', note: typeof note === 'string' ? note : '', critique: critique && typeof critique === 'object' ? critique : undefined });
      logActivity(project, 'ai', 'save', `${key} rev ${result.revision}${note ? `: ${String(note).slice(0, 120)}` : ''}`, key);
      const open = openFeedback(project, key);
      return [
        text(`Saved ${key} rev ${result.revision} (${studioUrl(context, project, key)}).\n${lintSummary(key, result.report)}${open.length ? `\nOpen feedback on this asset:\n${feedbackText(open)}` : ''}\nNow critique the review sheet against read_guide(["critique"]) and iterate.`),
        jpeg(result.sheet)
      ];
    }
  },
  {
    name: 'view_assets',
    description: 'Render existing assets side by side in one image, to check a set for consistency or to look at assets the user edited. Omit ids to view everything (max 24).',
    inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, time: { type: 'number', description: 'seconds, for animated assets' } } },
    async handler({ ids, time }, context) {
      const project = await resolveProject(context);
      const keys = listArg(ids).length ? listArg(ids).map(assertKey) : listAssets(project).map((asset) => asset.key);
      if (!keys.length) throw new Error('No assets yet.');
      const items = [];
      for (const key of keys.slice(0, 24)) {
        // Animated assets default to a representative frame instead of the (often empty) first one.
        const at = time === undefined ? (getAssetRow(project, key)?.duration ?? 0) * 0.25 : Number(time) || 0;
        const shot = await captureAsset(path.join(dirs(project).assets, `${key}.svg`), { id: key, fit: 204, times: [at] });
        if (shot.report.fatal) throw new Error(`${key}: ${shot.report.fatal}`);
        items.push({ id: key, meta: shot.report.meta, frame: shot.frames[0]! });
      }
      return [jpeg(await contactSheet(items))];
    }
  },
  {
    name: 'get_feedback',
    description: 'Open feedback the user left in the studio, optionally for one asset. Points are given in asset pixels when the user pinned the comment on the canvas.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'asset id (optional)' } } },
    async handler({ id }, context) {
      const project = await resolveProject(context);
      return [text(feedbackText(openFeedback(project, id ? assertKey(id) : undefined)))];
    }
  },
  {
    name: 'resolve_feedback',
    description: 'Mark a feedback item as addressed, with a one-line reply the user will see.',
    inputSchema: { type: 'object', properties: { feedback_id: { type: 'number' }, reply: { type: 'string' } }, required: ['feedback_id', 'reply'] },
    async handler({ feedback_id, reply }, context) {
      const project = await resolveProject(context);
      updateFeedback(project, Number(feedback_id), { status: 'resolved', reply: String(reply ?? '') }, 'ai');
      return [text(`Feedback #${feedback_id} resolved.`)];
    }
  },
  {
    name: 'export_assets',
    description: 'Export engine-ready files to exports/: transparent PNG per scale, sprite sheet + JSON (TexturePacker hash format with Pixi/Phaser animations) for animated assets, and manifest.json with sizes, 9-slice insets and frame data. Omit ids to export everything.',
    inputSchema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, scales: { type: 'array', items: { type: 'number' }, description: 'default [1, 2]' } } },
    async handler({ ids, scales }, context) {
      const project = await resolveProject(context);
      const wanted = listArg(scales).map(Number);
      const result = await exportAssets(project, listArg(ids), wanted.length ? wanted : [1, 2]);
      logActivity(project, 'ai', 'export', `Exported ${result.written.length} file set(s)`);
      return [text(`Exported to ${result.dir}: ${result.written.join(', ')} (+ manifest.json).`)];
    }
  }
];

export const toolNames = TOOLS.map((tool) => tool.name);

async function handle(method: string, params: Record<string, any>, context: Context) {
  if (method === 'initialize') {
    return {
      protocolVersion: PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOLS[0],
      capabilities: { tools: {} },
      serverInfo: { name: 'gesso', title: 'Gesso', version: useRuntimeConfig().public.version },
      instructions: INSTRUCTIONS
    };
  }
  if (method === 'ping') return {};
  if (method === 'tools/list') return { tools: TOOLS.map(({ handler, ...tool }) => tool) };
  if (method === 'tools/call') {
    const tool = TOOLS.find((candidate) => candidate.name === params.name);
    if (!tool) throw Object.assign(new Error(`Unknown tool: ${params.name}`), { code: -32602 });
    try {
      return { content: await tool.handler(params.arguments ?? {}, context) };
    } catch (error: any) {
      return { content: [text(error?.message || String(error))], isError: true };
    }
  }
  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

/** One JSON-RPC message in, one response (or nothing, for notifications) out. */
export async function handleRpc(message: any, context: Context) {
  if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } };
  if (message.id === undefined || message.id === null) return null;
  try {
    return { jsonrpc: '2.0', id: message.id, result: await handle(message.method, message.params ?? {}, context) };
  } catch (error: any) {
    return { jsonrpc: '2.0', id: message.id, error: { code: error.code ?? -32603, message: error.message } };
  }
}
