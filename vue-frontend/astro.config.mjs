import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.sagawagroup.id',
  base: '/',
  trailingSlash: 'never',
  build: {
    format: 'directory'
  },
  server: {
    port: 4321,
    host: true
  }
});

