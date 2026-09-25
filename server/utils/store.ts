import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export type AssetStatus = 'draft' | 'review' | 'changes' | 'approved';
export const STATUSES: AssetStatus[] = ['draft', 'review', 'changes', 'approved'];

export interface Project {
  id: string;
  name: string;
  path: string;
  created_at: number;
  opened_at: number;
}

export interface AssetRow {
  id: number;
  project_id: string;
  key: string;
  type: string;
  style: string;
  width: number;
  height: number;
  duration: number;
  frames: number;
  nine_slice: string | null;
  status: AssetStatus;
  hash: string;
  updated_at: number;
  format: AssetFormat;
}

export type AssetFormat = 'svg' | 'html';
/** HTML/CSS assets (Gesso Kit, Pixi, three) or SVG, told apart by their root element. */
export const detectFormat = (content: string): AssetFormat => (/^\s*(<!doctype html|<html\b)/i.test(content) ? 'html' : 'svg');

/** Current file of an asset, whichever format it was saved in. */
export function assetPath(project: Project, key: string): string {
  const format = getAssetRow(project, key)?.format ?? (existsSync(path.join(dirs(project).assets, `${key}.html`)) ? 'html' : 'svg');
  return path.join(dirs(project).assets, `${key}.${format}`);
}

export const KEY = /^[a-z0-9][a-z0-9._-]{0,79}$/;

export function assertKey(key: unknown): string {
  if (typeof key !== 'string' || !KEY.test(key) || key.includes('..')) {
    throw createError({ statusCode: 400, message: 'Asset ids are lowercase letters, digits, ".", "_" or "-" (e.g. "btn-play" or "btn-play.pressed").' });
  }
  return key;
}

export const dirs = (project: Project) => ({
  root: project.path,
  assets: path.join(project.path, 'assets'),
  exports: path.join(project.path, 'exports'),
  bible: path.join(project.path, 'STYLE.md')
});

const now = () => Date.now();
const hash = (text: string) => createHash('sha1').update(text).digest('hex');

// ---------- projects ----------

export function listProjects(): Project[] {
  return useDb().prepare('SELECT * FROM projects ORDER BY opened_at DESC').all() as unknown as Project[];
}

export function findProject(ref: string): Project | undefined {
  const byId = useDb().prepare('SELECT * FROM projects WHERE id = ?').get(ref) as Project | undefined;
  return byId ?? (useDb().prepare('SELECT * FROM projects WHERE path = ?').get(path.resolve(ref)) as Project | undefined);
}

export function requireProject(ref: string): Project {
  const project = findProject(ref);
  if (!project) throw createError({ statusCode: 404, message: `Unknown project: ${ref}` });
  return project;
}

/** Register (and create) a project folder. Only folders inside the home directory, so an agent cannot write elsewhere. */
export async function addProject(folder: string, name?: string): Promise<Project> {
  const target = path.resolve(folder.replace(/^~(?=$|\/)/, homedir()));
  const home = homedir();
  if (target !== home && !target.startsWith(home + path.sep) && !process.env.GESSO_ALLOW_ANY_PATH) {
    throw createError({ statusCode: 400, message: `Projects must live inside your home folder (${home}).` });
  }
  const existing = findProject(target);
  if (existing) return touchProject(existing);
  await mkdir(path.join(target, 'assets'), { recursive: true });
  const project: Project = { id: randomUUID().slice(0, 8), name: name?.trim() || path.basename(target), path: target, created_at: now(), opened_at: now() };
  useDb().prepare('INSERT INTO projects (id, name, path, created_at, opened_at) VALUES (?, ?, ?, ?, ?)').run(project.id, project.name, project.path, project.created_at, project.opened_at);
  await syncProject(project);
  lintInBackground(project, unlintedKeys(project));
  watchProject(project);
  logActivity(project, 'user', 'project', `Project "${project.name}" added`);
  emit({ type: 'project', project: project.id });
  return project;
}

export function touchProject(project: Project): Project {
  project.opened_at = now();
  useDb().prepare('UPDATE projects SET opened_at = ? WHERE id = ?').run(project.opened_at, project.id);
  setSetting('active_project', project.id);
  return project;
}

export function renameProject(project: Project, name: string): void {
  useDb().prepare('UPDATE projects SET name = ? WHERE id = ?').run(name.trim() || project.name, project.id);
  emit({ type: 'project', project: project.id });
}

/** Forget a project. Never deletes the user's files. */
export function removeProject(project: Project): void {
  unwatchProject(project);
  useDb().prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  emit({ type: 'project', project: project.id });
}

export function activeProject(): Project | undefined {
  const id = getSetting('active_project');
  return (id && findProject(id)) || listProjects()[0];
}

