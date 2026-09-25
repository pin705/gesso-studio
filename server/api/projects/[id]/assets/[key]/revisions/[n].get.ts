// Old revisions are served from /api, so point relative <image href> (mockups) back at the project's assets.
export default defineEventHandler((event) => {
  const project = projectParam(event);
  const svg = revisionSvg(project, keyParam(event), Number(getRouterParam(event, 'n')));
  const rebased = svg.replace(/(\s(?:href|src)=")(?!https?:|data:|#|\/)/g, `$1/files/${project.id}/assets/`);
  return detectFormat(svg) === 'html' ? sendHtml(event, rebased) : sendSvg(event, rebased);
});
