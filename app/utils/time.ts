const now = ref(Date.now());
if (import.meta.client) setInterval(() => (now.value = Date.now()), 30_000);

const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const steps: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60]];

/** "3 minutes ago", re-evaluated every 30 s through one shared clock. */
export function timeAgo(timestamp: number): string {
  const seconds = (timestamp - now.value) / 1000;
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  return 'just now';
}
