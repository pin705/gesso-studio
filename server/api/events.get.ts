// Server-sent events: the studio refreshes whatever changed, the moment the agent saves.
// Written straight to the Node response so headers go out immediately (EventSource needs them to report "open").
export default defineEventHandler((event) => {
  const { req, res } = event.node;
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  res.write(': connected\n\n');
  const off = subscribe((change) => res.write(`data: ${JSON.stringify(change)}\n\n`));
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
  return new Promise<void>((resolve) =>
    req.on('close', () => {
      off();
      clearInterval(ping);
      resolve();
    })
  );
});
