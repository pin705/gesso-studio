export interface LiveEvent {
  type: 'project' | 'asset' | 'feedback' | 'activity' | 'bible' | 'export' | 'ping';
  project?: string;
  asset?: string;
}

const listeners = new Set<(event: LiveEvent) => void>();
const connected = ref(false);
let source: EventSource | undefined;

function connect() {
  if (source || import.meta.server) return;
  source = new EventSource('/api/events');
  source.onopen = () => (connected.value = true);
  source.onerror = () => (connected.value = false);
  source.onmessage = (message) => {
    const event = JSON.parse(message.data) as LiveEvent;
    if (event.type !== 'ping') for (const listener of listeners) listener(event);
  };
}

/** Run `handler` whenever the server reports a change (the agent saved, the user commented…). */
export function useLive(handler?: (event: LiveEvent) => void) {
  connect();
  if (handler) {
    onMounted(() => listeners.add(handler));
    onBeforeUnmount(() => listeners.delete(handler));
  }
  return { connected };
}
