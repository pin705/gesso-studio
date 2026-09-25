export default defineEventHandler((event) => sendSvg(event, revisionSvg(projectParam(event), keyParam(event), Number(getRouterParam(event, 'n')))));
