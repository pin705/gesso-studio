export default defineEventHandler(async (event) => {
  const project = projectParam(event);
  return { ...project, missing: !projectHasFolder(project), artBible: await readBible(project), folders: dirs(project) };
});
