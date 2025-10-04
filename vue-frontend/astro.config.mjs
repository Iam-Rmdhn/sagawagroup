import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.sagawagroup.id",
  base: "/",
  trailingSlash: "never",
  build: {
    format: "directory",
    assets: '_astro', // Assets folder dengan hash
  },
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    build: {
      // Generate hash untuk semua assets agar cache busting otomatis
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
      // Minify untuk production
      minify: 'esbuild',
      cssMinify: true,
      // Source maps untuk debugging
      sourcemap: false,
    },
    // CSS Code splitting
    css: {
      devSourcemap: false,
    },
  },
  integrations: [tailwind()],
});
