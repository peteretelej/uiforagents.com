// Build-time readers for the pinned sibling kit checkout. Paths are resolved
// against the site root (the process cwd for dev/build), never import.meta.url
// (bundled chunks live in dist/, which would break relative resolution). The
// relative `../uiforagents` keeps local and CI builds identical (CI checks out
// the kit at a released tag into the sibling path).
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SITE_ROOT = fileURLToPath(pathToFileURL(process.cwd().replace(/\/?$/, "/")));
export const KIT_ROOT = fileURLToPath(new URL("../uiforagents/", pathToFileURL(SITE_ROOT)));

export function kitFile(path) {
  return readFileSync(`${KIT_ROOT}${path}`, "utf8");
}

// llms.txt is the kit's one-line-per-component agent index; the site's
// component index and sidebar are generated from its data. Returns groups in
// file order: [{ category, items: [{ name, title, description, variants, behavior }] }].
export function loadLlmsGroups() {
  const groups = [];
  let heading = null;
  for (const line of kitFile("llms.txt").split("\n")) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) heading = h2[1];
    const item = line.match(/^- ([a-z0-9-]+) \| (.+)$/);
    if (!item) continue;
    const [title, description, variants, behavior] = item[2].split(" | ").map((s) => s.trim());
    const variantList = variants.replace(/^data-variant:\s*/, "");
    if (!groups.some((g) => g.category === heading)) groups.push({ category: heading, items: [] });
    groups
      .find((g) => g.category === heading)
      .items.push({
        name: item[1],
        title,
        description,
        variants: variantList === "none" ? [] : variantList.split(" / ").map((v) => v.replace(/\*$/, "")),
        behavior: behavior.replace(/^behavior:\s*/, ""),
      });
  }
  return groups;
}

// Ordered oldest-first by the kit's build-index; rendered newest-first.
export function loadChangelog() {
  return JSON.parse(kitFile("changelog.json"));
}
