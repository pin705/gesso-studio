/** In-process event bus feeding the studio's SSE stream. One server process owns all writes, so this is enough. */
export interface GessoEvent {
  type: 'project' | 'asset' | 'feedback' | 'activity' | 'bible' | 'export';
  project?: string;
  asset?: string;
}

const listeners = new Set<(event: GessoEvent) => void>();

export function emit(event: GessoEvent): void {
  for (const listener of listeners) listener(event);
}

export function subscribe(listener: (event: GessoEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
