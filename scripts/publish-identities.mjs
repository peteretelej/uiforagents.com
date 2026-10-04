// Publishes the identity catalogue's agent surfaces into the build output:
// /demo/ (the sibling example app, one bundle, ?identity= switching),
// /registries/<slug>/ (shadcn registry item + per-slug index),
// /prompt-packs/<slug>.md, and /identities/<slug>.json (identity specs).
// The sibling identities repo is a read-only input: the example app builds
// straight into the site's dist/, so nothing inside the sibling is written.
import { cp, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { identitiesRoot, listIdentities } from "../src/lib/identities.mjs";

const SITE_ROOT = pathToFileURL(process.cwd().replace(/\/?$/, "/"));
const dist = (rest) => fileURLToPath(new URL(`dist/${rest}`, SITE_ROOT));
const sibling = (rest) => fileURLToPath(new URL(rest, identitiesRoot()));

// 1. Demo bundle: vite build with the output aimed at dist/demo. Run with the
// sibling example app's cwd so its config and aliases resolve; use the
// identities repo's own vite install.
const exampleDir = sibling("example/");
const viteBin = sibling("node_modules/.bin/vite");
if (!existsSync(viteBin)) {
  throw new Error("vite not found in the identities repo - run `npm ci` there first");
}
console.log("building demo bundle (example app) -> dist/demo ...");
execFileSync(viteBin, ["build", "--outDir", dist("demo"), "--emptyOutDir"], {
  cwd: exampleDir,
  stdio: "inherit",
});

// 2-4. Per-identity static surfaces.
await mkdir(dist("prompt-packs"), { recursive: true });
await mkdir(dist("identities"), { recursive: true });
for (const slug of listIdentities()) {
  await mkdir(dist(`registries/${slug}`), { recursive: true });
  await cp(sibling(`identities/${slug}/registry/${slug}.json`), dist(`registries/${slug}/${slug}.json`));
  await cp(sibling(`identities/${slug}/registry/registry.json`), dist(`registries/${slug}/registry.json`));
  await cp(sibling(`identities/${slug}/prompt-pack.md`), dist(`prompt-packs/${slug}.md`));
  await cp(sibling(`identities/${slug}/identity.json`), dist(`identities/${slug}.json`));
}

const slugs = listIdentities();
console.log(`published: demo/, registries/{${slugs.join(",")}}/, prompt-packs/{${slugs.join(",")}}.md, identities/{${slugs.join(",")}}.json`);
