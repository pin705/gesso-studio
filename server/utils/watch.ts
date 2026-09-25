import { type FSWatcher, watch } from 'node:fs';

const watchers = new Map<string, { close(): void }[]>();

/** Agents with file tools may edit SVGs directly; pick those edits up as revisions. */
export function watchProject(project: Project): void {
  unwatchProject(project);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sync = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const current = findProject(project.id);
      if (!current) return;
      for (const key of await syncProject(current)) {
        logActivity(current, 'system', 'disk', `${key} changed on disk`, key);
        emit({ type: 'asset', project: current.id, asset: key });
      }
    }, 250);
  };
  const list: FSWatcher[] = [];
  try {
    list.push(watch(dirs(project).assets, sync));
  } catch {
    // folder not created yet; the next sync or save creates it
  }
  try {
    list.push(watch(project.path, (_, name) => name === 'STYLE.md' && emit({ type: 'bible', project: project.id })));
  } catch {
    // project folder missing
  }
  watchers.set(project.id, [...list, { close: () => clearTimeout(timer) }]);
}

export function unwatchProject(project: Project): void {
  for (const watcher of watchers.get(project.id) ?? []) watcher.close();
  watchers.delete(project.id);
}
