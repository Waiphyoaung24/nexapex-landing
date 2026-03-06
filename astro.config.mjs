import { defineConfig } from 'astro/config';

export default defineConfig({
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
