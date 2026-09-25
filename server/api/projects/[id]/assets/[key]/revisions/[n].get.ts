// Old revisions are served from /api, so point relative <image href> (mockups) back at the project's assets.
export default defineEventHandler((event) => {
  const project = projectParam(event);
  const svg = revisionSvg(project, keyParam(event), Number(getRouterParam(event, 'n')));
  return sendSvg(event, svg.replace(/(\shref=")(?!https?:|data:|#|\/)/g, `$1/files/${project.id}/assets/`));
});
