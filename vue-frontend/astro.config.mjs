import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.sagawagroup.id",
  base: "/",
  trailingSlash: "never",
  build: {
    format: "directory",
  },
  server: {
    port: 4321,
    host: true,
  },
  integrations: [tailwind()],
});
