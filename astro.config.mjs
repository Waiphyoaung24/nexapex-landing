import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.nexapex.ai',
  integrations: [react(), sitemap()],
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  vite: {
    css: {
      postcss: './postcss.config.mjs',
    },
    server: {
      allowedHosts: true,
    },
  },
});
