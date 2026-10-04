// @ts-check
import { defineConfig } from "astro/config";

// Static output only: the site deploys as plain files on R2 (no adapter, no SSR).
export default defineConfig({
  output: "static",
  markdown: {
    // Dual Shiki themes; prompt-packs and code samples render through this.
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
});