// ---------- art bible ----------

export const readBible = (project: Project) => readFile(dirs(project).bible, 'utf8').catch(() => '');

export async function writeBible(project: Project, markdown: string, actor: 'user' | 'ai'): Promise<void> {
  await writeFile(dirs(project).bible, markdown);
  logActivity(project, actor, 'bible', 'Art bible updated');
  emit({ type: 'bible', project: project.id });
}

// ---------- assets ----------

export function parseMeta(svg: string) {
  const format = detectFormat(svg);
  const tag = svg.match(format === 'html' ? /<html\b[^>]*>/i : /<svg\b[^>]*>/i)?.[0] ?? '';
  const attr = (name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
  const viewBox = attr('viewBox')?.trim().split(/[\s,]+/).map(Number) ?? [];
  const slice = attr('data-nine-slice')?.trim().split(/[\s,]+/).map(Number).filter((value) => value >= 0);
  const nineSlice = slice?.length ? [slice[0]!, slice[1] ?? slice[0]!, slice[2] ?? slice[0]!, slice[3] ?? slice[1] ?? slice[0]!] : null;
  return {
    type: attr('data-type') ?? 'other',
    style: attr('data-style') ?? '',
    width: Number.parseFloat(attr(format === 'html' ? 'data-width' : 'width') ?? '') || viewBox[2] || 0,
    height: Number.parseFloat(attr(format === 'html' ? 'data-height' : 'height') ?? '') || viewBox[3] || 0,
    duration: Number.parseFloat(attr('data-duration') ?? '') || 0,
    frames: Number.parseInt(attr('data-frames') ?? '', 10) || 0,
    nine_slice: nineSlice ? JSON.stringify(nineSlice) : null,
    format
  };
}

export function getAssetRow(project: Project, key: string): AssetRow | undefined {
  return useDb().prepare('SELECT * FROM assets WHERE project_id = ? AND key = ?').get(project.id, key) as AssetRow | undefined;
}

export function requireAsset(project: Project, key: string): AssetRow {
  const row = getAssetRow(project, assertKey(key));
  if (!row) throw createError({ statusCode: 404, message: `Unknown asset: ${key}` });
  return row;
}

interface RevisionInput {
  source: 'ai' | 'disk' | 'restore' | 'user';
  note?: string;
  lint?: unknown;
  critique?: unknown;
}

/** Record a new revision if the content changed. Returns the revision number. */
function recordRevision(project: Project, key: string, svg: string, input: RevisionInput): number {
  const db = useDb();
  const meta = parseMeta(svg);
  const digest = hash(svg);
  let row = getAssetRow(project, key);
  const status: AssetStatus = input.source === 'ai' || input.source === 'restore' ? 'review' : (row?.status ?? 'draft');
  if (!row) {
    db.prepare(`INSERT INTO assets (project_id, key, type, style, width, height, duration, frames, nine_slice, status, hash, updated_at, format)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(project.id, key, meta.type, meta.style, meta.width, meta.height, meta.duration, meta.frames, meta.nine_slice, status, digest, now(), meta.format);
    row = getAssetRow(project, key)!;
  } else if (row.hash !== digest) {
    db.prepare(`UPDATE assets SET type = ?, style = ?, width = ?, height = ?, duration = ?, frames = ?, nine_slice = ?, status = ?, hash = ?, updated_at = ?, format = ? WHERE id = ?`)
      .run(meta.type, meta.style, meta.width, meta.height, meta.duration, meta.frames, meta.nine_slice, status, digest, now(), meta.format, row.id);
  }
  const last = db.prepare('SELECT number, hash FROM revisions WHERE asset_id = ? ORDER BY number DESC LIMIT 1').get(row.id) as { number: number; hash: string } | undefined;
  if (last?.hash === digest) {
    if (input.lint || input.critique || input.note) {
      db.prepare('UPDATE revisions SET lint = COALESCE(?, lint), critique = COALESCE(?, critique), note = CASE WHEN ? = \'\' THEN note ELSE ? END WHERE asset_id = ? AND number = ?')
        .run(input.lint ? JSON.stringify(input.lint) : null, input.critique ? JSON.stringify(input.critique) : null, input.note ?? '', input.note ?? '', row.id, last.number);
    }
    return last.number;
  }
  const number = (last?.number ?? 0) + 1;
  db.prepare('INSERT INTO revisions (asset_id, number, svg, hash, source, note, lint, critique, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(row.id, number, svg, digest, input.source, input.note ?? '', input.lint ? JSON.stringify(input.lint) : null, input.critique ? JSON.stringify(input.critique) : null, now());
  return number;
}

/** Write an asset file atomically and record it. */
export async function writeAsset(project: Project, key: string, svg: string, input: RevisionInput): Promise<number> {
  const { assets } = dirs(project);
  await mkdir(assets, { recursive: true });
  const format = detectFormat(svg);
  const file = path.join(assets, `${key}.${format}`);
  const temp = path.join(assets, `.${key}.${process.pid}.tmp`);
  await writeFile(temp, svg);
  await rename(temp, file);
  // switching format replaces the old file
  await rm(path.join(assets, `${key}.${format === 'html' ? 'svg' : 'html'}`), { force: true });
  const number = recordRevision(project, key, svg, input);
  emit({ type: 'asset', project: project.id, asset: key });
  return number;
}

export async function deleteAsset(project: Project, key: string): Promise<void> {
  await rm(path.join(dirs(project).assets, `${key}.svg`), { force: true });
  await rm(path.join(dirs(project).assets, `${key}.html`), { force: true });
  useDb().prepare('DELETE FROM assets WHERE project_id = ? AND key = ?').run(project.id, key);
  logActivity(project, 'user', 'delete', `Deleted ${key}`, key);
  emit({ type: 'asset', project: project.id, asset: key });
}

/** Bring the database in line with the folder: new or edited files become revisions, missing files are dropped. */
export async function syncProject(project: Project): Promise<string[]> {
  const { assets } = dirs(project);
  const names = await readdir(assets).catch(() => [] as string[]);
  const files = names.filter((name) => /\.(svg|html)$/.test(name) && !name.startsWith('.'));
  const keys = [...new Set(files.map((name) => name.replace(/\.(svg|html)$/, '')))].filter((key) => KEY.test(key));
  const changed: string[] = [];
  for (const key of keys) {
    const svg = await readFile(files.includes(`${key}.html`) ? path.join(assets, `${key}.html`) : path.join(assets, `${key}.svg`), 'utf8').catch(() => null);
    if (svg === null) continue;
    if (getAssetRow(project, key)?.hash === hash(svg)) continue;
    recordRevision(project, key, svg, { source: 'disk' });
    changed.push(key);
  }
  const known = useDb().prepare('SELECT key FROM assets WHERE project_id = ?').all(project.id) as { key: string }[];
  for (const { key } of known) {
    if (!keys.includes(key)) {
      useDb().prepare('DELETE FROM assets WHERE project_id = ? AND key = ?').run(project.id, key);
      changed.push(key);
    }
  }
  return changed;
}

export const masterKey = (key: string) => key.split('.')[0]!;

/** Assets whose latest revision was never linted (copied in or edited while Gesso was off). */
export function unlintedKeys(project: Project): string[] {
  return (useDb().prepare(`SELECT a.key FROM assets a JOIN revisions r ON r.asset_id = a.id
      WHERE a.project_id = ? AND r.number = (SELECT MAX(number) FROM revisions WHERE asset_id = a.id) AND r.lint IS NULL`).all(project.id) as { key: string }[]).map((row) => row.key);
}

export function listAssets(project: Project) {
  return useDb().prepare(`
    SELECT a.*,
      (SELECT MAX(number) FROM revisions r WHERE r.asset_id = a.id) AS revision,
      (SELECT COUNT(*) FROM feedback f WHERE f.asset_id = a.id AND f.status = 'open') AS open_feedback
    FROM assets a WHERE a.project_id = ? ORDER BY a.key`).all(project.id) as unknown as (AssetRow & { revision: number; open_feedback: number })[];
}

export function assetDetail(project: Project, key: string) {
  const row = requireAsset(project, key);
  const db = useDb();
  const revisions = (db.prepare('SELECT number, source, note, lint, critique, created_at FROM revisions WHERE asset_id = ? ORDER BY number DESC').all(row.id) as Record<string, any>[])
    .map((revision) => ({ ...revision, lint: revision.lint ? JSON.parse(revision.lint) : null, critique: revision.critique ? JSON.parse(revision.critique) : null }));
  const feedback = db.prepare('SELECT * FROM feedback WHERE asset_id = ? ORDER BY created_at DESC').all(row.id);
  const variants = (db.prepare('SELECT key, status FROM assets WHERE project_id = ? AND (key = ? OR key LIKE ?) ORDER BY key').all(project.id, masterKey(key), `${masterKey(key)}.%`)) as { key: string; status: string }[];
  return { ...row, nineSlice: row.nine_slice ? JSON.parse(row.nine_slice) : null, revisions, feedback, variants };
}

export function revisionSvg(project: Project, key: string, number: number): string {
  const row = requireAsset(project, key);
  const revision = useDb().prepare('SELECT svg FROM revisions WHERE asset_id = ? AND number = ?').get(row.id, number) as { svg: string } | undefined;
  if (!revision) throw createError({ statusCode: 404, message: `No revision ${number} for ${key}` });
  return revision.svg;
}

export function setStatus(project: Project, key: string, status: AssetStatus): void {
  if (!STATUSES.includes(status)) throw createError({ statusCode: 400, message: `Status must be one of ${STATUSES.join(', ')}` });
  const row = requireAsset(project, key);
  useDb().prepare('UPDATE assets SET status = ? WHERE id = ?').run(status, row.id);
  logActivity(project, 'user', 'status', `${key} marked ${status === 'changes' ? 'changes requested' : status}`, key);
  emit({ type: 'asset', project: project.id, asset: key });
}

// ---------- feedback ----------

export function addFeedback(project: Project, key: string, input: { body: string; x?: number | null; y?: number | null }) {
  const row = requireAsset(project, key);
  const body = input.body?.trim();
  if (!body) throw createError({ statusCode: 400, message: 'Feedback needs text' });
  const revision = (useDb().prepare('SELECT MAX(number) AS number FROM revisions WHERE asset_id = ?').get(row.id) as { number: number }).number;
  const point = (value: unknown) => (typeof value === 'number' && value >= 0 && value <= 1 ? value : null);
  useDb().prepare('INSERT INTO feedback (asset_id, revision, body, x, y, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(row.id, revision, body, point(input.x), point(input.y), now());
  if (row.status !== 'changes') useDb().prepare("UPDATE assets SET status = 'changes' WHERE id = ?").run(row.id);
  logActivity(project, 'user', 'feedback', `Feedback on ${key}: ${body.slice(0, 120)}`, key);
  emit({ type: 'feedback', project: project.id, asset: key });
}

export function updateFeedback(project: Project, id: number, input: { status?: 'open' | 'resolved'; reply?: string }, actor: 'user' | 'ai') {
  const item = useDb().prepare('SELECT f.*, a.key FROM feedback f JOIN assets a ON a.id = f.asset_id WHERE f.id = ? AND a.project_id = ?').get(id, project.id) as { key: string; reply: string } | undefined;
  if (!item) throw createError({ statusCode: 404, message: `Unknown feedback #${id}` });
  const status = input.status ?? 'resolved';
  useDb().prepare('UPDATE feedback SET status = ?, reply = ?, resolved_at = ? WHERE id = ?').run(status, input.reply?.trim() ?? item.reply, status === 'resolved' ? now() : null, id);
  if (actor === 'ai') logActivity(project, 'ai', 'feedback', `Resolved feedback #${id} on ${item.key}${input.reply ? `: ${input.reply.slice(0, 120)}` : ''}`, item.key);
  emit({ type: 'feedback', project: project.id, asset: item.key });
}

export function deleteFeedback(project: Project, id: number) {
  useDb().prepare('DELETE FROM feedback WHERE id = ? AND asset_id IN (SELECT id FROM assets WHERE project_id = ?)').run(id, project.id);
  emit({ type: 'feedback', project: project.id });
}

export function openFeedback(project: Project, key?: string) {
  return useDb().prepare(`
    SELECT f.id, a.key AS asset, a.width, a.height, f.revision, f.body, f.x, f.y, f.created_at
    FROM feedback f JOIN assets a ON a.id = f.asset_id
    WHERE a.project_id = ? AND f.status = 'open' AND (? IS NULL OR a.key = ?)
    ORDER BY f.created_at`).all(project.id, key ?? null, key ?? null) as { id: number; asset: string; width: number; height: number; revision: number; body: string; x: number | null; y: number | null }[];
}

// ---------- activity ----------

export function logActivity(project: Project | undefined, actor: 'user' | 'ai' | 'system', kind: string, message: string, asset?: string): void {
  useDb().prepare('INSERT INTO activity (project_id, actor, kind, message, asset, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(project?.id ?? null, actor, kind, message, asset ?? null, now());
  emit({ type: 'activity', project: project?.id });
}

export function listActivity(project: Project, limit = 200) {
  return useDb().prepare('SELECT * FROM activity WHERE project_id = ? ORDER BY id DESC LIMIT ?').all(project.id, limit);
}

// ---------- exports ----------

export async function listExports(project: Project) {
  const { exports } = dirs(project);
  const names = (await readdir(exports).catch(() => [] as string[])).filter((name) => !name.startsWith('.')).sort();
  const manifest = await readFile(path.join(exports, 'manifest.json'), 'utf8').then(JSON.parse).catch(() => null);
  return { dir: exports, files: names, manifest };
}

export const projectHasFolder = (project: Project) => existsSync(project.path);
