import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
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
