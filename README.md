# uiforagents-site

Source for [uiforagents.com](https://uiforagents.com), the docs + marketing
site for [uiforagents](https://github.com/peteretelej/uiforagents), the
registry-shaped, agent-first vanilla UI kit - built with the kit itself.

## Status

In build. A static Astro site: every page is live kit components, restyleable
through a visitor-facing direction switcher.

## Develop

```sh
npm install
npm run dev       # astro dev
npm run build     # astro build + pagefind + agent surfaces into dist/
npm run preview   # serve dist/
```

The kit is consumed through the per-project flow (`uiforagents.json` +
`node ../uiforagents/scripts/uifa.mjs`); generated output (`src/ui/`,
`src/styles/tokens.css`, `docs/design-system.md`) is committed, never
hand-edited.
