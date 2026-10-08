// Content-hashed URLs for the latin woff2 subsets behind the site's
// @fontsource CSS imports, so layouts can emit <link rel="preload"> tags
// that resolve to the same emitted assets the @font-face rules reference
// (Vite emits each file once and dedupes both consumers). Weights kept in
// sync with those imports: site pages import inter 400-700 plus
// plus-jakarta-sans 600-800; the identity entry (FONT_IMPORTS in
// astro.config.mjs) adds lilita-one 400 and jetbrains-mono 400/600/700.
import inter400 from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff2?url";
import inter600 from "@fontsource/inter/files/inter-latin-600-normal.woff2?url";
import inter700 from "@fontsource/inter/files/inter-latin-700-normal.woff2?url";
import jakarta600 from "@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2?url";
import jakarta700 from "@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2?url";
import jakarta800 from "@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2?url";
import lilita400 from "@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff2?url";
import jbmono400 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url";
import jbmono600 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2?url";
import jbmono700 from "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2?url";

const FILES: Record<string, Record<number, string>> = {
  inter: { 400: inter400, 500: inter500, 600: inter600, 700: inter700 },
  "plus-jakarta-sans": { 600: jakarta600, 700: jakarta700, 800: jakarta800 },
  "lilita-one": { 400: lilita400 },
  "jetbrains-mono": { 400: jbmono400, 600: jbmono600, 700: jbmono700 },
};

type Family = keyof typeof FILES;

// Weights each family paints at in the first viewport, per role. Display
// headings render at 700-800 (families without an 800 face match down to
// 700 per CSS font matching), sans at 400-600 (body, nav links, header
// cta/semibold labels), mono at 600 (block labels; graphite-terminal's
// overrides set buttons, th, and badges to mono 600).
const ROLE_WEIGHTS: Record<"display" | "sans" | "mono", Partial<Record<Family, number[]>>> = {
  display: { inter: [700], "plus-jakarta-sans": [700, 800], "lilita-one": [400], "jetbrains-mono": [700] },
  sans: { inter: [400, 500, 600] },
  mono: { "jetbrains-mono": [600] },
};

// First quoted family in a CSS font stack, mapped to its package key; system
// stacks (ui-monospace etc.) return null and contribute no preloads.
function webFamily(stack: string): Family | null {
  const name = stack.toLowerCase().match(/"([^"]+)"/)?.[1] ?? "";
  const family = name.replaceAll(" ", "-");
  return family in FILES ? (family as Family) : null;
}

function pick(family: Family | null, role: "display" | "sans" | "mono"): string[] {
  if (!family) return [];
  return (ROLE_WEIGHTS[role][family] ?? []).map((weight) => FILES[family][weight]);
}

// First-paint set for site-chrome pages: header + hero only. Inter 700 and
// Plus Jakarta Sans 600 paint below the fold there, so they stay on plain
// swap instead of competing for early bandwidth.
export const sitePreloads: string[] = [
  ...pick("inter", "sans"),
  ...pick("plus-jakarta-sans", "display"),
];

// Identity pages resolve their families from the theme token block
// (identityFonts in identities.mjs reads the same tokens the page styles do).
export function identityPreloads(fonts: { display: string; sans: string; mono: string }): string[] {
  return [
    ...new Set([
      ...pick(webFamily(fonts.display), "display"),
      ...pick(webFamily(fonts.sans), "sans"),
      ...pick(webFamily(fonts.mono), "mono"),
    ]),
  ];
}
