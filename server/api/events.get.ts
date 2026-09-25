// Server-sent events: the studio refreshes whatever changed, the moment the agent saves.
export default defineEventHandler((event) => {
  const stream = createEventStream(event);
  const off = subscribe((change) => void stream.push(JSON.stringify(change)));
  const ping = setInterval(() => void stream.push(JSON.stringify({ type: 'ping' })), 25_000);
  stream.onClosed(() => {
    off();
    clearInterval(ping);
  });
  return stream.send();
});
