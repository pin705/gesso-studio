export default defineEventHandler((event) => listActivity(projectParam(event), Math.min(500, Number(getQuery(event).limit) || 200)));
