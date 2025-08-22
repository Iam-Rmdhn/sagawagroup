import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default defineConfig({
  integrations: [tailwind()],
  build: {
    inlineStylesheets: 'auto',
  },
  server: {
    port: 4321,
    host: true,
    hmr: {
      port: 4322,
      overlay: false
    }
  },
  vite: {
    server: {
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**']
      }
    },
    build: {
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['astro', 'tailwindcss'],
            ui: ['../components/Navbar.astro', '../components/Footer.astro'],
          },
        },
      },
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          cssnano({
            preset: 'default',
          }),
        ],
      },
    },
    ssr: {
      noExternal: ['some-package-that-needs-bundling'],
    },
  },
});

