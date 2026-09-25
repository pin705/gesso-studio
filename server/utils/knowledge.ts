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

/** Copy the bundled showcase into the data folder and register it. */
export async function installSample(): Promise<Project> {
  const samples = useStorage('assets:samples');
  const target = path.join(dataDir(), 'samples', 'showcase');
  for (const key of await samples.getKeys('showcase')) {
    const file = path.join(target, ...key.split(':').slice(1));
    await mkdir(path.dirname(file), { recursive: true });
    const raw = await samples.getItemRaw(key);
    await writeFile(file, typeof raw === 'string' ? raw : Buffer.from(raw as Uint8Array));
  }
  const project = await addProject(target, 'Showcase');
  return touchProject(project);
}
