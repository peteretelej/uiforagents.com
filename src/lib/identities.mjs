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

// Two lanes share the catalogue: artifact identities are copy-in pure CSS
// whose foundation.css is the entire system; React identities ship theme/
// plus blocks and install through the shadcn registry. Anything else is a
// half-built folder and must fail loudly.
export function isReactLane(slug) {
  if (existsSync(identityPath(slug, "foundation.css"))) return false;
  if (existsSync(identityPath(slug, "theme/"))) return true;
  throw new Error(
    `Identity "${slug}" is neither artifact lane (no foundation.css) nor React lane (no theme/)`
  );
}

// Artifact identities ship no identity.json: the site owns their catalogue
// metadata here (single source). The spec fields and lead color scheme feed
// the cards, the identity pages, and the publish script's llms.txt.
const ARTIFACT_SPECS = {
  "reading-room": {
    title: "Reading Room",
    description:
      "Warm editorial reader for long-form artifacts - articles, briefings, reports. Paper background, Charter-led serif text, green accent; one pure-CSS stylesheet, both themes, no JavaScript.",
    vibe: ["editorial", "long-form", "light"],
    leadScheme: "light",
  },
  "midnight-bulletin": {
    title: "Midnight Bulletin",
    description:
      "Dark-first briefing bulletin for data-dense artifacts - status one-pagers, incident reports, lab writeups. Warm near-black ground, amber accent, serif display over sans body, mono labels.",
    vibe: ["briefing", "data-dense", "dark"],
    leadScheme: "dark",
  },
};

// Lane policy: an artifact foundation must pin its lead scheme (:root
// color-scheme is a single value, never `light dark`), and the metadata
// map above must agree with it. Keeps themes intentional as the lane grows.
function assertArtifactLeadScheme(slug, lead) {
  const css = readFileSync(identityPath(slug, "foundation.css"), "utf8");
  const match = css.match(/color-scheme:\s*([^;]+);/);
  const scheme = match && match[1].trim();
  if (scheme !== lead) {
    throw new Error(
      `${slug}: foundation.css pins color-scheme "${scheme}", expected lead scheme "${lead}"`
    );
  }
}

// Pull the palette a card needs out of the scoped token block in theme.css.// Every identity declares these in its token block (nairobi-noon and
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

// Artifact palette: the card's keys mapped onto the foundation's shared
// semantic vocabulary, values copied verbatim (light-dark() stays unresolved;
// the card's color-scheme resolves it to the lead side).
function readArtifactPalette(slug) {
  const css = readFileSync(identityPath(slug, "foundation.css"), "utf8");
  const tokens = {
    background: "bg",
    foreground: "ink",
    card: "surface",
    border: "line",
    primary: "accent",
    "identity-gradient-to": "accent-soft",
  };
  const palette = {};
  for (const [name, token] of Object.entries(tokens)) {
    const match = css.match(new RegExp(`--${token}:\\s*([^;]+);`));
    palette[name] = match ? match[1].trim() : "";
  }
  return palette;
}

// React themes declare their lead color scheme (artifact foundations pin
// their lead scheme in :root the same way; nothing follows the OS).
function readLeadScheme(slug) {
  const css = readFileSync(identityPath(slug, "theme/theme.css"), "utf8");
  const match = css.match(/color-scheme:\s*([^;]+);/);
  return match && match[1].trim() === "dark" ? "dark" : "light";
}

export function loadIdentity(slug) {
  if (!isReactLane(slug)) {
    const meta = ARTIFACT_SPECS[slug];
    if (!meta) {
      throw new Error(`Artifact identity "${slug}" has no site metadata in src/lib/identities.mjs`);
    }
    return {
      slug,
      lane: "artifact",
      leadScheme: (assertArtifactLeadScheme(slug, meta.leadScheme), meta.leadScheme),
      spec: { title: meta.title, description: meta.description, vibe: meta.vibe },
      palette: readArtifactPalette(slug),
    };
  }
  const spec = JSON.parse(readFileSync(identityPath(slug, "identity.json"), "utf8"));
  return {
    slug,
    lane: "react",
    leadScheme: readLeadScheme(slug),
    spec,
    palette: readPalette(slug),
    registryItem: JSON.parse(readFileSync(identityPath(slug, "registry", `${slug}.json`), "utf8")),
  };
}

export function loadIdentities() {
  return listIdentities().map(loadIdentity);
}
