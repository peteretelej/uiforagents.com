# uiforagents-site

Source for [uiforagents.com](https://uiforagents.com), the identity catalogue for
[uiforagents](https://github.com/peteretelej/uiforagents) - design identities for
agent-built apps: complete design systems on shadcn/ui, shipped with the
prompt-pack your agent follows.

## Status

Live catalogue: landing gallery, three identity pages (ocean-calm, nairobi-noon,
graphite-terminal) with a working demo, the launch post, and statically published
agent surfaces (registries, prompt-packs, identity specs).

## Develop

```sh
npm install
npm run dev       # astro dev (the /demo iframe needs a build; run one first)
npm run build     # astro build + publish demo/registries/prompt-packs into dist/
npm run preview   # serve dist/
```

The build reads the sibling identities repo (checked out or cloned next to this
directory as `uiforagents/`; CI recreates the same layout). It is a read-only
input: identities, prompt-packs, and registry payloads are read from it, and the
example app builds straight into `dist/demo/`. The example app needs its
dependencies installed in the sibling repo first (`npm ci` there).

Pipeline: Astro static output + Cloudflare Workers Static Assets (wrangler).

## Publishing

`npm run build` publishes, per identity `<slug>`:

- `/registries/<slug>/<slug>.json` + `/registries/<slug>/registry.json` (shadcn
  registry item and index)
- `/prompt-packs/<slug>.md` (raw agent prompt-pack)
- `/identities/<slug>.json` (identity spec)
- `/demo/` (the shared example app; identity switching via `?identity=<slug>`)

## License

Apache-2.0, matching the uiforagents identity suite. Upstream projects flow
through with their own notices: shadcn/ui (MIT), Tailwind CSS (MIT), and
Base UI (MIT).
