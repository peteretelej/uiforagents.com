// Publishes the identity catalogue's agent surfaces into the build output,
// per lane: React identities get /registries/<slug>/ (shadcn registry item +
// per-slug index), /r/<slug>.json, and /identities/<slug>.json (identity
// specs). Artifact identities get /foundations/<slug>.css, /demos/<slug>/
// (the raw standalone demo), and - critically - /identities/<slug>/ itself:
// the identity page IS the demo document, generated here from demo.html with
// a floating catalogue chrome (search / prev-next / about drawer) injected
// around it. The demo file is never modified; the chrome is an overlay.
// All lanes get /prompt-packs/<slug>.md, /identity-metadata.json (the
// catalogue metadata the chrome caches in IndexedDB), and /llms.txt.
// The sibling identities repo is a read-only input: its plain files are the
// source for every surface; nothing inside the sibling is written.
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { identitiesRoot, loadIdentities } from "../src/lib/identities.mjs";

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
await mkdir(dist("r"), { recursive: true });
await mkdir(dist("identities"), { recursive: true });
await mkdir(dist("foundations"), { recursive: true });
const identities = loadIdentities();
for (const { slug, lane } of identities) {
  await cp(sibling(`identities/${slug}/prompt-pack.md`), dist(`prompt-packs/${slug}.md`));
  if (lane === "artifact") {
    await cp(sibling(`identities/${slug}/foundation.css`), dist(`foundations/${slug}.css`));
    await mkdir(dist(`demos/${slug}`), { recursive: true });
    await cp(sibling(`identities/${slug}/demo.html`), dist(`demos/${slug}/index.html`));
  } else {
    await mkdir(dist(`registries/${slug}`), { recursive: true });
    await cp(sibling(`identities/${slug}/registry/${slug}.json`), dist(`registries/${slug}/${slug}.json`));
    await cp(sibling(`identities/${slug}/registry/${slug}.json`), dist(`r/${slug}.json`));
    await cp(sibling(`identities/${slug}/registry/registry.json`), dist(`registries/${slug}/registry.json`));
    await cp(sibling(`identities/${slug}/identity.json`), dist(`identities/${slug}.json`));
  }
}

// 3b. Artifact identity pages: the demo document, published as the identity
// page with the catalogue chrome overlaid. Injection is string-level on the
// generated output only - the sibling's demo.html stays byte-identical, and
// /demos/<slug>/ above still serves the untouched original. The chrome
// itself ships from public/chrome/ (shared with the React-lane pages).

for (const identity of identities.filter((i) => i.lane === "artifact")) {
  const { slug, spec, leadScheme } = identity;
  const demo = await readFile(sibling(`identities/${slug}/demo.html`), "utf8");
  const bar = `
<link rel="stylesheet" href="/chrome/identity-chrome.css">
<div class="ufa-chrome" data-slug="${slug}" data-lane="artifact"
     data-title="${spec.title}" data-description="${spec.description}"
     data-vibe="${spec.vibe.join(",")}" data-lead="${leadScheme}"
     data-license="Apache-2.0"></div>
<script src="/chrome/identity-chrome.js" defer></script>
</body>`;
  const page = demo.replace("</body>", () => bar);
  await mkdir(dist(`identities/${slug}`), { recursive: true });
  await writeFile(dist(`identities/${slug}/index.html`), page);
}

// 3c. Catalogue metadata: one static JSON the chrome seeds into IndexedDB.
const metadata = identities.map(({ slug, lane, leadScheme, spec, palette }) => ({
  slug,
  title: spec.title,
  description: spec.description,
  lane,
  vibe: spec.vibe,
  leadScheme,
  accent: palette.primary,
}));
await writeFile(dist("identity-metadata.json"), JSON.stringify(metadata, null, 2) + "\n");

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
const reactSlugs = identities.filter((i) => i.lane === "react").map((i) => i.slug);
const artifactSlugs = identities.filter((i) => i.lane === "artifact").map((i) => i.slug);
const llms = [
  "# uiforagents",
  "",
  "> Design identities for agent-built apps: complete, opinionated design systems, each shipped with the prompt-pack your agent follows. React-lane identities install into shadcn apps; artifact identities are copy-in pure CSS.",
  "",
  "## Install",
  "",
  "React-lane identities install into any shadcn app by URL:",
  "",
  ...reactSlugs.map((slug) => `- \`npx shadcn add ${SITE_URL}/r/${slug}.json\``),
  "",
  "Or register the namespace once in components.json, then install by name:",
  "",
  "```json",
  installConfig,
  "```",
  "",
  ...reactSlugs.map((slug) => `- \`npx shadcn add @uiforagents/${slug}\``),
  "",
  "Artifact-lane identities are copy-in pure CSS - no install step. Fetch the stylesheet, paste or link it, and attach the prompt-pack:",
  "",
  ...artifactSlugs.map((slug) => `- \`curl -O ${SITE_URL}/foundations/${slug}.css\``),
  "",
  "## Usage",
  "",
  "Attach the identity's prompt-pack to every agent building UI: it is the binding design contract. The full build-with-an-identity flow is the [usage guide](https://uiforagents.com/#how) on the homepage.",
  "",
  "## Identities",
  "",
  ...identities.flatMap(({ slug, spec, lane }) => [
    `- [${spec.title}](${SITE_URL}/identities/${slug}/): ${spec.description}`,
    `  - Prompt-pack: ${SITE_URL}/prompt-packs/${slug}.md`,
    ...(lane === "artifact"
      ? [
          `  - Foundation CSS: ${SITE_URL}/foundations/${slug}.css`,
          `  - Demo: ${SITE_URL}/demos/${slug}/`,
        ]
      : [
          `  - Registry payload: ${SITE_URL}/registries/${slug}/${slug}.json`,
          `  - Identity spec: ${SITE_URL}/identities/${slug}.json`,
        ]),
  ]),
  "",
  "## Agent surfaces",
  "",
  `- llms.txt: ${SITE_URL}/llms.txt`,
  "- GitHub: https://github.com/peteretelej/uiforagents",
];
await writeFile(dist("llms.txt"), llms.join("\n") + "\n");

console.log(`published: registries/{${reactSlugs.join(",")}}/, r/{${reactSlugs.join(",")}}.json, identities/{${reactSlugs.join(",")}}.json, prompt-packs/{${identities.map((i) => i.slug).join(",")}}.md, foundations/{${artifactSlugs.join(",")}}.css, demos/{${artifactSlugs.join(",")}}/, identities/{${artifactSlugs.join(",")}}/ (demo pages + chrome), identity-metadata.json, llms.txt`);
