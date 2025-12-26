/* /editor.js
   GeoTourismZim — CMS Editor (static friendly)
   Purpose: edit destinations, export JSON, and paste into /data.js
*/

(() => {
  "use strict";

  const listEl = document.getElementById("list");
  const form = document.getElementById("form");
  const statusEl = document.getElementById("status");
  const out = document.getElementById("output");
  const searchEl = document.getElementById("search");
  const countEl = document.getElementById("count");

  const addNew = document.getElementById("addNew");
  const loadFromDataJs = document.getElementById("loadFromDataJs");
  const downloadJson = document.getElementById("downloadJson");
  const copyJson = document.getElementById("copyJson");
  const importFile = document.getElementById("importFile");
  const resetEditor = document.getElementById("resetEditor");
  const delBtn = document.getElementById("delete");

  const imgPreview = document.getElementById("imgPreview");

  // In-editor dataset
  let data = [];
  let activeId = null;

  /* =========================
     Utilities
     ========================= */

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeCommaList(str) {
    return String(str || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function safeId(base) {
    const id = String(base || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return id || `destination-${Math.floor(Math.random() * 100000)}`;
  }

  function setFormEnabled(enabled) {
    if (!form) return;
    form.querySelectorAll("input, textarea, button").forEach(el => {
      if (el.id === "delete") return;
      el.disabled = !enabled;
    });
    if (delBtn) delBtn.disabled = !enabled;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function setPreview(url) {
    if (!imgPreview) return;

    const u = String(url || "").trim();
    if (!u) {
      imgPreview.removeAttribute("src");
      imgPreview.style.display = "none";
      imgPreview.onerror = null;
      return;
    }

    imgPreview.style.display = "block";
    imgPreview.src = u;

    // If the path is wrong, hide preview quietly (no noisy errors in UI)
    imgPreview.onerror = () => {
      imgPreview.style.display = "none";
      imgPreview.onerror = null;
    };
  }

  function currentJSON() {
    // Stable output ordering
    const sorted = [...data].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return JSON.stringify(sorted, null, 2);
  }

  function dedupeIds(list) {
    const seen = new Set();
    return list.map(item => {
      let id = item.id;
      while (seen.has(id)) id = `${id}-${Math.floor(Math.random() * 1000)}`;
      seen.add(id);
      return { ...item, id };
    });
  }

  function normalizeImported(parsed) {
    // Accept:
    // 1) [ ... ]
    // 2) { destinations: [ ... ] }
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.destinations)) return parsed.destinations;
    throw new Error("Invalid JSON. Expected an array or { destinations: [...] }");
  }

  function sanitizeDestination(raw) {
    const r = raw || {};
    const id = safeId(r.id || r.name);
    const name = String(r.name || "Untitled destination").trim();

    const lat = Number(r.lat);
    const lng = Number(r.lng);

    const bestTime = String(r.bestTime || "").trim();
    const estimatedBudget = String(r.estimatedBudget || "").trim();

    const tags = Array.isArray(r.tags) ? r.tags.filter(Boolean).map(String) : normalizeCommaList(r.tags);
    const highlights = Array.isArray(r.highlights) ? r.highlights.filter(Boolean).map(String) : normalizeCommaList(r.highlights);

    const gallery =
      Array.isArray(r.gallery)
        ? r.gallery.filter(Boolean).map(String)
        : normalizeCommaList(r.gallery);

    return {
      id,
      name,
      region: String(r.region || "").trim(),
      type: String(r.type || "").trim(),
      summary: String(r.summary || "").trim(),
      heroImage: String(r.heroImage || "").trim(),
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      bestTime,
      estimatedBudget,
      stayHint: String(r.stayHint || "").trim(),
      tags,
      highlights,
      gallery
    };
  }

  /* =========================
     Rendering
     ========================= */

  function renderList() {
    const q = String(searchEl?.value || "").trim().toLowerCase();

    const filtered = data.filter(d => {
      if (!q) return true;
      const blob = [
        d.id,
        d.name,
        d.region,
        d.type,
        d.summary,
        ...(d.tags || []),
        ...(d.highlights || [])
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });

    if (countEl) countEl.textContent = String(filtered.length);

    if (!listEl) return;

    listEl.innerHTML =
      filtered
        .map(d => `
          <button class="item ${d.id === activeId ? "is-active" : ""}"
                  type="button"
                  data-id="${esc(d.id)}"
                  aria-label="Edit ${esc(d.name)}">
            <strong>${esc(d.name)}</strong>
            <div class="muted">${esc(d.region)} • ${esc(d.type)}</div>
          </button>
        `)
        .join("") || `<div class="muted">No matches.</div>`;

    if (out) out.value = currentJSON();
  }

  function setActive(id) {
    activeId = id;
    const d = data.find(x => x.id === id);

    if (!d) {
      setStatus("Select a destination from the list.");
      if (form) form.reset();
      setFormEnabled(false);
      setPreview("");
      renderList();
      return;
    }

    setStatus(`Editing: ${d.name}`);
    setFormEnabled(true);

    // Map form fields
    form.elements.id.value = d.id || "";
    form.elements.name.value = d.name || "";
    form.elements.region.value = d.region || "";
    form.elements.type.value = d.type || "";
    form.elements.summary.value = d.summary || "";
    form.elements.heroImage.value = d.heroImage || "";
    form.elements.lat.value = Number.isFinite(d.lat) ? String(d.lat) : "";
    form.elements.lng.value = Number.isFinite(d.lng) ? String(d.lng) : "";
    form.elements.bestTime.value = d.bestTime || "";
    form.elements.estimatedBudget.value = d.estimatedBudget || "";
    form.elements.stayHint.value = d.stayHint || "";
    form.elements.tags.value = (d.tags || []).join(", ");
    form.elements.highlights.value = (d.highlights || []).join(", ");
    form.elements.gallery.value = (d.gallery || []).join(", ");

    setPreview(d.heroImage || "");
    renderList();
  }

  function seedFromSite() {
    // Prefer site data.js if present: window.DESTINATIONS
    const from = Array.isArray(window.DESTINATIONS) ? window.DESTINATIONS : null;

    if (!from) {
      // fallback: minimal seed
      data = [
        {
          id: "victoria-falls",
          name: "Victoria Falls (Mosi-oa-Tunya)",
          region: "Matabeleland North",
          type: "Nature",
          summary: "Iconic waterfall and adventure hub with strong tour infrastructure.",
          heroImage: "assets/images/destinations/victoria-falls.jpg",
          lat: -17.9243,
          lng: 25.8572,
          bestTime: "Apr–Oct",
          estimatedBudget: "$$–$$$",
          stayHint: "Victoria Falls Town",
          tags: ["UNESCO", "Adventure", "Day trips"],
          highlights: ["Falls viewpoints", "Zambezi sunset cruise", "Gorge activities"],
          gallery: [
            "assets/images/destinations/victoria-falls.jpg"
          ]
        }
      ];
      activeId = null;
      setStatus("Loaded sample data (site data.js not detected).");
      renderList();
      setActive(null);
      return;
    }

    data = dedupeIds(from.map(sanitizeDestination));
    activeId = null;
    setStatus(`Loaded ${data.length} destination(s) from site data.js.`);
    renderList();
    setActive(null);
  }

  /* =========================
     Events
     ========================= */

  if (listEl) {
    listEl.addEventListener("click", (e) => {
      const item = e.target.closest("[data-id]");
      if (!item) return;
      setActive(item.getAttribute("data-id"));
    });
  }

  if (searchEl) searchEl.addEventListener("input", () => renderList());

  if (addNew) {
    addNew.addEventListener("click", () => {
      const id = safeId(`new-destination-${Math.floor(Math.random() * 100000)}`);
      const d = {
        id,
        name: "New Destination",
        region: "",
        type: "",
        summary: "",
        heroImage: "assets/images/destinations/your-image.jpg",
        lat: null,
        lng: null,
        bestTime: "",
        estimatedBudget: "",
        stayHint: "",
        tags: [],
        highlights: [],
        gallery: []
      };

      data.unshift(d);
      setActive(id);
    });
  }

  // Live preview when heroImage changes
  if (form && form.elements.heroImage) {
    form.elements.heroImage.addEventListener("input", () => {
      setPreview(form.elements.heroImage.value);
    });
  }

  if (loadFromDataJs) {
    loadFromDataJs.addEventListener("click", () => {
      try {
        seedFromSite();
      } catch (err) {
        setStatus(`Load error: ${String(err?.message || err)}`);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!activeId) return;

      const idx = data.findIndex(x => x.id === activeId);
      if (idx < 0) return;

      const newId = safeId(form.elements.id.value);
      if (newId !== activeId && data.some(x => x.id === newId)) {
        setStatus(`Error: ID "${newId}" already exists. Choose a unique ID.`);
        return;
      }

      const latRaw = String(form.elements.lat.value || "").trim();
      const lngRaw = String(form.elements.lng.value || "").trim();

      const lat = latRaw === "" ? null : Number(latRaw);
      const lng = lngRaw === "" ? null : Number(lngRaw);

      const updated = {
        id: newId,
        name: String(form.elements.name.value || "").trim(),
        region: String(form.elements.region.value || "").trim(),
        type: String(form.elements.type.value || "").trim(),
        summary: String(form.elements.summary.value || "").trim(),
        heroImage: String(form.elements.heroImage.value || "").trim(),
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        bestTime: String(form.elements.bestTime.value || "").trim(),
        estimatedBudget: String(form.elements.estimatedBudget.value || "").trim(),
        stayHint: String(form.elements.stayHint.value || "").trim(),
        tags: normalizeCommaList(form.elements.tags.value),
        highlights: normalizeCommaList(form.elements.highlights.value),
        gallery: normalizeCommaList(form.elements.gallery.value)
      };

      data[idx] = updated;
      activeId = updated.id;

      setStatus(`Saved: ${updated.name}`);
      setPreview(updated.heroImage);
      renderList();
      setActive(activeId);
    });
  }

  if (delBtn) {
    delBtn.addEventListener("click", () => {
      if (!activeId) return;
      const idx = data.findIndex(x => x.id === activeId);
      if (idx < 0) return;

      const removed = data.splice(idx, 1)[0];
      activeId = null;

      setStatus(`Deleted: ${removed.name}`);
      renderList();
      setActive(null);
    });
  }

  if (downloadJson) {
    downloadJson.addEventListener("click", () => {
      const blob = new Blob([currentJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "geotourismzim-destinations.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("Downloaded JSON.");
    });
  }

  if (copyJson) {
    copyJson.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(currentJSON());
        setStatus("Copied JSON to clipboard.");
      } catch {
        setStatus("Copy failed. Select the output text and copy manually.");
      }
    });
  }

  if (importFile) {
    importFile.addEventListener("change", async () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const arr = normalizeImported(parsed);

        data = dedupeIds(arr.map(sanitizeDestination));
        activeId = null;

        setStatus(`Imported ${data.length} destination(s).`);
        renderList();
        setActive(null);
      } catch (err) {
        setStatus(`Import error: ${String(err?.message || err)}`);
      } finally {
        importFile.value = "";
      }
    });
  }

  if (resetEditor) {
    resetEditor.addEventListener("click", () => {
      seedFromSite();
    });
  }

  /* =========================
     Init
     ========================= */

  // Initial load: pull from site data.js if present, else fallback seed
  seedFromSite();
})();
