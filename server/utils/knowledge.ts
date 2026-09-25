import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const knowledge = () => useStorage('assets:knowledge');

export async function knowledgeTopics(): Promise<string[]> {
  const keys = await knowledge().getKeys();
  return keys.filter((key) => key.endsWith('.md') && key !== 'README.md').map((key) => key.slice(0, -3).replaceAll(':', '/')).sort();
}

export async function readTopic(topic: string): Promise<string> {
  if (topic !== 'README' && !(await knowledgeTopics()).includes(topic)) throw createError({ statusCode: 404, message: `Unknown guide: ${topic}` });
  return String(await knowledge().getItem(`${topic.replaceAll('/', ':')}.md`));
}

/** Critique anchor sheets (knowledge/anchors/*.jpg): real assets placed at scores 2, 3 and 4. */
export async function anchorSheets(): Promise<Buffer[]> {
  const keys = (await knowledge().getKeys('anchors')).filter((key) => key.endsWith('.jpg')).sort();
  return Promise.all(keys.map(async (key) => {
    const raw = await knowledge().getItemRaw(key);
    return typeof raw === 'string' ? Buffer.from(raw) : Buffer.from(raw as Uint8Array);
  }));
}

/** Bundled example projects: folder name and the title line of their art bible. */
export async function listSamples(): Promise<{ name: string; title: string }[]> {
  const samples = useStorage('assets:samples');
  const names = [...new Set((await samples.getKeys()).map((key) => key.split(':')[0]!))].sort();
  return Promise.all(names.map(async (name) => ({ name, title: String((await samples.getItem(`${name}:STYLE.md`)) ?? name).split('\n')[0]!.replace(/^#\s*/, '').replace(/ - Art Bible$/, '') })));
}

/** Copy a bundled example into the data folder and register it. */
export async function installSample(name = 'meadow-farm'): Promise<Project> {
  if (!(await listSamples()).some((sample) => sample.name === name)) throw createError({ statusCode: 404, message: `Unknown sample: ${name}` });
  const samples = useStorage('assets:samples');
  const target = path.join(dataDir(), 'samples', name);
  for (const key of (await samples.getKeys(name)).filter((key) => !key.split(':').includes('exports'))) {
    const file = path.join(target, ...key.split(':').slice(1));
    await mkdir(path.dirname(file), { recursive: true });
    const raw = await samples.getItemRaw(key);
    await writeFile(file, typeof raw === 'string' ? raw : Buffer.from(raw as Uint8Array));
  }
  const project = await addProject(target, (await listSamples()).find((sample) => sample.name === name)?.title ?? name);
  return touchProject(project);
}
