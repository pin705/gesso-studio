export default defineEventHandler(async (event) => ({ topic: getRouterParam(event, 'topic'), markdown: await readTopic(getRouterParam(event, 'topic') ?? '') }));
