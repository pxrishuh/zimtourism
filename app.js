/* /app.js
   GeoTourismZim — main SPA (static)
   Requires: /config.js and /data.js loaded before this file
*/

(() => {
  "use strict";

  const outlet = document.getElementById("viewOutlet");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const jumpShop = document.getElementById("jumpShop");
  const jumpDeals = document.getElementById("jumpDeals");
  const jumpExport = document.getElementById("jumpExport");

  const quickMetrics = document.getElementById("quickMetrics");
  const quickHighlights = document.getElementById("quickHighlights");

  // Drawer
  const drawer = document.getElementById("drawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawerClose = document.getElementById("drawerClose");
  const drawerTitle = document.getElementById("drawerTitle");
  const drawerBody = document.getElementById("drawerBody");

  // Data + Config
  const CFG = window.GEOZIM_CONFIG || {};
  const DESTS = Array.isArray(window.DESTINATIONS) ? window.DESTINATIONS : [];

  // Leaflet
  const hasLeaflet = typeof window.L !== "undefined";

  // Map state
  let map = null;
  let markersLayer = null;

  // App state
  const state = {
    view: "destinations",

    // Destinations filters
    q: "",
    region: "All",
    type: "All",

    // Map filter
    mapType: "All",

    // Itineraries (kept minimal; you can expand later)
    itinerarySelections: new Set(),

    // Shop cache
    products: null,

    // Export builder
    exportMode: "product", // product | selected
    productBuildId: "golden-triangle-7-budget"
  };

  /* =========================
     Utils
     ========================= */

  function esc(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function normalizeStr(x) {
    return String(x || "").trim().toLowerCase();
  }

  function uniqSorted(arr) {
    return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
  }

  function regions() {
    return ["All", ...uniqSorted(DESTS.map(d => d.region))];
  }

  function types() {
    return ["All", ...uniqSorted(DESTS.map(d => d.type))];
  }

  function icon(name) {
    // Inline SVG icons (no extra deps)
    // Keep small + consistent
    switch (name) {
      case "search":
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" stroke-width="2"/>
          <path d="M17 17l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      case "pin":
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" stroke-width="2"/>
        </svg>`;
      case "hotel":
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 22V3h10v19" stroke="currentColor" stroke-width="2"/>
          <path d="M14 12h6v10" stroke="currentColor" stroke-width="2"/>
          <path d="M7 6h4M7 9h4M7 12h4M7 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      case "ticket":
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V8Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 7v10" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
        </svg>`;
      case "pdf":
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2"/>
          <path d="M14 3v3h3" stroke="currentColor" stroke-width="2"/>
          <path d="M8 14h8M8 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      default:
        return "";
    }
  }

  function utmParams(extra = {}) {
    const a = (CFG.analytics || {});
    const base = {
      utm_source: a.utmSource || "geotourismzim",
      utm_medium: a.utmMedium || "affiliate",
      utm_campaign: a.utmCampaign || "zim-core"
    };
    return { ...base, ...extra };
  }

  function buildUrl(base, params) {
    const u = new URL(base);
    Object.entries(params || {}).forEach(([k, v]) => {
      const sv = String(v ?? "").trim();
      if (sv) u.searchParams.set(k, sv);
    });
    return u.toString();
  }

  function hotelAffiliateUrl(dest) {
    const aff = CFG.affiliate || {};
    const base = aff.hotelSearchBaseUrl || "https://www.booking.com/searchresults.html";
    const p = {
      ...(aff.hotelAffiliateParams || {}),
      ...utmParams({ utm_content: dest.id }),
      ss: dest.stayHint || dest.name
    };
    return buildUrl(base, p);
  }

  function toursAffiliateUrl(dest) {
    const tours = (CFG.affiliate || {}).tours || {};
    const base = tours.baseUrl || "https://www.getyourguide.com/";
    const key = tours.affiliateParamKey || "partner_id";
    const val = tours.affiliateParamValue || "";
    const p = {
      ...utmParams({ utm_content: dest.id }),
      [key]: val,
      q: dest.name
    };
    return buildUrl(base, p);
  }

  async function loadProducts() {
    if (state.products) return state.products;
    const res = await fetch("products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    state.products = await res.json();
    return state.products;
  }

  function openDrawer(title, html) {
    drawerTitle.textContent = title;
    drawerBody.innerHTML = html;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerTitle.textContent = "Details";
    drawerBody.innerHTML = "";
    document.body.style.overflow = "";
  }

  function setView(view) {
    state.view = view;

    tabs.forEach(t => {
      const on = t.dataset.view === view;
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });

    render();

    // Map boot
    if (view === "map") initMap();
  }

  /* =========================
     Hero metrics
     ========================= */

  function renderHeroSnapshot(productsDoc) {
    const productsCount = productsDoc?.products?.length ?? 0;

    if (quickMetrics) {
      quickMetrics.innerHTML = `
        <div class="metric"><div class="metric__label">Destinations</div><div class="metric__value">${DESTS.length}</div></div>
        <div class="metric"><div class="metric__label">Map Points</div><div class="metric__value">${DESTS.filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lng)).length}</div></div>
        <div class="metric"><div class="metric__label">Shop Products</div><div class="metric__value">${productsCount}</div></div>
        <div class="metric"><div class="metric__label">CTAs</div><div class="metric__value">Hotels + Tours</div></div>
      `;
    }

    const highlights = [
      "High-intent pages for affiliate conversion (Hotels + Tours).",
      "Sellable PDF exports (itineraries, checklists, logistics).",
      "Interactive map for route planning and discovery.",
      "Consultation funnel for complex trips."
    ];

    if (quickHighlights) {
      quickHighlights.innerHTML = highlights.map(h => `<li>${esc(h)}</li>`).join("");
    }
  }

  /* =========================
     Filtering
     ========================= */

  function matchesDest(d) {
    const q = normalizeStr(state.q);
    const regionOk = state.region === "All" || d.region === state.region;
    const typeOk = state.type === "All" || d.type === state.type;

    if (!q) return regionOk && typeOk;

    const blob = [
      d.id,
      d.name,
      d.region,
      d.type,
      d.summary,
      ...(d.tags || []),
      ...(d.highlights || [])
    ].join(" ").toLowerCase();

    return regionOk && typeOk && blob.includes(q);
  }

  /* =========================
     Views
     ========================= */

  function renderDestinations() {
    const regionOpts = regions()
      .map(r => `<option value="${esc(r)}"${r === state.region ? " selected" : ""}>${esc(r)}</option>`)
      .join("");

    const typeOpts = types()
      .map(t => `<option value="${esc(t)}"${t === state.type ? " selected" : ""}>${esc(t)}</option>`)
      .join("");

    const filtered = DESTS.filter(matchesDest);

    return `
      <div class="section-title">
        <h2>Destinations</h2>
        <div class="muted">Search, filter, and open a destination for booking CTAs.</div>
      </div>

      <div class="card glass">
        <div class="controls">
          <div style="display:flex; align-items:center; gap:10px;">
            <span aria-hidden="true" class="muted">${icon("search")}</span>
            <input class="input" id="destQuery" placeholder="Search (UNESCO, safari, Falls, Mana, heritage…)" value="${esc(state.q)}" />
          </div>

          <select class="select" id="destRegion" aria-label="Filter by region">${regionOpts}</select>
          <select class="select" id="destType" aria-label="Filter by type">${typeOpts}</select>

          <button class="btn" id="destReset" type="button">Reset</button>
        </div>

        <div class="muted" style="margin-top:10px;">
          Showing <strong>${filtered.length}</strong> result(s).
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:14px;">
        ${filtered.map(renderDestinationCard).join("") || `
          <div class="card">
            <strong>No matches.</strong>
            <div class="muted">Try removing filters.</div>
          </div>
        `}
      </div>
    `;
  }

  function renderDestinationCard(d) {
    const img = esc(d.heroImage || "");
    const tags = (d.tags || []).slice(0, 6).map(t => `<span class="tag">${esc(t)}</span>`).join("");

    return `
      <article class="card dest-card" role="button" tabindex="0" data-open-dest="${esc(d.id)}" aria-label="Open ${esc(d.name)} details">
        <div class="dest-img" aria-hidden="true">
          <div class="dest-img__fill" style="background-image:url('${img}');"></div>
          <div class="dest-img__shade"></div>
          <div class="dest-img__label">
            <span style="display:inline-flex; align-items:center; gap:8px;">
              ${icon("pin")} ${esc(d.region)}
            </span>
          </div>
        </div>

        <div class="dest-meta">
          <h3>${esc(d.name)}</h3>
          <div class="muted"><strong>Type:</strong> ${esc(d.type)} • <strong>Base:</strong> ${esc(d.stayHint || "—")}</div>
          <div class="muted" style="margin-top:8px;">${esc(d.summary || "")}</div>
          <div class="tags">${tags}</div>
        </div>
      </article>
    `;
  }

  function renderDestinationDetail(d) {
    const hotelUrl = hotelAffiliateUrl(d);
    const tourUrl = toursAffiliateUrl(d);

    const hasCoords = Number.isFinite(d.lat) && Number.isFinite(d.lng);
    const coords = hasCoords ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}` : "Not set";

    const tags = (d.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("");
    const highlights = (d.highlights || []).map(x => `<li>${esc(x)}</li>`).join("");

    const gallery = (d.gallery || []).slice(0, 6).map(g => `
      <div class="dest-img" style="min-height:160px;">
        <div class="dest-img__fill" style="background-image:url('${esc(g)}');"></div>
        <div class="dest-img__shade"></div>
      </div>
    `).join("");

    return `
      <div class="dest-img" style="min-height: 320px;">
        <div class="dest-img__fill" style="background-image:url('${esc(d.heroImage || "")}');"></div>
        <div class="dest-img__shade"></div>
        <div class="dest-img__label">
          <span style="display:inline-flex; align-items:center; gap:8px;">
            ${icon("pin")} ${esc(d.region)} • ${esc(d.type)}
          </span>
        </div>
      </div>

      <div style="margin-top:12px;">
        <div class="tags">${tags}</div>
      </div>

      <div class="card" style="margin-top:12px; box-shadow:none; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18);">
        <strong>Snapshot</strong>
        <div class="muted" style="margin-top:8px;">
          <div><strong>Best time:</strong> ${esc(d.bestTime || "Varies")}</div>
          <div><strong>Budget:</strong> ${esc(d.estimatedBudget || "Varies")}</div>
          <div><strong>Base:</strong> ${esc(d.stayHint || "Varies")}</div>
          <div><strong>Coordinates:</strong> ${esc(coords)}</div>
        </div>
      </div>

      <div class="disclosure" style="margin-top:12px;">
        <strong>Affiliate disclosure:</strong>
        <span class="muted">Some links may earn a commission at no extra cost to you.</span>
      </div>

      <div class="ctaRow">
        <a class="btn btn--primary" href="${esc(hotelUrl)}" target="_blank" rel="noopener">
          <span aria-hidden="true">${icon("hotel")}</span> Book Hotels
        </a>
        <a class="btn" href="${esc(tourUrl)}" target="_blank" rel="noopener">
          <span aria-hidden="true">${icon("ticket")}</span> Book Tours/Activities
        </a>
        ${hasCoords ? `<button class="btn" type="button" data-mapjump="${esc(d.id)}"><span aria-hidden="true">${icon("pin")}</span> Show on Map</button>` : ""}
      </div>

      <div class="grid" style="margin-top:12px;">
        <div class="card" style="box-shadow:none; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18);">
          <strong>Overview</strong>
          <div class="muted" style="margin-top:8px;">${esc(d.summary || "")}</div>
        </div>

        <div class="card" style="box-shadow:none; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18);">
          <strong>Highlights</strong>
          <ul class="bullets" style="margin-top:8px;">
            ${highlights || `<li>${esc("Add highlights in the CMS editor.")}</li>`}
          </ul>
        </div>
      </div>

      ${gallery ? `
        <div class="section-title" style="margin-top:16px;">
          <h2>Gallery</h2>
          <div class="muted">Selected images for visual planning.</div>
        </div>
        <div class="grid grid--2">${gallery}</div>
      ` : ""}
    `;
  }

  function renderMap() {
    if (!hasLeaflet) {
      return `
        <div class="section-title">
          <h2>Map</h2>
          <div class="muted">Map library not loaded.</div>
        </div>
        <div class="card">Leaflet is required for the map view.</div>
      `;
    }

    const typeOpts = types()
      .map(t => `<option value="${esc(t)}"${t === state.mapType ? " selected" : ""}>${esc(t)}</option>`)
      .join("");

    return `
      <div class="section-title">
        <h2>Map</h2>
        <div class="muted">Filter markers and click them for booking CTAs.</div>
      </div>

      <div class="card glass">
        <div class="controls">
          <select class="select" id="mapType">${typeOpts}</select>
          <button class="btn" id="mapFit" type="button">Fit</button>
          <button class="btn" id="mapReset" type="button">Reset</button>
        </div>
      </div>

      <div class="map-wrap" style="margin-top:14px;">
        <div id="map" aria-label="Interactive map"></div>
        <div class="card map-side" id="mapSide">
          <div class="section-title">
            <h2>Map panel</h2>
            <div class="muted">Click a marker to view details and booking links.</div>
          </div>
          <div class="muted">Use Destinations + Export to package sellable itineraries.</div>
        </div>
      </div>
    `;
  }

  function renderItineraries() {
    // Minimal placeholders (kept to avoid breaking nav).
    // You can expand this later with real itinerary templates.
    return `
      <div class="section-title">
        <h2>Itineraries</h2>
        <div class="muted">Templates will be expanded next. Export is fully functional now.</div>
      </div>

      <div class="grid grid--2">
        <div class="card">
          <strong>Golden Triangle (7 Days)</strong>
          <div class="muted" style="margin-top:6px;">Falls + Hwange + buffer day. Great for first-timers.</div>
          <div class="ctaRow" style="margin-top:12px;">
            <button class="btn btn--primary" type="button" data-build="golden-triangle-7-budget">${icon("pdf")} Build PDF</button>
            <button class="btn" type="button" data-goto="shop">Buy link (Shop)</button>
          </div>
        </div>

        <div class="card">
          <strong>Golden Triangle (10 Days)</strong>
          <div class="muted" style="margin-top:6px;">Falls + Hwange + Mana Pools. Premium positioning.</div>
          <div class="ctaRow" style="margin-top:12px;">
            <button class="btn btn--primary" type="button" data-build="golden-triangle-10-luxury">${icon("pdf")} Build PDF</button>
            <button class="btn" type="button" data-goto="shop">Buy link (Shop)</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderExport() {
    const productOpts = `
      <option value="golden-triangle-7-budget"${state.productBuildId === "golden-triangle-7-budget" ? " selected" : ""}>Golden Triangle (7) — Budget</option>
      <option value="golden-triangle-10-luxury"${state.productBuildId === "golden-triangle-10-luxury" ? " selected" : ""}>Golden Triangle (10) — Luxury</option>
      <option value="self-drive-kit"${state.productBuildId === "self-drive-kit" ? " selected" : ""}>Self-Drive Kit</option>
      <option value="safari-packing-list"${state.productBuildId === "safari-packing-list" ? " selected" : ""}>Safari Packing List</option>
      <option value="victoria-falls-activity-bible"${state.productBuildId === "victoria-falls-activity-bible" ? " selected" : ""}>Victoria Falls Activity Bible</option>
      <option value="money-logistics-sheet"${state.productBuildId === "money-logistics-sheet" ? " selected" : ""}>Money & Payments Sheet</option>
      <option value="border-handbook"${state.productBuildId === "border-handbook" ? " selected" : ""}>Border Handbook</option>
    `;

    return `
      <div class="section-title">
        <h2>Export / PDF</h2>
        <div class="muted">Build a document, then Print → Save as PDF.</div>
      </div>

      <div class="grid grid--2">
        <div class="card glass">
          <div class="section-title">
            <h2>Build</h2>
            <div class="muted">Generate a sellable PDF template instantly.</div>
          </div>

          <div class="controls">
            <select class="select" id="productBuild">${productOpts}</select>

            <button class="btn btn--primary" id="buildExport" type="button">
              <span aria-hidden="true">${icon("pdf")}</span> Build export
            </button>
            <button class="btn" id="printPdf" type="button">Print / Save as PDF</button>
            <button class="btn" id="clearExport" type="button">Clear</button>
          </div>

          <div class="disclosure" style="margin-top:12px;">
            <strong>Delivery note:</strong>
            <span class="muted">Use this to generate what you sell, then deliver the PDF via your payment platform.</span>
          </div>
        </div>

        <div class="card" id="exportDoc">
          <div class="section-title">
            <h2>GeoTourismZim — Export Document</h2>
            <div class="muted" id="exportStamp">Not built yet.</div>
          </div>
          <div id="exportBody" class="muted">Click “Build export”.</div>
        </div>
      </div>
    `;
  }

  function renderDeals() {
    const rows = DESTS.map(d => {
      const hotelUrl = hotelAffiliateUrl(d);
      const tourUrl = toursAffiliateUrl(d);
      return `
        <div class="card">
          <div class="section-title">
            <h2>${esc(d.name)}</h2>
            <div class="muted">${esc(d.region)} • ${esc(d.stayHint || "—")}</div>
          </div>
          <div class="muted">${esc(d.summary || "")}</div>

          <div class="ctaRow" style="margin-top:12px;">
            <a class="btn btn--primary" href="${esc(hotelUrl)}" target="_blank" rel="noopener">
              <span aria-hidden="true">${icon("hotel")}</span> Hotels
            </a>
            <a class="btn" href="${esc(tourUrl)}" target="_blank" rel="noopener">
              <span aria-hidden="true">${icon("ticket")}</span> Tours
            </a>
            <button class="btn" type="button" data-open="${esc(d.id)}">Details</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="section-title">
        <h2>Book Hotels & Tours</h2>
        <div class="muted">High-intent pages designed for conversions.</div>
      </div>

      <div class="disclosure">
        <strong>Affiliate disclosure:</strong>
        <span class="muted">Links may earn a commission at no extra cost to you.</span>
      </div>

      <div class="grid grid--2" style="margin-top:14px;">${rows}</div>
    `;
  }

  function renderShopLoading() {
    return `
      <div class="section-title">
        <h2>Shop</h2>
        <div class="muted">Loading products…</div>
      </div>
      <div class="card glass"><div class="muted">If this stays stuck, verify <code>products.json</code> is in the site root.</div></div>
    `;
  }

  function renderShop(productsDoc) {
    const products = productsDoc.products || [];
    const cats = productsDoc.categories || [];

    const pills = cats.map(c => `<button class="pill" type="button" data-cat="${esc(c)}">${esc(c)}</button>`).join("");

    const cards = products.map(p => {
      const link = (CFG.payments?.productCheckoutLinks || {})[p.id] || "#";
      const disabled = (link === "#" || /REPLACE_ME/i.test(link));

      const img = esc(p.coverImage || "");
      const imgBlock = img
        ? `
          <div class="dest-img" style="min-height:180px; margin-bottom:12px;">
            <div class="dest-img__fill" style="background-image:url('${img}');"></div>
            <div class="dest-img__shade"></div>
          </div>
        `
        : "";

      return `
        <div class="card" data-product-card="1" data-product-cat="${esc(p.category)}">
          ${imgBlock}
          <div class="section-title">
            <h2>${esc(p.name)}</h2>
            <div class="muted">${esc(productsDoc.currency)} ${Number(p.price).toFixed(0)} • ${esc(p.category)}</div>
          </div>
          <div class="muted">${esc(p.summary)}</div>
          <div class="muted" style="margin-top:10px;"><strong>Deliverable:</strong> ${esc(p.deliverable)}</div>

          <div class="ctaRow" style="margin-top:12px;">
            <a class="btn btn--primary" href="${esc(link)}" target="_blank" rel="noopener"
              ${disabled ? 'aria-disabled="true" onclick="return false;"' : ""}>
              ${disabled ? "Set payment link in config.js" : "Buy now"}
            </a>

            <button class="btn" type="button" data-build="${esc(p.id)}">
              <span aria-hidden="true">${icon("pdf")}</span> Build PDF
            </button>
          </div>

          ${disabled ? `<div class="muted" style="margin-top:10px;">To activate sales: paste a live payment link for <code>${esc(p.id)}</code> in <code>config.js</code>.</div>` : ""}
        </div>
      `;
    }).join("");

    return `
      <div class="section-title">
        <h2>Shop</h2>
        <div class="muted">Digital products + maps + consultation. Checkout uses your Payment Links.</div>
      </div>

      <div class="card glass">
        <div class="section-title">
          <h2>Categories</h2>
          <div class="muted">Filter products.</div>
        </div>
        <div class="pillrow" id="catRow">${pills}</div>
      </div>

      <div class="grid grid--2" id="shopGrid" style="margin-top:14px;">
        ${cards}
      </div>
    `;
  }

  function renderLogistics() {
    const moneyProduct = (CFG.payments?.productCheckoutLinks || {})["money-logistics-sheet"] || "#";

    return `
      <div class="section-title">
        <h2>Know Before You Go</h2>
        <div class="muted">Operational notes for safer, smoother trips.</div>
      </div>

      <div class="disclosure">
        <strong>Accuracy note:</strong>
        <span class="muted">Entry/currency conditions change; confirm with official sources and carriers.</span>
      </div>

      <div class="grid grid--2" style="margin-top:14px;">
        <div class="card glass">
          <div class="section-title">
            <h2>Money & Payments</h2>
            <div class="muted">Practical cash/card planning.</div>
          </div>
          <ul class="bullets">
            <li>Carry small denominations and a buffer.</li>
            <li>Do not rely on ATMs; availability varies.</li>
            <li>Keep payment redundancy (cash + card where possible).</li>
          </ul>

          <div class="ctaRow" style="margin-top:12px;">
            <a class="btn btn--primary" href="${esc(moneyProduct)}" target="_blank" rel="noopener">Buy Money Sheet</a>
            <button class="btn" type="button" data-build="money-logistics-sheet">${icon("pdf")} Build PDF</button>
          </div>
        </div>

        <div class="card">
          <div class="section-title">
            <h2>Border Prep</h2>
            <div class="muted">Compliance-focused checklist.</div>
          </div>
          <ul class="bullets">
            <li>Keep printed copies of bookings and key documents.</li>
            <li>Follow official instructions and request receipts for official fees.</li>
            <li>Build buffers for processing time.</li>
          </ul>

          <div class="ctaRow" style="margin-top:12px;">
            <button class="btn btn--primary" type="button" data-build="border-handbook">${icon("pdf")} Build Border PDF</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSupplyDemand() {
    return `
      <div class="section-title">
        <h2>Supply & Demand</h2>
        <div class="muted">A productization lens for monetization.</div>
      </div>

      <div class="grid grid--2">
        <div class="card glass">
          <strong>Conversion strategy</strong>
          <ul class="bullets" style="margin-top:10px;">
            <li>Destinations drive discovery and SEO.</li>
            <li>Deals hub drives affiliate conversions.</li>
            <li>Export templates become paid PDFs.</li>
            <li>Consultation captures high-value buyers.</li>
          </ul>
        </div>
        <div class="card">
          <strong>Next enhancements</strong>
          <ul class="bullets" style="margin-top:10px;">
            <li>Add a dedicated “Best Hotels in …” page per destination.</li>
            <li>Add a “Top Activities” module per destination.</li>
            <li>Add testimonials + trust signals on Shop + Consult.</li>
            <li>Add email capture and automated delivery workflow.</li>
          </ul>
        </div>
      </div>
    `;
  }

  function renderConsult() {
    const tripReviewLink = (CFG.payments?.productCheckoutLinks || {})["trip-review"] || "#";
    const bookUrl = CFG.consultation?.bookingUrl || "#";

    return `
      <div class="section-title">
        <h2>Paid Trip Review</h2>
        <div class="muted">Routing realism, risk points, and itinerary optimization.</div>
      </div>

      <div class="grid grid--2">
        <div class="card glass">
          <div class="section-title">
            <h2>How it works</h2>
            <div class="muted">Simple funnel.</div>
          </div>
          <ul class="bullets">
            <li>Customer purchases Trip Review.</li>
            <li>They submit details via intake form.</li>
            <li>You deliver a revised itinerary + risk notes.</li>
          </ul>

          <div class="ctaRow" style="margin-top:12px;">
            <a class="btn btn--primary" href="${esc(tripReviewLink)}" target="_blank" rel="noopener">Buy Trip Review</a>
            <a class="btn" href="${esc(bookUrl)}" target="_blank" rel="noopener">Book time</a>
          </div>

          <div class="disclosure" style="margin-top:12px;">
            <strong>Policy:</strong>
            <span class="muted">${esc(CFG.consultation?.policyText || "Consultations are advisory; confirm official requirements independently.")}</span>
          </div>
        </div>

        <div class="card">
          <div class="section-title">
            <h2>Intake form</h2>
            <div class="muted">Generate a summary your client can email you.</div>
          </div>

          <div class="grid">
            <input class="input" id="c_name" placeholder="Name" />
            <input class="input" id="c_email" placeholder="Email" />
            <input class="input" id="c_dates" placeholder="Travel dates (approx)" />
            <input class="input" id="c_style" placeholder="Style (budget / balanced / luxury / adventure)" />
            <textarea class="textarea" id="c_plan" rows="6" placeholder="Paste current itinerary draft (days, places, transport)"></textarea>
            <textarea class="textarea" id="c_notes" rows="4" placeholder="Constraints (kids, mobility, must-sees, flight times, etc.)"></textarea>

            <button class="btn btn--primary" id="c_generate" type="button">Generate Summary</button>
            <textarea class="textarea" id="c_output" rows="8" placeholder="Your summary appears here…" readonly></textarea>
          </div>
        </div>
      </div>
    `;
  }

  /* =========================
     Export templates
     ========================= */

  function exportSection(title, bodyHtml) {
    return `
      <div class="card" style="box-shadow:none; background:#fff; margin-bottom:12px;">
        <strong>${esc(title)}</strong>
        <div style="margin-top:10px;">${bodyHtml}</div>
      </div>
    `;
  }

  function exportTemplate(id) {
    switch (id) {
      case "golden-triangle-7-budget":
        return exportSection("Golden Triangle (7 Days) — Budget Blueprint", `
          <div class="muted"><strong>Positioning:</strong> Simple routing + cost controls. First-timer friendly.</div>
          <div style="margin-top:10px;">
            <strong>Day-by-day</strong>
            <ul class="bullets">
              <li>Day 1–2: Victoria Falls — viewpoints + one activity + sunset cruise.</li>
              <li>Day 3: Transfer to Hwange — settle in + afternoon drive.</li>
              <li>Day 4–5: Hwange — waterhole-focused safari days.</li>
              <li>Day 6: Buffer day — rest / light add-on.</li>
              <li>Day 7: Depart — allow transfer buffers.</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Checklist</strong>
            <ul class="bullets">
              <li>Confirm pickups and times 48–72 hours prior.</li>
              <li>Keep cash redundancy (small notes) for tips/minor purchases.</li>
              <li>Pack layers, sun protection, binoculars, power bank.</li>
            </ul>
          </div>
        `);

      case "golden-triangle-10-luxury":
        return exportSection("Golden Triangle (10 Days) — Luxury Safari Planner", `
          <div class="muted"><strong>Positioning:</strong> Premium logistics and reduced friction.</div>
          <div style="margin-top:10px;">
            <strong>Day-by-day</strong>
            <ul class="bullets">
              <li>Day 1–3: Victoria Falls — viewpoints + premium activity + cruise.</li>
              <li>Day 4–6: Hwange — upgraded lodge + structured drives.</li>
              <li>Day 7–10: Mana Pools — fly-in preferred; canoe + walking safaris.</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Supplier workflow</strong>
            <ul class="bullets">
              <li>Confirm every pickup: time, location, vehicle, contact number.</li>
              <li>Share a single master itinerary PDF with suppliers.</li>
              <li>Keep contingency buffers for weather and operations.</li>
            </ul>
          </div>
        `);

      case "self-drive-kit":
        return exportSection("Zimbabwe Self-Drive Kit", `
          <div class="muted"><strong>Compliance note:</strong> Follow lawful instructions at all times.</div>
          <div style="margin-top:10px;">
            <strong>Vehicle readiness</strong>
            <ul class="bullets">
              <li>Spare tire + tools; working lights; reflective triangle.</li>
              <li>Emergency kit: water, torch, first aid, power bank.</li>
              <li>Documents: license, insurance, rental authorization (if applicable).</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Operational planning</strong>
            <ul class="bullets">
              <li>Fuel planning: do not assume availability on remote legs.</li>
              <li>Offline maps + printed confirmations.</li>
              <li>Time buffers for roads and delays.</li>
            </ul>
          </div>
        `);

      case "safari-packing-list":
        return exportSection("Zimbabwe Safari Packing List", `
          <div style="margin-top:10px;">
            <strong>Clothing</strong>
            <ul class="bullets">
              <li>Neutral tones, closed shoes, hat, and layers.</li>
              <li>Cool mornings, warm afternoons are common.</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Health</strong>
            <ul class="bullets">
              <li>Personal meds + prescriptions; repellent; blister care.</li>
              <li>Consult a clinician for malaria-area precautions.</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Tech</strong>
            <ul class="bullets">
              <li>Universal adapter, power bank, spare cables.</li>
              <li>Offline maps + backup contacts.</li>
            </ul>
          </div>
        `);

      case "victoria-falls-activity-bible":
        return exportSection("Victoria Falls Activity Bible", `
          <div class="muted">Use as a planning matrix: timing, bookings, and friction reduction.</div>
          <div style="margin-top:10px;">
            <strong>Core set</strong>
            <ul class="bullets">
              <li>Falls viewpoints (half-day minimum).</li>
              <li>Sunset cruise (ideal day-1 anchor).</li>
              <li>One premium activity (seasonal/preference-based).</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Booking logic</strong>
            <ul class="bullets">
              <li>Confirm pickup points and times.</li>
              <li>Keep a flex window for weather and flow changes.</li>
              <li>Use licensed operators and follow safety briefings.</li>
            </ul>
          </div>
        `);

      case "money-logistics-sheet":
        return exportSection("Money & Payments Quick Sheet (ZiG / USD planning)", `
          <div class="muted">Plan redundancy: card acceptance and ATM access can vary.</div>
          <div style="margin-top:10px;">
            <strong>Cash plan</strong>
            <ul class="bullets">
              <li>Carry small denominations.</li>
              <li>Split cash between secure locations.</li>
              <li>Keep receipts for larger purchases.</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>Cards / ATMs</strong>
            <ul class="bullets">
              <li>Assume some locations may not accept foreign cards.</li>
              <li>Do not rely solely on ATMs; keep a buffer.</li>
            </ul>
          </div>
        `);

      case "border-handbook":
        return exportSection("Border Crossing Handbook (Compliance Guide)", `
          <div class="muted">Requirements and fees change. Confirm with official sources and carriers.</div>
          <div style="margin-top:10px;">
            <strong>Before travel</strong>
            <ul class="bullets">
              <li>Confirm entry/visa plan and passport validity.</li>
              <li>If driving: vehicle documents + insurance + authorization.</li>
              <li>Printed pack: bookings, emergency contacts, copies of key documents.</li>
            </ul>
          </div>
          <div style="margin-top:10px;">
            <strong>At the border</strong>
            <ul class="bullets">
              <li>Follow signage and official instructions.</li>
              <li>Maintain respectful communication and comply with lawful directions.</li>
              <li>Request official receipts where appropriate.</li>
            </ul>
          </div>
        `);

      default:
        return `<div class="muted">Unknown product template: ${esc(id)}</div>`;
    }
  }

  /* =========================
     Map
     ========================= */

  function initMap() {
    if (!hasLeaflet) return;

    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    if (map) {
      map.invalidateSize();
      refreshMarkers();
      return;
    }

    map = window.L.map("map", { scrollWheelZoom: true });
    map.setView([-19.0, 29.0], 6);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    markersLayer = window.L.layerGroup().addTo(map);
    refreshMarkers();
    fitMapToMarkers();
  }

  function refreshMarkers() {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    const side = document.getElementById("mapSide");

    const filtered = DESTS.filter(d => {
      const hasCoords = Number.isFinite(d.lat) && Number.isFinite(d.lng);
      if (!hasCoords) return false;
      if (state.mapType === "All") return true;
      return d.type === state.mapType;
    });

    filtered.forEach(d => {
      const m = window.L.marker([d.lat, d.lng]).addTo(markersLayer);
      m.bindPopup(`<strong>${esc(d.name)}</strong><br/><span>${esc(d.region)}</span>`);

      m.on("click", () => {
        const hotelUrl = hotelAffiliateUrl(d);
        const tourUrl = toursAffiliateUrl(d);

        if (side) {
          side.innerHTML = `
            <div class="section-title">
              <h2>${esc(d.name)}</h2>
              <div class="muted">${esc(d.region)} • ${esc(d.stayHint || "—")}</div>
            </div>

            <div class="dest-img" style="min-height: 180px;">
              <div class="dest-img__fill" style="background-image:url('${esc(d.heroImage || "")}');"></div>
              <div class="dest-img__shade"></div>
            </div>

            <div class="disclosure" style="margin-top:12px;">
              <strong>Affiliate disclosure:</strong>
              <span class="muted">Links may earn a commission at no extra cost to you.</span>
            </div>

            <div class="ctaRow">
              <a class="btn btn--primary" href="${esc(hotelUrl)}" target="_blank" rel="noopener">${icon("hotel")} Hotels</a>
              <a class="btn" href="${esc(tourUrl)}" target="_blank" rel="noopener">${icon("ticket")} Tours</a>
              <button class="btn" id="mapOpenDetails" type="button">${icon("pin")} Full details</button>
            </div>

            <div class="card" style="box-shadow:none; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18); margin-top:12px;">
              <strong>Summary</strong>
              <div class="muted">${esc(d.summary || "")}</div>
            </div>
          `;

          const btn = document.getElementById("mapOpenDetails");
          if (btn) btn.addEventListener("click", () => openDrawer(d.name, renderDestinationDetail(d)));
        }
      });
    });
  }

  function fitMapToMarkers() {
    if (!map || !markersLayer) return;
    const layers = markersLayer.getLayers();
    if (!layers.length) return;
    const group = window.L.featureGroup(layers);
    map.fitBounds(group.getBounds().pad(0.18));
  }

  /* =========================
     Wiring
     ========================= */

  function wireDestinations() {
    const q = document.getElementById("destQuery");
    const r = document.getElementById("destRegion");
    const t = document.getElementById("destType");
    const reset = document.getElementById("destReset");

    if (q) q.addEventListener("input", () => { state.q = q.value; render(); });
    if (r) r.addEventListener("change", () => { state.region = r.value; render(); });
    if (t) t.addEventListener("change", () => { state.type = t.value; render(); });

    if (reset) reset.addEventListener("click", () => {
      state.q = "";
      state.region = "All";
      state.type = "All";
      render();
    });

    outlet.querySelectorAll("[data-open-dest]").forEach(card => {
      const open = () => {
        const id = card.getAttribute("data-open-dest");
        const dest = DESTS.find(x => x.id === id);
        if (dest) openDrawer(dest.name, renderDestinationDetail(dest));
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  }

  function wireDeals() {
    outlet.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open");
        const dest = DESTS.find(x => x.id === id);
        if (dest) openDrawer(dest.name, renderDestinationDetail(dest));
      });
    });
  }

  function wireMap() {
    const filter = document.getElementById("mapType");
    const fit = document.getElementById("mapFit");
    const reset = document.getElementById("mapReset");

    if (filter) {
      filter.addEventListener("change", () => {
        state.mapType = filter.value;
        refreshMarkers();
      });
    }

    if (reset) {
      reset.addEventListener("click", () => {
        state.mapType = "All";
        render();
        initMap();
      });
    }

    if (fit) fit.addEventListener("click", () => fitMapToMarkers());
  }

  function wireExport() {
    const productBuild = document.getElementById("productBuild");
    const buildBtn = document.getElementById("buildExport");
    const printBtn = document.getElementById("printPdf");
    const clearBtn = document.getElementById("clearExport");

    if (productBuild) {
      productBuild.addEventListener("change", () => {
        state.productBuildId = productBuild.value;
      });
    }

    if (buildBtn) {
      buildBtn.addEventListener("click", () => {
        const stamp = document.getElementById("exportStamp");
        const body = document.getElementById("exportBody");
        const now = new Date();
        if (stamp) stamp.textContent = `Generated on ${now.toLocaleString()}`;
        if (body) body.innerHTML = exportTemplate(state.productBuildId);
      });
    }

    if (printBtn) printBtn.addEventListener("click", () => window.print());

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const stamp = document.getElementById("exportStamp");
        const body = document.getElementById("exportBody");
        if (stamp) stamp.textContent = "Cleared.";
        if (body) body.textContent = "Export cleared. Build again when ready.";
      });
    }
  }

  async function wireShop() {
    try {
      const doc = await loadProducts();
      outlet.innerHTML = renderShop(doc);
      renderHeroSnapshot(doc);

      const grid = document.getElementById("shopGrid");

      outlet.querySelectorAll("[data-cat]").forEach(p => {
        p.addEventListener("click", () => {
          const cat = p.getAttribute("data-cat");
          const cards = Array.from(grid.querySelectorAll("[data-product-card]"));
          cards.forEach(card => {
            const c = card.getAttribute("data-product-cat");
            card.style.display = (!cat || c === cat) ? "" : "none";
          });

          outlet.querySelectorAll("[data-cat]").forEach(x => x.classList.remove("is-on"));
          p.classList.add("is-on");
        });
      });

      outlet.querySelectorAll("[data-build]").forEach(btn => {
        btn.addEventListener("click", () => {
          state.productBuildId = btn.getAttribute("data-build");
          setView("export");
          setTimeout(() => {
            const buildBtn = document.getElementById("buildExport");
            if (buildBtn) buildBtn.click();
          }, 0);
        });
      });
    } catch (e) {
      outlet.innerHTML = `
        <div class="section-title"><h2>Shop</h2><div class="muted">Error loading products.</div></div>
        <div class="card"><strong>Fix:</strong><div class="muted">Ensure <code>products.json</code> exists in the site root. ${esc(e?.message || e)}</div></div>
      `;
    }
  }

  function wireConsult() {
    const gen = document.getElementById("c_generate");
    if (!gen) return;

    gen.addEventListener("click", () => {
      const name = document.getElementById("c_name").value.trim();
      const email = document.getElementById("c_email").value.trim();
      const dates = document.getElementById("c_dates").value.trim();
      const style = document.getElementById("c_style").value.trim();
      const plan = document.getElementById("c_plan").value.trim();
      const notes = document.getElementById("c_notes").value.trim();

      const out = document.getElementById("c_output");
      out.value =
`Trip Review Intake — GeoTourismZim

Client: ${name || "(name not provided)"}
Email: ${email || "(email not provided)"}
Dates: ${dates || "(not provided)"}
Style: ${style || "(not provided)"}

Current Itinerary Draft:
${plan || "(not provided)"}

Constraints / Notes:
${notes || "(not provided)"}

Requested outcome:
- Validate routing realism and transfer friction
- Identify risk points (seasonality, access, buffers)
- Provide optimized day-by-day structure and booking priorities
`;
    });
  }

  function wireSharedButtons() {
    // Build buttons used in itineraries/logistics placeholders
    outlet.querySelectorAll("[data-build]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.productBuildId = btn.getAttribute("data-build");
        setView("export");
        setTimeout(() => {
          const buildBtn = document.getElementById("buildExport");
          if (buildBtn) buildBtn.click();
        }, 0);
      });
    });

    outlet.querySelectorAll("[data-goto]").forEach(btn => {
      btn.addEventListener("click", () => setView(btn.getAttribute("data-goto")));
    });
  }

  /* =========================
     Render router
     ========================= */

  function render() {
    switch (state.view) {
      case "destinations":
        outlet.innerHTML = renderDestinations();
        wireDestinations();
        break;

      case "map":
        outlet.innerHTML = renderMap();
        wireMap();
        initMap();
        break;

      case "itineraries":
        outlet.innerHTML = renderItineraries();
        wireSharedButtons();
        break;

      case "export":
        outlet.innerHTML = renderExport();
        wireExport();
        break;

      case "deals":
        outlet.innerHTML = renderDeals();
        wireDeals();
        break;

      case "shop":
        outlet.innerHTML = renderShopLoading();
        wireShop();
        break;

      case "logistics":
        outlet.innerHTML = renderLogistics();
        wireSharedButtons();
        break;

      case "supply-demand":
        outlet.innerHTML = renderSupplyDemand();
        break;

      case "consult":
        outlet.innerHTML = renderConsult();
        wireConsult();
        break;

      default:
        state.view = "destinations";
        outlet.innerHTML = renderDestinations();
        wireDestinations();
        break;
    }
  }

  /* =========================
     Global events
     ========================= */

  // Tabs
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      setView(btn.dataset.view);

      // Close mobile menu after navigation
      if (window.matchMedia("(max-width: 720px)").matches) {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Hero jumps
  if (jumpShop) jumpShop.addEventListener("click", () => setView("shop"));
  if (jumpDeals) jumpDeals.addEventListener("click", () => setView("deals"));
  if (jumpExport) jumpExport.addEventListener("click", () => setView("export"));

  // Mobile nav toggle
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Drawer close
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  // Drawer “Show on Map”
  if (drawerBody) {
    drawerBody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mapjump]");
      if (!btn) return;

      const id = btn.getAttribute("data-mapjump");
      const dest = DESTS.find(d => d.id === id);
      if (!dest || !Number.isFinite(dest.lat) || !Number.isFinite(dest.lng)) return;

      closeDrawer();
      setView("map");
      setTimeout(() => {
        initMap();
        map.setView([dest.lat, dest.lng], clamp(9, 6, 12));
      }, 0);
    });
  }

  // Preload products for hero metrics (non-blocking)
  loadProducts().then((doc) => renderHeroSnapshot(doc)).catch(() => renderHeroSnapshot(null));

  // Initial render
  setView("destinations");
})();
