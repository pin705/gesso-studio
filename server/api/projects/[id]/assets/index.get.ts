export default defineEventHandler((event) => listAssets(projectParam(event)).map(({ nine_slice, ...asset }) => ({ ...asset, nineSlice: nine_slice ? JSON.parse(nine_slice) : null })));
