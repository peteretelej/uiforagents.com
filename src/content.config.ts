import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { fileURLToPath } from "node:url";
import { identitiesRoot } from "./lib/identities.mjs";

// Agent prompt-packs, read straight from the sibling identities repo
// (glob() loads from anywhere on the filesystem). Entry ids are the identity
// slugs: <slug>/prompt-pack.md -> <slug>.
const promptPacks = defineCollection({
  loader: glob({
    pattern: "*/prompt-pack.md",
    base: fileURLToPath(new URL("identities/", identitiesRoot())),
    generateId: ({ entry }) => entry.split("/")[0],
  }),
});

export const collections = { promptPacks };
