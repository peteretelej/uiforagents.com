import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// Per-component docs twins, generated kit surfaces consumed as source. The
// kit checkout is a pinned sibling (relative path keeps CI identical).
const components = defineCollection({
  loader: glob({ pattern: "*.md", base: "../uiforagents/docs/components" }),
});

export const collections = { components };
