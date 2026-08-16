
(() => {
  const cfg = window.STORE_CONFIG || {};

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // ---------- Navigation / prelaunch ----------
  const minimalNavItems = $$("[data-minimal-nav]");
  minimalNavItems.forEach(el => {
    if (!cfg.showMinimalInNavigation) el.hidden = true;
  });

  const teaser = $("[data-minimal-teaser]");
  if (teaser && !cfg.showMinimalTeaserOnHome) teaser.hidden = true;

  // ---------- Mobile menu ----------
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-mobile-menu]");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // ---------- Currency ----------
  const currency = $("[data-currency]");
  const savedCurrency = localStorage.getItem("ysmf_currency") || cfg.defaultCurrency || "GBP";
  if (currency) {
    currency.value = savedCurrency;
    currency.addEventListener("change", () => {
      localStorage.setItem("ysmf_currency", currency.value);
      if ($("[data-products-grid]")) loadProducts();
    });
  }

  // ---------- Active nav ----------
  const filename = location.pathname.split("/").pop() || "index.html";
  $$("[data-nav-link]").forEach(a => {
    const href = (a.getAttribute("href") || "").split("?")[0];
    if (href === filename || (filename === "" && href === "index.html")) a.classList.add("active");
  });

  // ---------- Fourthwall product fetch ----------
  async function fetchCollectionProducts(slug) {
    const token = cfg.storefrontToken;
    if (!token) throw new Error("NO_TOKEN");
    const curr = (localStorage.getItem("ysmf_currency") || cfg.defaultCurrency || "GBP").toUpperCase();
    const url = `https://storefront-api.fourthwall.com/v1/collections/${encodeURIComponent(slug)}/products?storefront_token=${encodeURIComponent(token)}&currency=${encodeURIComponent(curr)}&size=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fourthwall returned ${res.status}`);
    return res.json();
  }

  function money(value, currency) {
    try {
      return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(value));
    } catch {
      return `${currency} ${Number(value).toFixed(2)}`;
    }
  }

  function productCard(product) {
    const image = product.images?.[0]?.transformedUrl || product.images?.[0]?.url || "";
    const variant = product.variants?.[0];
    const price = variant?.unitPrice;
    const href = `${cfg.fourthwallShopUrl}/products/${product.slug}`;

    const article = document.createElement("article");
    article.className = "product-card";
    article.innerHTML = `
      <a href="${href}" target="_self" aria-label="View ${escapeHtml(product.name)}">
        <div class="product-image">
          ${image ? `<img loading="lazy" src="${image}" alt="${escapeHtml(product.name)}">` : ""}
        </div>
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <p class="product-price">${price ? money(price.value, price.currency) : "View product"}</p>
        </div>
      </a>`;
    return article;
  }

  function escapeHtml(str="") {
    return String(str).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
  }

  async function loadProducts() {
    const grid = $("[data-products-grid]");
    if (!grid) return;
    const pageCollection = grid.dataset.collection || "all";
    let slug = pageCollection;
    if (pageCollection === "signature") slug = cfg.signatureCollectionSlug;
    if (pageCollection === "minimal") slug = cfg.minimalCollectionSlug;

    grid.innerHTML = `<div class="loading">Loading products…</div>`;

    if (!cfg.storefrontToken) {
      grid.innerHTML = `
        <div class="api-note">
          <strong>Fourthwall connection not added yet.</strong><br>
          Add your Storefront token in <code>assets/config.js</code>. Until then,
          use the button below to open the live Fourthwall shop.<br><br>
          <a class="btn btn-primary" href="${cfg.fourthwallShopUrl}" target="_blank" rel="noopener">
            Open Fourthwall shop <span class="arrow">↗</span>
          </a>
        </div>`;
      return;
    }

    if (pageCollection === "minimal" && !cfg.minimalIsLive) {
      grid.innerHTML = `
        <div class="empty-state">
          YSMF Minimal is currently set to pre-launch mode. Change
          <code>minimalIsLive</code> to <code>true</code> in <code>assets/config.js</code>
          when the collection is public.
        </div>`;
      return;
    }

    try {
      const data = await fetchCollectionProducts(slug);
      grid.innerHTML = "";
      (data.results || []).forEach(p => grid.appendChild(productCard(p)));
      if (!data.results?.length) {
        grid.innerHTML = `<div class="empty-state">No public products are currently available in this collection.</div>`;
      }
    } catch (err) {
      console.error(err);
      grid.innerHTML = `
        <div class="api-note">
          Could not load Fourthwall products. Check the Storefront token and collection slug in
          <code>assets/config.js</code>.
        </div>`;
    }
  }

  loadProducts();
})();
