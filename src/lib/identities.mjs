// Build-time readers for the sibling identities repo (a read-only input).
// Paths resolve against the site root via process.cwd(), never import.meta.url
// (bundled chunks live in dist/, which would break relative resolution).
// CI checks out `site/` + `uiforagents/` side by side; the phase worktree
// lives one directory deeper (.worktrees/<branch>/), so the sibling sits one
// level further up there - try both and keep the first that exists.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SITE_ROOT = pathToFileURL(process.cwd().replace(/\/?$/, "/"));

export function identitiesRoot() {
  for (const up of ["../", "../../"]) {
    const root = new URL(`${up}uiforagents/`, SITE_ROOT);
    if (existsSync(new URL("identities/", root))) return root;
  }
  throw new Error(
    "Sibling identities repo not found: expected uiforagents/ next to the site checkout"
  );
}

export function identityPath(slug, ...rest) {
  return fileURLToPath(new URL(`identities/${slug}/${rest.join("/")}`, identitiesRoot()));
}

// Slugs come from the directory listing, never a hardcoded list.
export function listIdentities() {
  const dir = fileURLToPath(new URL("identities/", identitiesRoot()));
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

// Pull the palette a card needs out of the scoped token block in theme.css.
// Every identity declares these in its token block (nairobi-noon and
// graphite-terminal intentionally skip :root; ocean-calm keeps it).
function readPalette(slug) {
  const css = readFileSync(identityPath(slug, "theme/theme.css"), "utf8");
  const names = ["background", "foreground", "card", "border", "primary", "identity-gradient-to"];
  const palette = {};
  for (const name of names) {
    const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
    palette[name] = match ? match[1].trim() : "";
  }
  return palette;
}

export function loadIdentity(slug) {
  const spec = JSON.parse(readFileSync(identityPath(slug, "identity.json"), "utf8"));
  return {
    slug,
    spec,
    palette: readPalette(slug),
    registryItem: JSON.parse(readFileSync(identityPath(slug, "registry", `${slug}.json`), "utf8")),
  };
}

export function loadIdentities() {
  return listIdentities().map(loadIdentity);
}
