export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  const key = keyParam(event);
  const { revision } = await readBody<{ revision: number }>(event);
  const svg = revisionSvg(project, key, Number(revision));
  const result = await saveReviewed(project, key, svg, { source: 'restore', note: `Restored revision ${revision}` });
  logActivity(project, 'user', 'restore', `${key} restored to rev ${revision} (now rev ${result.revision})`, key);
  return { revision: result.revision };
});
