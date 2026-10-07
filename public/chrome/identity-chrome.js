/* uiforagents identity chrome behavior: catalogue metadata lives in
   IndexedDB (seeded from /identity-metadata.json, stale-while-revalidate),
   powering quick search and prev/next on artifact identity pages.
   The artifact page itself is the identity's demo document; this script
   only drives the injected ufa- chrome. */
(() => {
  const bar = document.querySelector(".ufa-bar");
  if (!bar) return;
  const slug = bar.dataset.slug;
  const DB_NAME = "uiforagents";
  const STORE = "identities";
  const META_URL = "/identity-metadata.json";

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
      [bar.querySelector("[data-ufa-prev]"), prev],
      [bar.querySelector("[data-ufa-next]"), next],
    ]) {
      if (!btn) continue;
      btn.href = `/identities/${target.slug}/`;
      btn.title = target.title;
    }
  });

  // --- Quick search palette --------------------------------------------
  const overlay = document.querySelector(".ufa-overlay");
  const input = overlay?.querySelector("input");
  const results = overlay?.querySelector(".ufa-results");
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
    bar.querySelector("[data-ufa-search]")?.focus();
  }

  bar.querySelector("[data-ufa-search]")?.addEventListener("click", openPalette);
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

  // --- About drawer ------------------------------------------------------
  const drawer = document.querySelector(".ufa-drawer");
  bar.querySelector("[data-ufa-about]")?.addEventListener("click", () => {
    drawer.classList.toggle("is-open");
  });
  drawer?.querySelector("[data-ufa-close]")?.addEventListener("click", () => {
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
