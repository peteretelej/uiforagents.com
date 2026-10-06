// Identity blocks load from the sibling identities repo at build time through
// the "#sibling" alias configured in astro.config.mjs (same ../ then ../../
// discovery as identities.mjs - no second path mechanism, no hardcoded slug
// list). Eager glob: every page renders statically, nothing ships to clients.
const modules = import.meta.glob("#sibling/*/blocks/*.tsx", { eager: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any;

// slug -> export name -> component (block files ship helpers too, e.g.
// dashboard-shell exports DashboardShell and StatBadge).
const bySlug: Record<string, Record<string, Block>> = {};
for (const [key, mod] of Object.entries(modules)) {
  const match = key.match(/\/([^/]+)\/blocks\/[^/]+\.tsx$/);
  if (!match) continue;
  const exports = mod as Record<string, Block>;
  const slug = match[1];
  Object.assign((bySlug[slug] ??= {}), exports);
}

export function getBlocks(slug: string): Record<string, Block> {
  return bySlug[slug] ?? {};
}
