import path from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { studioHandler } from './mcp/http.js';

// `npm run dev` previews GAME_ART_PROJECT (default: the bundled showcase) with hot reload of the studio UI.
const project = path.resolve(process.env.GAME_ART_PROJECT ?? 'examples/showcase');

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'game-art-project',
      configureServer(server) {
        server.middlewares.use(studioHandler({ project }));
      }
    }
  ],
  server: { port: 5173 }
});
