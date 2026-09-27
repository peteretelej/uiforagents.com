// @ts-check
import { defineConfig } from "astro/config";

// Static output only: the site deploys as plain files on R2 (no adapter, no SSR).
export default defineConfig({
  output: "static",
  markdown: {
    // Dual Shiki themes; dark directions flip via a generated style in the layout.
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
});
