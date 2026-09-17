import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@chamebrush/language": resolve(import.meta.dirname, "packages/language/src/index.ts"),
      "@chamebrush/core": resolve(import.meta.dirname, "packages/core/src/index.ts"),
      "@chamebrush/renderer-svg": resolve(import.meta.dirname, "packages/renderer-svg/src/index.ts"),
      "@chamebrush/browser": resolve(import.meta.dirname, "packages/browser/src/index.ts"),
    },
  },
});
