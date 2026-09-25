// MCP over Streamable HTTP, stateless: every POST carries JSON-RPC and gets JSON back.
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    setResponseHeader(event, 'allow', 'POST');
    throw createError({ statusCode: 405, message: 'Use POST for MCP requests.' });
  }
  const body = await readBody(event);
  const context = { project: getQuery(event).project?.toString(), origin: getRequestURL(event).origin };
  const messages = Array.isArray(body) ? body : [body];
  const responses = (await Promise.all(messages.map((message) => handleRpc(message, context)))).filter(Boolean);
  if (!responses.length) {
    setResponseStatus(event, 202);
    return '';
  }
  return Array.isArray(body) ? responses : responses[0];
});
