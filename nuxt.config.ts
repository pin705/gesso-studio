import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  // A local studio: the browser renders everything, the Nitro server owns files, SQLite and MCP.
  ssr: false,
  devtools: { enabled: false },
  modules: ['shadcn-nuxt', '@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  shadcn: { prefix: '', componentDir: '@/components/ui' },
  colorMode: { classSuffix: '', preference: 'dark', fallback: 'dark', storageKey: 'gesso-color-mode' },
  app: {
    head: {
      title: 'Gesso',
      meta: [{ name: 'description', content: 'The open-source game art studio where your AI is the artist.' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },
  nitro: {
    serverAssets: [
      { baseName: 'knowledge', dir: dir('./knowledge') },
      { baseName: 'samples', dir: dir('./examples') }
    ]
  },
  typescript: { strict: true }
});
