import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(import.meta.dirname),
  plugins: [react()],
  resolve: {
    alias: {
      "@chamebrush/language": resolve(import.meta.dirname, "../../packages/language/src/index.ts"),
      "@chamebrush/core": resolve(import.meta.dirname, "../../packages/core/src/index.ts"),
      "@chamebrush/renderer-svg": resolve(import.meta.dirname, "../../packages/renderer-svg/src/index.ts"),
      "@chamebrush/browser": resolve(import.meta.dirname, "../../packages/browser/src/index.ts"),
    },
  },
  server: {
    port: 4173,
  },
  build: {
    outDir: resolve(import.meta.dirname, "../../dist/playground"),
    emptyOutDir: true,
    license: {
      fileName: "third-party-licenses.md",
    },
  },
});
