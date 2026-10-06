# uiforagents-site

Source for [uiforagents.com](https://uiforagents.com), the identity catalogue for
[uiforagents](https://github.com/peteretelej/uiforagents) - design identities for
agent-built apps: complete design systems on shadcn/ui, shipped with the
prompt-pack your agent follows.

## Status

Live catalogue: landing gallery, three identity pages (ocean-calm, nairobi-noon,
graphite-terminal) with their full block suites, the launch post, and statically
published agent surfaces (llms.txt, registries, prompt-packs, identity specs).

## Develop

```sh
npm install
npm run dev       # astro dev
npm run build     # astro build + publish agent surfaces into dist/
npm run preview   # serve dist/
```

The build reads the sibling identities repo (checked out or cloned next to this
directory as `uiforagents/`; CI recreates the same layout). It is a read-only
input read as plain files: identities, prompt-packs, and registry payloads come
from it. No install is needed in the sibling repo.

Pipeline: Astro static output + Cloudflare Workers Static Assets (wrangler).

## Publishing

`npm run build` publishes:

- `/llms.txt` (generated agent front door: catalogue, install, surface index)
- per identity `<slug>`:
  - `/registries/<slug>/<slug>.json` + `/registries/<slug>/registry.json` (shadcn
    registry item and index)
  - `/prompt-packs/<slug>.md` (raw agent prompt-pack)
  - `/identities/<slug>.json` (identity spec)

## License

Apache-2.0, matching the uiforagents identity suite. Upstream projects flow
through with their own notices: shadcn/ui (MIT), Tailwind CSS (MIT), and
Base UI (MIT).
