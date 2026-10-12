import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { identitiesRoot } from "./lib/identities.mjs";

// Agent prompt-packs, read straight from the sibling identities repo
// (glob() loads from anywhere on the filesystem). Entry ids are the identity
// slugs: <slug>/prompt-pack.md -> <slug>.
const promptPacks = defineCollection({
  loader: glob({
    pattern: "*/prompt-pack.md",
    // Absolute file URL, not a bare path: the loader resolves base with
    // new URL(base, config.root), and a Windows path like D:\... parses
    // "D:" as a URL scheme and dies in fileURLToPath.
    base: new URL("identities/", identitiesRoot()).href,
    generateId: ({ entry }) => entry.split("/")[0],
  }),
});

export const collections = { promptPacks };
