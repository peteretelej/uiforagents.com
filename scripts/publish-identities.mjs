// Publishes the identity catalogue's agent surfaces into the build output:
// /registries/<slug>/ (shadcn registry item + per-slug index),
// /prompt-packs/<slug>.md, /identities/<slug>.json (identity specs), and
// /llms.txt (generated agent front door).
// The sibling identities repo is a read-only input: its plain files are the
// source for every surface; nothing inside the sibling is written.
import { cp, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { identitiesRoot, listIdentities, loadIdentities } from "../src/lib/identities.mjs";

const SITE_ROOT = pathToFileURL(process.cwd().replace(/\/?$/, "/"));
const SITE_URL = "https://uiforagents.com";
const dist = (rest) => fileURLToPath(new URL(`dist/${rest}`, SITE_ROOT));
const sibling = (rest) => fileURLToPath(new URL(rest, identitiesRoot()));

// 1-3. Per-identity static surfaces, copied byte-identical from the sibling.
// /registries/<slug>/<slug>.json is the canonical payload home; /r/<slug>.json
// is the flat alias the shadcn namespace template resolves (the CLI's
// String.replace substitutes only the first {name}, so the template must
// carry exactly one).
await mkdir(dist("prompt-packs"), { recursive: true });
await mkdir(dist("identities"), { recursive: true });
await mkdir(dist("r"), { recursive: true });
for (const slug of listIdentities()) {
  await mkdir(dist(`registries/${slug}`), { recursive: true });
  await cp(sibling(`identities/${slug}/registry/${slug}.json`), dist(`registries/${slug}/${slug}.json`));
  await cp(sibling(`identities/${slug}/registry/${slug}.json`), dist(`r/${slug}.json`));
  await cp(sibling(`identities/${slug}/registry/registry.json`), dist(`registries/${slug}/registry.json`));
  await cp(sibling(`identities/${slug}/prompt-pack.md`), dist(`prompt-packs/${slug}.md`));
  await cp(sibling(`identities/${slug}/identity.json`), dist(`identities/${slug}.json`));
}

// 4. llms.txt, generated from the catalogue so new identities appear
// automatically. The usage guide on the homepage is the canonical flow.
const installConfig = JSON.stringify(
  {
    registries: {
      "@uiforagents": `${SITE_URL}/r/{name}.json`,
    },
  },
  null,
  2
);
const llms = [
  "# uiforagents",
  "",
  "> Design identities for agent-built apps: complete, opinionated design systems on shadcn/ui (Tailwind v4), each shipped with the prompt-pack your agent follows.",
  "",
  "## Install",
  "",
  "Install an identity into any shadcn app by URL:",
  "",
  ...listIdentities().map((slug) => `- \`npx shadcn add ${SITE_URL}/r/${slug}.json\``),
  "",
  "Or register the namespace once in components.json, then install by name:",
  "",
  "```json",
  installConfig,
  "```",
  "",
  ...listIdentities().map((slug) => `- \`npx shadcn add @uiforagents/${slug}\``),
  "",
  "## Usage",
  "",
  "Attach the identity's prompt-pack to every agent building UI: it is the binding design contract. The full build-with-an-identity flow is the [usage guide](https://uiforagents.com/#how) on the homepage.",
  "",
  "## Identities",
  "",
  ...loadIdentities().flatMap(({ slug, spec }) => [
    `- [${spec.title}](${SITE_URL}/identities/${slug}/): ${spec.description}`,
    `  - Registry payload: ${SITE_URL}/registries/${slug}/${slug}.json`,
    `  - Prompt-pack: ${SITE_URL}/prompt-packs/${slug}.md`,
    `  - Identity spec: ${SITE_URL}/identities/${slug}.json`,
  ]),
  "",
  "## Agent surfaces",
  "",
  `- llms.txt: ${SITE_URL}/llms.txt`,
  "- GitHub: https://github.com/peteretelej/uiforagents",
];
await writeFile(dist("llms.txt"), llms.join("\n") + "\n");

const slugs = listIdentities();
console.log(`published: registries/{${slugs.join(",")}}/, r/{${slugs.join(",")}}.json, prompt-packs/{${slugs.join(",")}}.md, identities/{${slugs.join(",")}}.json, llms.txt`);
