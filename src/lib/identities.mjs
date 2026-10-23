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
// Vibe tags are a controlled search vocabulary - looks, feels, and use cases
// a buyer would actually type (see the kit AGENTS.md rule). Lead use cases
// with the common word (dashboard) and keep the specialty alongside it
// (ops, monitoring, tracker); reuse before coining; up to five per identity.
const ARTIFACT_SPECS = {
  "espresso-panel": {
    title: "Espresso Panel",
    description:
      "Amber instrument panel on warm black - readout walls, dot-matrix fills, bracket states, ticker tape, one phosphor hue, all-mono type. A retro terminal instrument, not an ops dashboard; one pure-CSS stylesheet, both themes, no JavaScript.",
    vibe: ["dark", "terminal", "retro", "dashboard", "monitoring"],
    leadScheme: "dark",
  },
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
    vibe: ["dark", "data-dense", "dashboard", "briefing"],
    leadScheme: "dark",
  },
  "listening-room": {
    title: "Listening Room",
    description:
      "Dark-first listening surface for spoken-audio artifacts - podcast episodes, narrated reports, briefings with a voice. Warm near-black ground, amber action accent, Charter-led serif prose, waveform scrubber, synced transcript and chapter grid; one pure-CSS stylesheet, both themes, sanctioned player module.",
    vibe: ["dark", "audio", "podcast", "narration", "transcript"],
    leadScheme: "dark",
  },
  "night-ops": {
    title: "Night Ops",
    description:
      "Dark ops console for live dashboards - KPI strips, chart frames, log streams, health rows, LED state pills. Cool near-black ground, azure action accent, mono counts; one pure-CSS stylesheet, both themes, no JavaScript.",
    vibe: ["dark", "data-dense", "dashboard", "ops"],
    leadScheme: "dark",
  },
  "paper-ledger": {
    title: "Paper Ledger",
    description:
      "Light print-precision analytics - statements, cost audits, ledgers. Cool paper ground, ink-blue accent, accounting double rules, tabular mono figures, print that survives grayscale; one pure-CSS stylesheet, both themes, no JavaScript.",
    vibe: ["light", "ledger", "print"],
    leadScheme: "light",
  },
  "tally-board": {
    title: "Tally Board",
    description:
      "Warm personal tracker for habits, budgets, and goals - bento cards, progress tracks, target ticks, rings, streak heat, ok/warn-only pills, friendly voice. Cream and terracotta, rounded numerals; one pure-CSS stylesheet, both themes, no JavaScript.",
    vibe: ["light", "warm", "dashboard", "tracker"],
    leadScheme: "light",
  },
  "weissraum": {
    title: "Weissraum",
    description:
      "Light Swiss portfolio system for studio sites, case studies, about pages, and one-page briefs. Paper-white canvas, near-black grotesk display at poster scale, hairline structure, uppercase mono micro-labels, one red accent that only appears when it has a job; one pure-CSS stylesheet, no JavaScript.",
    vibe: ["light", "editorial", "portfolio", "minimal"],
    leadScheme: "light",
  },
  "ivory-desk": {
    title: "Ivory Desk",
    description:
      "Calm light AI console for assistant workspaces, research answers, briefs, and AI product pages. Warm oat-ivory paper, a serif that speaks and a grotesk that works, IBM Plex Mono for everything the machine produced, one clay accent, the full model machinery: composer, stream, tool cards, citations, meters; one pure-CSS stylesheet, light-only.",
    vibe: ["light", "calm", "technical", "briefing"],
    leadScheme: "light",
  },
  "dither-lab": {
    title: "Dither Lab",
    description:
      "Dark 1-bit pixel workshop for creative-tool pages, dev-tool landings, release-note zines, and event pages. Blue-black canvas, four-color rotational bit-palette, bitmap display type, dithered checker fills, stepped motion; retro-computing craft with none of the web3 neon; one pure-CSS stylesheet, dark-only.",
    vibe: ["dark", "retro", "technical", "landing"],
    leadScheme: "dark",
  },
  "city-edition": {
    title: "City Edition",
    description:
      "Dense morning daily for front pages, section fronts, article pages, digests, and press announcements. Flat newsprint, ink serif headlines, kicker-deck-byline stack on every story card, hairline rules with heavy masthead rules, a rationed press-red signal, agate mono for datelines and indexes; one pure-CSS stylesheet, light-only.",
    vibe: ["light", "editorial", "print", "long-form"],
    leadScheme: "light",
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

// Font families an identity's theme declares, for font preloading. System
// stacks pass through untouched; the fonts lib maps web families to files.
export function identityFonts(slug) {
  const css = readFileSync(identityPath(slug, "theme/theme.css"), "utf8");
  const token = (name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim() ?? "";
  return { display: token("font-display"), sans: token("font-sans"), mono: token("font-mono") };
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

// Curated catalogue order, strongest and most broadly useful first: the
// homepage grid, llms.txt, identity-metadata.json, and the demo chrome's
// prev/next all read loadIdentities(). Presentation lives here, not in
// identity.json (artifact lane has none). Must name every directory exactly
// once - the build fails on drift so a new identity can't ship unranked.
const CATALOGUE_ORDER = [
  "ocean-calm",
  "night-ops",
  "paper-ledger",
  "midnight-bulletin",
  "listening-room",
  "reading-room",
  "graphite-terminal",
  "ivory-desk",
  "tally-board",
  "weissraum",
  "portico-row",
  "frost-field",
  "espresso-panel",
  "nairobi-noon",
  "sticker-press",
  "dither-lab",
  "cobalt-quorum",
  "city-edition",
];

export function loadIdentities() {
  const slugs = listIdentities();
  const missing = slugs.filter((slug) => !CATALOGUE_ORDER.includes(slug));
  const unknown = CATALOGUE_ORDER.filter((slug) => !slugs.includes(slug));
  const dupes = CATALOGUE_ORDER.filter((slug, i) => CATALOGUE_ORDER.indexOf(slug) !== i);
  if (missing.length > 0 || unknown.length > 0 || dupes.length > 0) {
    const parts = [];
    if (missing.length > 0) parts.push(`missing from the list: ${missing.join(", ")}`);
    if (unknown.length > 0) parts.push(`not on disk: ${unknown.join(", ")}`);
    if (dupes.length > 0) parts.push(`listed more than once: ${dupes.join(", ")}`);
    throw new Error(`CATALOGUE_ORDER in src/lib/identities.mjs is stale (${parts.join("; ")})`);
  }
  return CATALOGUE_ORDER.map(loadIdentity);
}
