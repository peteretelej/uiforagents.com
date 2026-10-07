/* uiforagents identity chrome: floating bar, quick search, "Use Identity"
   drawer. Self-contained on purpose - identity pages are standalone
   surfaces (artifact pages ARE the demo), so the chrome brings its own
   tokens and never touches the identity's styles. All classes ufa-.

   The page provides a single mount point carrying the identity's metadata
   as data attributes; this script renders the whole UI from it:

     <div class="ufa-chrome" data-slug=".." data-title=".." data-description=".."
          data-vibe="a,b" data-lane="artifact|react" data-lead="dark|light"
          data-version=".." data-license=".." data-install="npx ..."></div>

   Catalogue metadata (for search and prev/next) lives in IndexedDB, seeded
   from /identity-metadata.json with stale-while-revalidate. */
(() => {
  const mount = document.querySelector(".ufa-chrome[data-slug]");
  if (!mount) return;
  const slug = mount.dataset.slug;
  const lane = mount.dataset.lane ?? "react";
  const DB_NAME = "uiforagents";
  const STORE = "identities";
  const META_URL = "/identity-metadata.json";

  const ICONS = {
    home: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/></svg>`,
  };

  // --- Render the chrome -------------------------------------------------
  const shell = document.createElement("div");
  shell.innerHTML = `
  <nav class="ufa-bar" aria-label="Identity catalogue">
    <a class="ufa-btn" href="/" aria-label="uiforagents home">${ICONS.home}<span class="ufa-label">uiforagents</span></a>
    <span class="ufa-sep"></span>
    <button type="button" class="ufa-btn" data-ufa-search aria-haspopup="dialog">
      <span class="ufa-label">Search identities</span><span class="ufa-label-short">Search</span> <span class="ufa-kbd">/</span>
    </button>
    <span class="ufa-sep"></span>
    <a class="ufa-btn" data-ufa-prev aria-label="Previous identity">←</a>
    <a class="ufa-btn" data-ufa-next aria-label="Next identity">→</a>
    <span class="ufa-sep"></span>
    <button type="button" class="ufa-btn" data-ufa-use aria-haspopup="dialog">${ICONS.download}<span class="ufa-label">Use Identity</span><span class="ufa-label-short">Use</span></button>
  </nav>

  <div class="ufa-overlay" role="dialog" aria-modal="true" aria-label="Search identities">
    <div class="ufa-palette">
      <input type="search" placeholder="Search identities..." aria-label="Search identities" autocomplete="off">
      <div class="ufa-results"></div>
    </div>
  </div>

  <aside class="ufa-drawer" role="dialog" aria-modal="true" aria-label="Use this identity">
    <div class="ufa-drawer-head">
      <span class="ufa-title"></span>
      <button type="button" class="ufa-btn" data-ufa-close aria-label="Close">✕</button>
    </div>
    <div class="ufa-drawer-body"></div>
  </aside>`;
  mount.appendChild(shell);

  const bar = shell.querySelector(".ufa-bar");
  const overlay = shell.querySelector(".ufa-overlay");
  const drawer = shell.querySelector(".ufa-drawer");
  const drawerBody = shell.querySelector(".ufa-drawer-body");
  const input = shell.querySelector(".ufa-palette input");
  const results = shell.querySelector(".ufa-results");

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Usage instructions, lane-aware: this drawer IS the "how to use it" UI.
  function renderDrawer(meta) {
    shell.querySelector(".ufa-title").textContent = meta.title;
    const vibe = meta.vibe.map((t) => `<span class="ufa-chip">${esc(t)}</span>`).join("");
    const kv = lane === "artifact"
      ? `<div><dt>lane</dt><dd>pure-CSS artifact</dd></div>
         <div><dt>lead scheme</dt><dd>${esc(meta.leadScheme)}</dd></div>
         <div><dt>license</dt><dd>${esc(meta.license)}</dd></div>`
      : `<div><dt>lane</dt><dd>React · shadcn/ui</dd></div>
         <div><dt>version</dt><dd>${esc(meta.version)}</dd></div>
         <div><dt>license</dt><dd>${esc(meta.license)}</dd></div>`;
    const use = lane === "artifact"
      ? `<p class="ufa-agents">Agents: <code>npx skills add peteretelej/uiforagents</code>, then ask for this identity. Human? The steps below work without one.</p>
         <ol class="ufa-steps">
           <li><strong>Get the stylesheet.</strong> <pre>curl -O https://uiforagents.com/foundations/${esc(slug)}.css</pre> or <a href="https://uiforagents.com/foundations/${esc(slug)}.css">download foundation.css</a>.</li>
           <li><strong>Add it to your page.</strong> Paste the whole file into one <code>&lt;style&gt;</code> block in your page head, or link it with <code>&lt;link rel="stylesheet"&gt;</code>. No build step, no npm - one file is the entire system (tokens, base, components, print, both themes).</li>
           <li><strong>Attach the prompt-pack to your agent.</strong> <a href="/prompt-packs/${esc(slug)}.md">prompt-pack.md</a> is the binding design contract: the agent reads it and builds pages that look like this one, without improvising design.</li>
         </ol>
         <p class="ufa-note">This page is the identity's own demo, styled by that exact stylesheet. <a href="/demos/${esc(slug)}/">View the raw demo ↗</a></p>`
      : `<p class="ufa-agents">Agents: <code>npx skills add peteretelej/uiforagents</code>, then ask for this identity. Human? The steps below work without one.</p>
         <ol class="ufa-steps">
           <li><strong>Install it into your shadcn app.</strong> <pre>${esc(meta.install)}</pre> Or register the <code>@uiforagents</code> namespace once and install by name.</li>
           <li><strong>Attach the prompt-pack to your agent.</strong> <a href="/prompt-packs/${esc(slug)}.md">prompt-pack.md</a> is the binding design contract: fonts, color rules, density, motion, and do/don'ts. The agent follows it instead of improvising design.</li>
         </ol>
         <p class="ufa-note">Need the raw surfaces? <a href="/registries/${esc(slug)}/${esc(slug)}.json">registry payload</a> · <a href="/identities/${esc(slug)}.json">identity spec</a></p>`;
    drawerBody.innerHTML = `
      <p class="ufa-desc">${esc(meta.description)}</p>
      <div class="ufa-chips"><span class="ufa-chip">${esc(slug)}</span>${vibe}</div>
      <dl class="ufa-kv">${kv}</dl>
      <h4>Use this identity</h4>
      ${use}`;
  }

  // --- IndexedDB: identities metadata, cached across pages -------------
  function openDb() {
    return new Promise((resolve) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "slug" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  function idbAll(db) {
    if (!db) return Promise.resolve(null);
    return new Promise((resolve) => {
      const req = db.transaction(STORE).objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  function idbPutAll(db, records) {
    if (!db) return Promise.resolve();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const record of records) store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async function fetchMetadata() {
    const res = await fetch(META_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("metadata fetch failed");
    return res.json();
  }

  // Identities for retrieval: IndexedDB first (instant), then revalidate
  // from the static JSON in the background so updates propagate without
  // ever blocking the palette on the network.
  const identitiesReady = (async () => {
    const db = await openDb();
    let records = await idbAll(db);
    if (records && records.length > 0) {
      fetchMetadata()
        .then((fresh) => {
          const slugs = (list) => list.map((r) => r.slug).sort().join();
          if (fresh.length !== records.length || slugs(fresh) !== slugs(records)) {
            return idbPutAll(db, fresh);
          }
        })
        .catch(() => {});
      return records.sort((a, b) => a.title.localeCompare(b.title));
    }
    records = await fetchMetadata();
    await idbPutAll(db, records);
    return records.slice().sort((a, b) => a.title.localeCompare(b.title));
  })();

  // --- Prev / next ------------------------------------------------------
  identitiesReady.then((records) => {
    const idx = records.findIndex((r) => r.slug === slug);
    if (idx === -1) return;
    const prev = records[(idx - 1 + records.length) % records.length];
    const next = records[(idx + 1) % records.length];
    for (const [btn, target] of [
      [shell.querySelector("[data-ufa-prev]"), prev],
      [shell.querySelector("[data-ufa-next]"), next],
    ]) {
      if (!btn) continue;
      btn.href = `/identities/${target.slug}/`;
      btn.title = target.title;
    }
  });

  // --- Quick search palette --------------------------------------------
  let active = 0;
  let visible = [];

  function renderResults(records, query) {
    const q = query.trim().toLowerCase();
    visible = records
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.vibe.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 12);
    active = 0;
    if (visible.length === 0) {
      results.innerHTML = `<div class="ufa-empty">No identities match "${query.replace(/[<>&]/g, "")}".</div>`;
      return;
    }
    results.innerHTML = visible
      .map(
        (r, i) => `
      <a class="ufa-result${i === 0 ? " is-active" : ""}" href="/identities/${r.slug}/" data-i="${i}">
        <span class="ufa-dot" style="--ufa-accent:${r.accent}"></span>
        <span>
          <div class="ufa-name">${r.title}</div>
          <div class="ufa-slug">${r.slug}</div>
        </span>
        <span class="ufa-lane">${r.lane}</span>
      </a>`
      )
      .join("");
  }

  function setActive(i) {
    active = (i + visible.length) % visible.length;
    results.querySelectorAll(".ufa-result").forEach((el, j) => {
      el.classList.toggle("is-active", j === active);
      if (j === active) el.scrollIntoView({ block: "nearest" });
    });
  }

  function openPalette() {
    overlay.classList.add("is-open");
    input.value = "";
    identitiesReady.then((records) => renderResults(records, ""));
    input.focus();
  }

  function closePalette() {
    overlay.classList.remove("is-open");
    shell.querySelector("[data-ufa-search]")?.focus();
  }

  shell.querySelector("[data-ufa-search]")?.addEventListener("click", openPalette);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePalette();
  });
  input?.addEventListener("input", () => {
    identitiesReady.then((records) => renderResults(records, input.value));
  });
  input?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") {
      const chosen = visible[active];
      if (chosen) location.href = `/identities/${chosen.slug}/`;
    }
    else if (e.key === "Escape") closePalette();
  });

  // --- Use Identity drawer ------------------------------------------------
  shell.querySelector("[data-ufa-use]")?.addEventListener("click", () => {
    if (!drawerBody.dataset.filled) {
      renderDrawer({
        title: mount.dataset.title ?? slug,
        description: mount.dataset.description ?? "",
        vibe: (mount.dataset.vibe ?? "").split(",").filter(Boolean),
        leadScheme: mount.dataset.lead ?? "",
        version: mount.dataset.version ?? "",
        license: mount.dataset.license ?? "Apache-2.0",
        install: mount.dataset.install ?? "",
      });
      drawerBody.dataset.filled = "1";
    }
    drawer.classList.toggle("is-open");
  });
  shell.querySelector("[data-ufa-close]")?.addEventListener("click", () => {
    drawer.classList.remove("is-open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer?.classList.contains("is-open")) {
      drawer.classList.remove("is-open");
    }
  });

  // Open search on "/" or Cmd/Ctrl+K anywhere on the page.
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      openPalette();
    }
  });
})();
