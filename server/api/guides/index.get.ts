export default defineEventHandler(async () => ({ index: await readTopic('README'), topics: await knowledgeTopics() }));
