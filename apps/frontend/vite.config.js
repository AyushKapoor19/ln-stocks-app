import { defineConfig } from "vite";

export default defineConfig({
  root: ".", // default
  publicDir: "public", // serves /public as static
  server: { port: 5173 },
  build: { outDir: "dist" },
});
