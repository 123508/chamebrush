import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    emptyOutDir: false,
    minify: true,
    outDir: resolve(import.meta.dirname, "dist"),
    rollupOptions: {
      input: resolve(import.meta.dirname, "viewer.html"),
    },
  },
});
